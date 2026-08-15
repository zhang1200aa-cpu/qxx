// qxx.uk 部署脚本：上传源码 → VPS 上构建 → systemd(qxx.service) 重启生效
// 用法: node deploy.js
// 说明：qxx.uk 生产由 systemd 服务 qxx.service 守护（ExecStart: npm run start），
//       不再使用 PM2 管理（避免与 systemd 抢 3000 端口）。
// 安全：连接信息一律从环境变量 / deploy/.env 读取，严禁硬编码在脚本中。
const { Client } = require("ssh2");
const fs = require("fs");
const path = require("path");

// 可选：若存在 deploy/.env（KEY=VALUE），则加载（不覆盖已设置的真实环境变量）
(function loadDotEnv() {
  const f = path.join(__dirname, ".env");
  if (!fs.existsSync(f)) return;
  for (const line of fs.readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && m[1] && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
})();

const HOST = process.env.VPS_HOST;
const USER = process.env.VPS_USER || "root";
const PASS = process.env.VPS_PASS;
const REMOTE = process.env.VPS_REMOTE_DIR || "/root/qxx";

if (!HOST || !PASS) {
  console.error(
    "[error] 缺少 VPS 连接信息。请设置 VPS_HOST / VPS_USER / VPS_PASS 环境变量，或复制 deploy/.env.example 为 deploy/.env 后填写。"
  );
  process.exit(1);
}

// 项目根目录 = 本文件（deploy/）的上一级
const ROOT = path.resolve(__dirname, "..");

const conn = new Client();

// ---------- 需要上传的目录 / 文件 ----------
const DIRS = ["app", "components", "lib", "public", "types", "docs"];
const FILES = [
  "package.json",
  "package-lock.json",
  "next.config.ts",
  "tsconfig.json",
  "postcss.config.mjs",
  "eslint.config.mjs",
  "next-env.d.ts",
  ".gitignore",
  ".env.local.example",
  "README.md",
];
const SKIP_NAMES = new Set(["node_modules", ".next", "deploy", ".git"]);

function walk(dir) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_NAMES.has(name)) continue;
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function localFiles() {
  const out = [];
  for (const d of DIRS) if (fs.existsSync(path.join(ROOT, d))) out.push(...walk(path.join(ROOT, d)));
  for (const f of FILES) if (fs.existsSync(path.join(ROOT, f))) out.push(path.join(ROOT, f));
  return out;
}

function remotePath(local) {
  const rel = path.relative(ROOT, local).split(path.sep).join("/");
  return path.posix.join(REMOTE, rel);
}

// ---------- SFTP 上传 ----------
function ensureDir(sftp, dir) {
  return new Promise((resolve) => {
    const parts = dir.split("/").filter(Boolean);
    let cur = "";
    const mkNext = (i) => {
      if (i >= parts.length) return resolve();
      cur += "/" + parts[i];
      // 忽略已存在等错误（mkdir -p 语义）
      sftp.mkdir(cur, (_err) => mkNext(i + 1));
    };
    mkNext(0);
  });
}

function uploadAll(sftp) {
  const files = localFiles();
  console.log(`\n[upload] ${files.length} files to ${REMOTE} ...`);
  let idx = 0;
  return new Promise((resolve, reject) => {
    function next() {
      if (idx >= files.length) return resolve();
      const local = files[idx++];
      const remote = remotePath(local);
      const dir = path.posix.dirname(remote);
      ensureDir(sftp, dir).then(() => {
        sftp.fastPut(local, remote, (err) => {
          if (err) return reject(new Error(`put ${local} -> ${remote}: ${err.message}`));
          if (idx % 25 === 0) console.log(`[upload] ${idx}/${files.length}`);
          next();
        });
      });
    }
    next();
  });
}

// ---------- 远端命令 ----------
function runCommand(cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = "";
      stream
        .on("close", (code) => resolve({ code, out: out.trim() }))
        .on("data", (d) => (out += d.toString()))
        .stderr.on("data", (d) => (out += d.toString()));
    });
  });
}

async function run() {
  try {
    await new Promise((resolve, reject) => {
      conn
        .on("ready", resolve)
        .on("error", reject)
        .connect({ host: HOST, username: USER, password: PASS, port: 22, readyTimeout: 20000 });
    });
    console.log("[ssh] connected");

    // 1) 上传源码
    await new Promise((resolve, reject) => {
      conn.sftp((err, sftp) => {
        if (err) return reject(err);
        uploadAll(sftp).then(resolve).catch(reject);
      });
    });
    console.log("[upload] done");

    // 2) 安装依赖（复用已存在 node_modules，快速增量）
    const install = await runCommand(`cd ${REMOTE} && npm install --no-audit --no-fund 2>&1 | tail -3`);
    console.log(`[install] exit=${install.code}\n${install.out}`);

    // 3) 生产构建（读取 .env.local 中的 NEXT_PUBLIC_SITE_URL）
    const build = await runCommand(`cd ${REMOTE} && npm run build 2>&1 | tail -20`);
    console.log(`[build] exit=${build.code}\n${build.out}`);
    if (build.code !== 0) throw new Error("build failed on VPS");

    // 4) 构建成功后，重启 systemd 服务（qxx.service 为 qxx.uk 真实守护进程，
    //    CGroup 整体重启并加载新构建，无 PM2/systemd 端口冲突问题）
    const restart = await runCommand(
      `cd ${REMOTE} && systemctl restart qxx.service && sleep 4 && systemctl is-active qxx.service`
    );
    console.log(`[restart] ${restart.out}`);

    // 5) 清理历史遗留的 PM2 qxx-uk 进程（旧版脚本曾用 PM2 启动 qxx-uk 与 systemd
    //    抢 3000 端口，导致每次部署后残留 'npm run start' 孤儿链(ppid=1)，并让 PM2
    //    反复 restart）。systemd qxx.service 是唯一守护，这里仅删除残留并 save，
    //    保证 dump 干净（不启动任何新的 PM2 进程）。
    const pm2Clean = await runCommand(
      `cd ${REMOTE} && (pm2 delete qxx-uk 2>/dev/null || true) && pm2 save`
    );
    console.log(`[pm2-clean] ${pm2Clean.out}`);

    // 6) 验证
    const check = await runCommand(
      `sleep 5 && curl -s -o /dev/null -w 'local3000=%{http_code}\\n' http://127.0.0.1:3000/ && pm2 list`
    );
    console.log(`[check] ${check.out}`);
  } catch (err) {
    console.error("DEPLOY ERROR:", err.message);
    process.exitCode = 1;
  } finally {
    conn.end();
  }
}

run();