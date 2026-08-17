# Companies House 数据管道（scripts/ch-sync）

把官方全量企业数据"搬到自己的数据库"，让线上页面命中本地库而不是实时打 REST API
（REST API 限 600 次 / 5 分钟，全量 pSEO 页面无法承受）。

## 工作流

```
① 每月一次（可选）      ② 持续（增量）
Free Company Data     Streaming API
  快照 zip  ──┐            │
              ▼            ▼
      snapshot.js  ──►  companies 表  ◄── streaming.js
      （流式 Upsert）     （SQLite/PG）    （timepoint 断点续传）
```

## 数据源

- **快照（批量）**：官方 Free Company Data Product，每月更新，OGL v3 许可
  - 下载页：<https://find-and-update.company-information.service.gov.uk> → 侧栏 “Free Company Data Product”
  - 直链示例：`https://download.companieshouse.gov.uk/BasicCompanyData-2026-08-01.zip`（约 700MB，~500 万家公司）
  - 或用第三方 provider 镜像（如 <https://companieshouse.info> 的 daily snapshot）
- **增量（Streaming API）**：<https://developer.company-information.service.gov.uk/streaming-api/overview>
  - 需**单独申请 Streaming API Key**（与 REST Key 不通用），以 HTTP Basic 提交（用户名=Key，密码空）

## 用法

```bash
# 1) 生成本地调试 fixture（mock/*.csv、mock/*.ndjson）
npm run ch:fixtures

# 2) 批量导入快照（.zip 自动解压；.csv 直接读）
npm run ch:snapshot -- --input BasicCompanyData-2026-08-01.zip
#    调试只导前 10 万行：
npm run ch:snapshot -- --input mock/sample-snapshot.csv --limit 100000

# 3) 增量监听（真实模式，长轮询自动断点续传）
COMPANIES_HOUSE_STREAMING_API_KEY=xxxx npm run ch:stream
#    无 Key 时用本地 NDJSON 验证解析/写入链路：
npm run ch:stream -- --file mock/sample-events.ndjson
```

### 数据库选择

- **默认 SQLite**（Node ≥ 22.5 内置 `node:sqlite`，零依赖）：`data/ch-companies.db`
- **PostgreSQL**：`--db postgres://user:pass@host:5432/dbname`（需先 `npm i pg`）
- 可用 `CH_SYNC_DB` 环境变量统一指定。

## 表结构

| 表 | 说明 |
|---|---|
| `companies` | 主表：company_number（PK）、company_name、company_category、company_status、country_of_origin、incorporation_date、dissolution_date、reg_address_*、accounts_next_due、accounts_last_made_up_to、confirmation_statement_*、sic_codes（JSON 数组）、primary_sic_code、uri、previous_names（JSON 数组）、source（snapshot/stream）、last_event_timepoint、synced_at |
| `sync_meta` | 同步断点：`last_snapshot_run`、`streaming_last_timepoint` |
| `stream_events` | Streaming 事件审计（timepoint PK，可随时清空） |

**Upsert 语义**：`INSERT ... ON CONFLICT (company_number) DO UPDATE SET col = COALESCE(excluded.col, companies.col)`——
新数据里为空的字段保留库中旧值，防止 Streaming 事件缺省字段时误清快照数据。

## 设计要点

- **流式**：zip 用 `unzip -p`（macOS/Linux）直接管道到 stdout 零落盘；Windows 用内置 bsdtar 解临时目录。
  CSV 解析器为字节级状态机（`csv.js`），正确处理 UTF-8 BOM、CRLF、引号包裹字段内逗号/换行、`""` 转义。
- **批量事务**：默认每 5000 行 `BEGIN/COMMIT`；Prepared Statement 复用；`--limit` 便于试跑。
- **幂等可续**：Upsert 幂等，导入中途 Ctrl+C 后重跑即可续完；Streaming 每次事件落地 timepoint，断线重连自动从断点继续。
- **SIC 清洗**：快照文本 `"62020 - Information technology consultancy activities"` → 提取 5 位数字码；`"None Supplied"` → NULL。

## 常见问题

- `Streaming Key` 与 REST Key 不同，需在 developer 后台单独申请；缺 Key 时 `npm run ch:stream` 会报错并提示 `--file` 离线调试。
- VPS 上跑 SQLite 需 **Node ≥ 22.5**（`node -v` 检查）；若 Node 版本较旧，请用 PostgreSQL 模式或升级 Node。
- 快照 zip 体积大（~700MB），首次导入建议在 VPS 本机执行；导入约 500 万行 SQLite 用时取决于磁盘。
