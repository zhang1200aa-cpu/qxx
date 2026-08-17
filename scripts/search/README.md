# Meilisearch 搜索补全（scripts/search）

为站点搜索框提供毫秒级公司名/CRN 前缀补全（Autocomplete）。数据来源于
`scripts/ch-sync` 管道产出的 `companies` 表。

## 工作流

```
companies 表（ch-sync 管道）
   └── sync.mjs（全量/分批写文档）──► Meilisearch ◄── GET /api/search ◄── SearchBox（防抖 150ms）
                                          ▲
                                    index-settings.mjs
                                   （索引配置与纠错）
```

## 1) 启动 Meilisearch（可选 Docker）

```bash
docker run -p 7700:7700 getmeili/meilisearch --master-key=masterKey
# 或下载二进制：https://www.meilisearch.com/docs/learn/getting_started/installation
```

## 2) 创建索引并下发设置

```bash
MEILISEARCH_URL=http://127.0.0.1:7700 MEILISEARCH_KEY=masterKey npm run ms:settings
```

配置项：
- `searchableAttributes`：company_name / company_number / previous_names / sic_codes
- `typoTolerance`：开启（oneTypo≥5 字符、twoTypos≥9 字符）
- `prefixSearch`：默认开启 —— 输入 `tes` 即前缀命中 `TESCO PLC`
- `filterableAttributes`：company_status / company_category / country_of_origin

## 3) 全量同步文档

```bash
MEILISEARCH_URL=http://127.0.0.1:7700 MEILISEARCH_KEY=masterKey npm run ms:sync
# 可选：--db data/ch-companies.db --index companies --limit 10000 --batch 10000
```

## 4) 站点接入

- 配置 `.env.local`：`MEILISEARCH_URL` / `MEILISEARCH_KEY` / `MEILISEARCH_INDEX`
- 前端 `SearchBox`（公司 tab）输入 ≥2 字符 → **防抖 150ms** → `GET /api/search?q=…` → **Top 8** 下拉
- 直接跳转 `/company/{CRN}`；未配置 Meilisearch 时自动回到"提交到结果页"的既有行为

## 增量更新建议

- 全量仅 500~800 万文档，每批 1 万条，Serveless/定时任务（cron 每日）足够；
- 若已启用 `streaming.js` 实时监听，可在公司档案 Upsert 后追加单条文档：
  `POST /indexes/companies/documents`（文档结构与 sync.mjs 一致）。