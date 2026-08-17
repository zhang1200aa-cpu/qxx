/**
 * csv.js — 零依赖流式 CSV 解析器（字节级状态机）
 *
 * 目标：解析 Companies House 官方 Free Company Data Product 的 CSV（UTF-8 BOM、
 * CRLF 换行、双引号包裹字段内可含逗号/换行、"" 转义）。输出 objectMode 行流。
 *
 * 用法：
 *   createReadStream(file).pipe(createCsvParser()).on("data", (row) => row); // row: string[]
 */
import { Transform } from "node:stream";

export function createCsvParser() {
  const st = {
    pending: null, // 跨 chunk 残留（Buffer）
    bomHandled: false,
    inQuote: false, // 当前在引号内
    afterQuote: false, // 引号刚闭合，等待后续字节
    skipLf: false, // 上一字节是 \r（CRLF 的 \n 应吞掉；字段外）
    field: [],
    row: [],
    line: 0,
  };

  function finishField(s) {
    if (s.field.length) s.row.push(Buffer.from(s.field).toString("utf8"));
    else s.row.push("");
    s.field = [];
  }

  function finishRecord(s, out) {
    if (s.row.length) {
      s.line += 1;
      out.push(s.row);
      s.row = [];
    }
  }

  return new Transform({
    readableObjectMode: true,
    transform(chunk, _enc, cb) {
      try {
        let data = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        if (st.pending) {
          data = Buffer.concat([st.pending, data]);
          st.pending = null;
        }
        // UTF-8 BOM：只在文件首部出现；首块不足 3 字节则整块挂起
        if (!st.bomHandled) {
          if (data.length < 3) {
            st.pending = data;
            return cb();
          }
          if (data[0] === 0xef && data[1] === 0xbb && data[2] === 0xbf) data = data.subarray(3);
          st.bomHandled = true;
        }

        const out = [];
        for (let i = 0; i < data.length; i++) {
          if (st.skipLf) {
            st.skipLf = false;
            if (data[i] === 0x0a) continue; // 吞掉 CRLF 中的 LF
          }
          const b = data[i];

          if (st.inQuote) {
            if (b === 0x22) {
              st.inQuote = false;
              st.afterQuote = true; // 先假定闭合，下一字节决定是 "" 转义还是字段结束
            } else {
              st.field.push(b); // 引号内可含 , \r \n
            }
            continue;
          }

          if (st.afterQuote) {
            if (b === 0x22) {
              st.field.push(0x22); // 转义字面引号 ""
              st.inQuote = true;
              st.afterQuote = false;
              continue;
            }
            st.afterQuote = false;
            if (b === 0x2c) {
              finishField(st);
              continue;
            }
            if (b === 0x0d) {
              finishField(st);
              finishRecord(st, out);
              st.skipLf = true;
              continue;
            }
            if (b === 0x0a) {
              finishField(st);
              finishRecord(st, out);
              continue;
            }
            // 非标情况：闭合引号后紧跟其他字符 → 本字段结束，该字符视为新字段首字节
            finishField(st);
            st.field = [b];
            continue;
          }

          // 普通字段
          if (b === 0x22 && st.field.length === 0) {
            st.inQuote = true;
            continue;
          }
          if (b === 0x2c) {
            finishField(st);
            continue;
          }
          if (b === 0x0d) {
            finishField(st);
            finishRecord(st, out);
            st.skipLf = true;
            continue;
          }
          if (b === 0x0a) {
            finishField(st);
            finishRecord(st, out);
            continue;
          }
          st.field.push(b);
        }
        for (const r of out) this.push(r);
        cb();
      } catch (err) {
        cb(err);
      }
    },
    flush(cb) {
      try {
        const out = [];
        if (st.field.length || st.row.length) {
          finishField(st);
          finishRecord(st, out);
        }
        for (const r of out) this.push(r);
        cb();
      } catch (err) {
        cb(err);
      }
    },
  });
}