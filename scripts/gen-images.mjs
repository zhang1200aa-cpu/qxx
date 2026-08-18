/**
 * Google Gemini 品牌图片生成脚本
 *
 * 用法:
 *   GEMINI_API_KEY=xxx node scripts/gen-images.mjs
 *
 * 说明: 使用 Gemini Image (Nano Banana) 生成品牌图片。
 * 输出到 public/images/ 目录。
 * 注意：免费层有每日配额，配额用尽会自动报错，可改日重跑。
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "public", "images");
const API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash-image"; // Nano Banana
const BASE = "https://generativelanguage.googleapis.com/v1beta";

if (!API_KEY) {
  console.error("[error] 缺少 GEMINI_API_KEY。请设置环境变量后重试。");
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });

/** 调用 Gemini 生成图片并保存 */
async function genImage(name, prompt, width = 1024, height = 1024) {
  const url = `${BASE}/models/${MODEL}:generateContent?key=${API_KEY}`;
  const body = {
    contents: [
      {
        parts: [
          {
            text: `${prompt}\n\nAspect ratio: ${width}:${height}. Output as PNG.`,
          },
        ],
      },
    ],
    generationConfig: {
      imageConfig: {
        aspectRatio: `${width}:${height}`,
      },
    },
  };

  console.log(`[gen] ${name} ...`);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`[gen] FAILED ${name}: ${err.slice(0, 300)}`);
    return false;
  }

  const json = await res.json();
  const parts = json?.candidates?.[0]?.content?.parts ?? [];
  const imgPart = parts.find((p) => p?.inlineData?.data);

  if (!imgPart) {
    console.error(`[gen] No image in response for ${name}`);
    return false;
  }

  const file = join(OUT, name);
  writeFileSync(file, Buffer.from(imgPart.inlineData.data, "base64"));
  console.log(`[gen] OK -> ${file}`);
  return true;
}

/** 需要生成的图片配置 */
const IMAGES = [
  {
    name: "hero-visual.webp",
    prompt:
      "A modern, professional hero illustration for a UK business data verification website. Abstract isometric 3D scene showing UK company buildings, document checkmarks, and data panels. Color palette: deep blue #1e40af, vivid blue #2563eb, light blue #bfdbfe, with subtle white accents. Clean, minimalist, professional SaaS aesthetic. No text, no words, no letters anywhere.",
  },
  {
    name: "about-visual.webp",
    prompt:
      "A modern flat illustration showing data verification workflow for UK businesses. Include abstract document cards, a shield with a checkmark, network connection dots, and small building silhouettes. Clean white background with blue (#2563eb) and navy (#1e40af) color scheme. Professional business software aesthetic. No text, no words, no letters anywhere.",
  },
  {
    name: "pricing-visual.webp",
    prompt:
      "A clean minimal 3D illustration for a SaaS pricing page background. Floating geometric shapes, stacked layered cards, and subtle gradient in deep blue (#1e3a8a) and vivid blue (#3b82f6) tones. Premium enterprise software aesthetic with soft shadows. No text, no words, no letters anywhere.",
  },
  {
    name: "og-banner.webp",
    prompt:
      "An open graph share banner (1200x630 aspect ratio) for qxx.uk, a UK company and tax intelligence website. Deep blue gradient background, abstract London skyline silhouettes, floating data visualization panels with charts and graphs. Modern tech aesthetic with the qxx.uk brand (blue #2563eb). Clean, professional B2B SaaS style. No text, no words, no letters anywhere in the image.",
  },
  {
    name: "pattern-light.webp",
    prompt:
      "A seamless light pattern background for a professional UK business website. Very subtle geometric grid with tiny dots and thin lines in very light blue (#dbeafe, #eff6ff) on white. Minimal and clean. No text, no words, no letters.",
  },
];

async function main() {
  console.log(`=== Gemini Brand Image Generator ===`);
  console.log(`Model: ${MODEL}`);
  console.log(`Output: ${OUT}`);
  console.log("");

  let ok = 0;
  let fail = 0;
  for (const img of IMAGES) {
    const success = await genImage(img.name, img.prompt, 1024, 1024);
    if (success) ok++;
    else fail++;
  }

  console.log("");
  console.log(`Done: ${ok} OK, ${fail} failed.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});