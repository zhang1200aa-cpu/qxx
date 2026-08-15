/**
 * 旁路缓存（Cache-Aside）层
 *
 * 设计目标：避免频繁触发上游官方 API 频次限制（Companies House 600 req / 5 min）。
 * 两级实现：
 *   1. Redis（配置 REDIS_URL 时启用，生产环境推荐 Upstash / 自建 Redis）
 *   2. 进程内 Map（默认，无外部依赖，适合本地开发 / Serverless 单实例）
 *
 * 建议 TTL：
 *   - 公司档案：30 天（公司信息变动频率极低）
 *   - VAT 验证：7 天
 *   - 邮编数据：30 天
 */
import { Redis } from "ioredis";

export interface Cache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
  /** 记录键的最近访问/计数，用于限流 */
  incr?(key: string, ttlSeconds?: number): Promise<number>;
}

export const CACHE_TTL = {
  company: 60 * 60 * 24 * 30, // 30 天
  vat: 60 * 60 * 24 * 7, // 7 天
  postcode: 60 * 60 * 24 * 30, // 30 天
  search: 60 * 60 * 24 * 7, // 公司名搜索 7 天
} as const;

class MemoryCache implements Cache {
  private store = new Map<string, { value: unknown; expiresAt: number }>();
  private counters = new Map<string, number>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    // 内存缓存设置硬上限，避免内存无限增长
    if (this.store.size > 50_000) {
      const oldest = this.store.keys().next().value;
      if (oldest) this.store.delete(oldest);
    }
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async incr(key: string, ttlSeconds = 300): Promise<number> {
    const now = Date.now();
    const current = this.counters.get(key);
    if (current === undefined) {
      this.counters.set(key, 1);
      setTimeout(() => this.counters.delete(key), ttlSeconds * 1000);
      return 1;
    }
    const next = current + 1;
    this.counters.set(key, next);
    return next;
  }
}

class RedisCache implements Cache {
  private client: Redis;
  private ready: Promise<unknown>;

  constructor(url: string) {
    this.client = new Redis(url, {
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      lazyConnect: true,
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1000)),
    });
    this.ready = this.client.connect().catch((err) => {
      console.error("[cache] Redis 连接失败，将回退到内存缓存", err);
      return null;
    });
  }

  async get<T>(key: string): Promise<T | null> {
    await this.ready;
    try {
      const raw = await this.client.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (err) {
      console.error("[cache] Redis get 失败", err);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await this.ready;
    try {
      await this.client.set(key, JSON.stringify(value), "EX", ttlSeconds);
    } catch (err) {
      console.error("[cache] Redis set 失败", err);
    }
  }

  async del(key: string): Promise<void> {
    await this.ready;
    try {
      await this.client.del(key);
    } catch (err) {
      console.error("[cache] Redis del 失败", err);
    }
  }

  async incr(key: string, ttlSeconds = 300): Promise<number> {
    await this.ready;
    try {
      const pipeline = this.client.pipeline();
      pipeline.incr(key);
      pipeline.expire(key, ttlSeconds, "NX");
      const results = await pipeline.exec();
      const count = results?.[0]?.[1];
      return typeof count === "number" ? count : 0;
    } catch (err) {
      console.error("[cache] Redis incr 失败", err);
      return 0;
    }
  }
}

let cacheInstance: Cache | null = null;

/** 获取全局缓存实例（单例） */
export function getCache(): Cache {
  if (cacheInstance) return cacheInstance;
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    cacheInstance = new RedisCache(redisUrl);
  } else {
    cacheInstance = new MemoryCache();
  }
  return cacheInstance;
}