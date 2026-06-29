import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import html from "../../index.html?raw";
import manifestText from "../../public/manifest.webmanifest?raw";
import robotsText from "../../public/robots.txt?raw";
import sitemapText from "../../public/sitemap.xml?raw";
import socialPreviewPngUrl from "../../public/social-preview.png?url";

const socialPreviewPng = readFileSync(fileURLToPath(new URL("../../public/social-preview.png", import.meta.url)));

describe("release metadata", () => {
  it("declares the document language for the Chinese-first app shell", () => {
    expect(html).toContain('<html lang="zh-CN">');
  });

  it("exposes social preview and install metadata from the app shell", () => {
    expect(html).toContain('<meta name="theme-color" content="#0f172a" />');
    expect(html).toContain('<link rel="manifest" href="%BASE_URL%manifest.webmanifest" />');
    expect(html).toContain('<meta property="og:title" content="PlainDoc" />');
    expect(html).toContain(
      '<meta property="og:description" content="Plain-language risk notes and signing checklists for everyday documents." />'
    );
    expect(html).toContain('<meta property="og:type" content="website" />');
    expect(html).toContain('<meta property="og:url" content="https://ppxu.github.io/plaindoc/" />');
    expect(html).toContain('<meta property="og:image" content="https://ppxu.github.io/plaindoc/social-preview.png" />');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(html).toContain('<meta name="twitter:image" content="https://ppxu.github.io/plaindoc/social-preview.png" />');
    expect(html).toContain('<link rel="canonical" href="https://ppxu.github.io/plaindoc/" />');
    expect(socialPreviewPngUrl).toContain("social-preview.png");
    expect(readPngSize(socialPreviewPng)).toEqual({ width: 1200, height: 630 });
  });

  it("provides a GitHub Pages scoped web app manifest", () => {
    const manifest = JSON.parse(manifestText) as {
      name?: string;
      start_url?: string;
      scope?: string;
      display?: string;
      icons?: Array<{ src?: string; type?: string; sizes?: string }>;
    };

    expect(manifest.name).toBe("PlainDoc");
    expect(manifest.start_url).toBe("/plaindoc/");
    expect(manifest.scope).toBe("/plaindoc/");
    expect(manifest.display).toBe("standalone");
    expect(manifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          src: "/plaindoc/favicon.svg",
          type: "image/svg+xml",
          sizes: "any"
        })
      ])
    );
  });

  it("publishes search crawler hints for the GitHub Pages demo", () => {
    expect(robotsText).toContain("User-agent: *");
    expect(robotsText).toContain("Allow: /plaindoc/");
    expect(robotsText).toContain("Sitemap: https://ppxu.github.io/plaindoc/sitemap.xml");

    expect(sitemapText).toContain("<loc>https://ppxu.github.io/plaindoc/</loc>");
    expect(sitemapText).toContain("<lastmod>2026-06-29</lastmod>");
    expect(sitemapText).not.toContain("localhost");
  });
});

function readPngSize(bytes: Buffer): { width: number; height: number } {
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20)
  };
}
