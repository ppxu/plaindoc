import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import html from "../../index.html?raw";
import appSource from "../App.tsx?raw";
import manifestText from "../../public/manifest.webmanifest?raw";
import robotsText from "../../public/robots.txt?raw";
import sitemapText from "../../public/sitemap.xml?raw";
import socialPreviewPngUrl from "../../public/social-preview.png?url";

const socialPreviewPng = readFileSync(fileURLToPath(new URL("../../public/social-preview.png", import.meta.url)));
const readme = readFileSync(fileURLToPath(new URL("../../README.md", import.meta.url)), "utf8");
const roadmap = readFileSync(fileURLToPath(new URL("../../docs/roadmap.md", import.meta.url)), "utf8");
const appIcon192Png = readFileSync(fileURLToPath(new URL("../../public/icon-192.png", import.meta.url)));
const appIcon512Png = readFileSync(fileURLToPath(new URL("../../public/icon-512.png", import.meta.url)));
const publicDescription = "把日常合同、协议和保单转换成易懂的风险提示和签署前清单。";
const socialPreviewAlt = "PlainDoc 风险阅读报告和签署前清单预览";

describe("release metadata", () => {
  it("declares the document language for the Chinese-first app shell", () => {
    expect(html).toContain('<html lang="zh-CN">');
  });

  it("exposes social preview and install metadata from the app shell", () => {
    expect(html).toContain('<meta name="theme-color" content="#127c71" />');
    expect(html).toContain('<link rel="manifest" href="%BASE_URL%manifest.webmanifest" />');
    expect(html).toContain('<meta property="og:title" content="PlainDoc" />');
    expect(html).toContain(`<meta name="description" content="${publicDescription}" />`);
    expect(html).toContain(`<meta property="og:description" content="${publicDescription}" />`);
    expect(html).toContain('<meta property="og:type" content="website" />');
    expect(html).toContain('<meta property="og:url" content="https://ppxu.github.io/plaindoc/" />');
    expect(html).toContain('<meta property="og:image" content="https://ppxu.github.io/plaindoc/social-preview.png" />');
    expect(html).toContain(`<meta property="og:image:alt" content="${socialPreviewAlt}" />`);
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(html).toContain(`<meta name="twitter:description" content="${publicDescription}" />`);
    expect(html).toContain('<meta name="twitter:image" content="https://ppxu.github.io/plaindoc/social-preview.png" />');
    expect(html).toContain(`<meta name="twitter:image:alt" content="${socialPreviewAlt}" />`);
    expect(html).toContain('<link rel="canonical" href="https://ppxu.github.io/plaindoc/" />');
    expect(socialPreviewPngUrl).toContain("social-preview.png");
    expect(readPngSize(socialPreviewPng)).toEqual({ width: 1200, height: 630 });
  });

  it("provides a GitHub Pages scoped web app manifest", () => {
    const manifest = JSON.parse(manifestText) as {
      id?: string;
      name?: string;
      short_name?: string;
      description?: string;
      lang?: string;
      dir?: string;
      start_url?: string;
      scope?: string;
      display?: string;
      display_override?: string[];
      categories?: string[];
      background_color?: string;
      theme_color?: string;
      icons?: Array<{ src?: string; type?: string; sizes?: string }>;
    };

    expect(manifest.id).toBe("/plaindoc/");
    expect(manifest.name).toBe("PlainDoc");
    expect(manifest.short_name).toBe("PlainDoc");
    expect(manifest.description).toBe(publicDescription);
    expect(manifest.lang).toBe("zh-CN");
    expect(manifest.dir).toBe("ltr");
    expect(manifest.start_url).toBe("/plaindoc/");
    expect(manifest.scope).toBe("/plaindoc/");
    expect(manifest.display).toBe("standalone");
    expect(manifest.display_override).toEqual(["standalone", "browser"]);
    expect(manifest.categories).toEqual(["productivity", "utilities", "education"]);
    expect(manifest.background_color).toBe("#f5f7f8");
    expect(manifest.theme_color).toBe("#127c71");
    expect(manifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          src: "/plaindoc/favicon.svg",
          type: "image/svg+xml",
          sizes: "any"
        }),
        expect.objectContaining({
          src: "/plaindoc/icon-192.png",
          type: "image/png",
          sizes: "192x192"
        }),
        expect.objectContaining({
          src: "/plaindoc/icon-512.png",
          type: "image/png",
          sizes: "512x512"
        })
      ])
    );
    expect(readPngSize(appIcon192Png)).toEqual({ width: 192, height: 192 });
    expect(readPngSize(appIcon512Png)).toEqual({ width: 512, height: 512 });
  });

  it("publishes search crawler hints for the GitHub Pages demo", () => {
    expect(robotsText).toContain("User-agent: *");
    expect(robotsText).toContain("Allow: /plaindoc/");
    expect(robotsText).toContain("Sitemap: https://ppxu.github.io/plaindoc/sitemap.xml");

    expect(sitemapText).toContain("<loc>https://ppxu.github.io/plaindoc/</loc>");
    expect(sitemapText).toContain("<lastmod>2026-06-30</lastmod>");
    expect(sitemapText).not.toContain("localhost");
  });

  it("uses production-ready public wording instead of internal launch-stage labels", () => {
    expect(appSource).toContain("本地优先");
    expect(appSource).toContain("阅读辅助，不替代专业建议");
    expect(readme).toContain("签字前，先看懂哪里可能伤到你。");
    expect(readme).not.toContain("Know what can hurt you before you sign.");
    expect(appSource).not.toContain("MVP");
    expect(readme).not.toContain("MVP");
    expect(roadmap).not.toContain("MVP");
  });

  it("keeps the README aligned with shipped document and report workflows", () => {
    expect(readme).toContain("点击上传或拖入 PDF / .txt / .md 文件");
    expect(readme).toContain("实时显示已输入字符数");
    expect(readme).toContain("Markdown 报告会标明 PlainDoc 来源链接");
    expect(readme).toContain("https://ppxu.github.io/plaindoc/");
  });
});

function readPngSize(bytes: Buffer): { width: number; height: number } {
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20)
  };
}
