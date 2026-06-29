import { describe, expect, it } from "vitest";
import html from "../../index.html?raw";
import manifestText from "../../public/manifest.webmanifest?raw";

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
    expect(html).toContain('<meta property="og:image" content="https://ppxu.github.io/plaindoc/social-preview.svg" />');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image" />');
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
});
