/**
 * 环境补充声明（本文件无 import/export，作为全局 ambient 模块声明）
 *
 * @types/node@20 尚未内置 node:sqlite；pg 为可选依赖未安装：
 * 这里为运行时调用补最小类型，编译通过即可，实际可用性由运行时保障。
 */
declare module "node:sqlite" {
  export class DatabaseSync {
    constructor(path: string, options?: { readOnly?: boolean });
    prepare(sql: string): {
      run(...params: unknown[]): unknown;
      get(...params: unknown[]): Record<string, unknown> | undefined;
      all(...params: unknown[]): Array<Record<string, unknown>>;
    };
    exec(sql: string): void;
    close(): void;
  }
}

declare module "pg" {
  export class Pool {
    constructor(options?: { connectionString?: string; max?: number });
    query(
      text: string,
      params?: readonly unknown[]
    ): Promise<{ rows: Array<Record<string, unknown>>; rowCount: number | null }>;
    end(): Promise<void>;
  }
}