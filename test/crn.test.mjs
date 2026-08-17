/**
 * crn.test.mjs — 英国公司号校验/规范化单测（node:test）
 * 运行：npm test（或 node --test test/）
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CRN_PREFIXES,
  isValidCrn,
  normalizeCrn,
  cleanCrn,
} from "../lib/crn.ts";

test("CRN_PREFIXES 覆盖 19 种官方前缀", () => {
  assert.equal(CRN_PREFIXES.length, 19);
  for (const p of ["SC", "NI", "OC", "SO", "NC", "R0", "FC", "SF", "NF",
    "LP", "SL", "NL", "IP", "SP", "CE", "CS", "GE", "SE", "BR"]) {
    assert.ok(CRN_PREFIXES.includes(p), `缺少前缀 ${p}`);
  }
});

test("isValidCrn：8 位数字与 2 位前缀+6 位数字合法", () => {
  assert.equal(isValidCrn("00445790"), true);
  assert.equal(isValidCrn("SC123456"), true);
  assert.equal(isValidCrn("NI000001"), true);
  assert.equal(isValidCrn("oc123456"), true); // 忽略大小写
  assert.equal(isValidCrn("00445790/"), true); // 剥离尾部斜杠
});

test("isValidCrn：非法格式全部拒绝", () => {
  for (const bad of ["12345", "123456789", "SC12345", "XX123456", "ABCDEFGH", ""]) {
    assert.equal(isValidCrn(bad), false, `应拒绝 ${bad}`);
  }
});

test("normalizeCrn：大写、去空白/连字符/尾斜杠", () => {
  assert.equal(normalizeCrn(" sc 123456 "), "SC123456");
  assert.equal(normalizeCrn("sc-123456"), "SC123456");
  assert.equal(normalizeCrn("00445790/"), "00445790");
});

test("normalizeCrn：纯数字自动补零到 8 位", () => {
  assert.equal(normalizeCrn("123456"), "00123456");
  assert.equal(normalizeCrn("12345"), "00012345");
  assert.equal(normalizeCrn("00445790"), "00445790"); // 已 8 位不重复补
});

test("cleanCrn：合法返回规范 CRN，非法返回 null", () => {
  assert.equal(cleanCrn("oc123456"), "OC123456");
  assert.equal(cleanCrn("123456"), "00123456");
  assert.equal(cleanCrn("XX123456"), null);
  assert.equal(cleanCrn(""), null);
});