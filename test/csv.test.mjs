/**
 * csv.test.mjs — 流式 CSV 解析器单测（node:test）
 * 覆盖：UTF-8 BOM、CRLF/LF、引号包裹字段内的逗号/换行、"" 转义、行尾无换行。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { createCsvParser } from "../scripts/ch-sync/csv.js";

function parse(text) {
  return new Promise((resolve, reject) => {
    const rows = [];
    Readable.from([Buffer.from(text)])
      .pipe(createCsvParser())
      .on("data", (r) => rows.push(r))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

test("基础：BOM + CRLF + 普通字段", async () => {
  const rows = await parse("\ufeffa,b,c\r\n1,2,3\r\n");
  assert.deepEqual(rows, [
    ["a", "b", "c"],
    ["1", "2", "3"],
  ]);
});

test("引号包裹字段内允许逗号", async () => {
  const rows = await parse(`10,"TESCO, PLC",active\r\n`);
  assert.deepEqual(rows, [["10", "TESCO, PLC", "active"]]);
});

test("CSV 双引号转义为字面引号", async () => {
  const rows = await parse(`1,"NORTHERN ""MART"" LTD",x\r\n`);
  assert.deepEqual(rows, [["1", 'NORTHERN "MART" LTD', "x"]]);
});

test("引号字段内允许换行", async () => {
  const rows = await parse('00445790,"WEIRD\nNAMES LTD",plc\r\n');
  assert.deepEqual(rows, [["00445790", "WEIRD\nNAMES LTD", "plc"]]);
});

test("字段内可含 CRLF", async () => {
  const rows = await parse('a,"line1\r\nline2",b\r\n');
  assert.deepEqual(rows, [["a", "line1\r\nline2", "b"]]);
});

test("行尾无换行也能解析最后一行", async () => {
  const rows = await parse('a,b\r\n1,2');
  assert.deepEqual(rows, [
    ["a", "b"],
    ["1", "2"],
  ]);
});

test("跨 chunk 的行（挂起缓冲）不会拆坏字段", async () => {
  const text = '00,"TESCO PLC",active\r\nSC123456,"ACME LTD",active\r\n';
  const rows = [];
  const parser = createCsvParser();
  // 逐 5 字节喂入，强制触发跨 chunk/字段切分
  for (let i = 0; i < text.length; i += 5) {
    parser.write(Buffer.from(text.slice(i, i + 5)));
  }
  await new Promise((res) => {
    parser.on("data", (r) => rows.push(r));
    parser.on("end", res);
    parser.end();
  });
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[1], ["SC123456", "ACME LTD", "active"]);
});