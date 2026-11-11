import { safeFetchHtml, validateSafePublicUrl } from "./security";

export interface SubpageCheckResult {
  url: string;
  status: number;
  source: "html" | "sitemap";
  responseTimeMs?: number;
  redirected?: boolean;
}

export function detectCmsAndTech(html: string, headers: Headers): {
  cms: string;
  techStack: string[];
  complexityMultiplier: number;
} {
  const lower = html.toLowerCase();
  const stack: string[] = [];
  let cms = "Custom / HTML5";
  let complexityMultiplier = 1.0;

  const poweredBy = headers.get("x-powered-by") || "";
  const serverHdr = headers.get("server") || "";

  if (lower.includes("woocommerce") || lower.includes("wc-blocks") || lower.includes("wp-content/plugins/woocommerce")) {
    cms = "WooCommerce (WordPress)";
    stack.push("WordPress", "WooCommerce", "PHP");
    complexityMultiplier = 1.35;
  } else if (lower.includes("wp-content") || lower.includes("wp-includes") || lower.includes("wordpress")) {
    cms = "WordPress";
    stack.push("WordPress", "PHP");
    complexityMultiplier = 1.15;
  } else if (lower.includes("cdn.shopify.com") || lower.includes("shopify.theme")) {
    cms = "Shopify";
    stack.push("Shopify", "Liquid");
    complexityMultiplier = 1.25;
  } else if (lower.includes("/_next/static") || lower.includes("__next_data__")) {
    cms = "Next.js / React";
    stack.push("Next.js", "React", "Node.js");
    complexityMultiplier = 1.2;
  } else if (lower.includes("/_nuxt/") || lower.includes("__nuxt")) {
    cms = "Nuxt / Vue";
    stack.push("Nuxt.js", "Vue");
    complexityMultiplier = 1.2;
  } else if (lower.includes("data-wf-site") || lower.includes("webflow.com")) {
    cms = "Webflow";
    stack.push("Webflow");
    complexityMultiplier = 1.05;
  } else if (lower.includes("prestashop")) {
    cms = "PrestaShop";
    stack.push("PrestaShop", "PHP");
    complexityMultiplier = 1.4;
  } else if (lower.includes("wix.com") || lower.includes("wixstatic.com")) {
    cms = "Wix";
    stack.push("Wix");
    complexityMultiplier = 1.1;
  }

  if (lower.includes("googletagmanager.com") || lower.includes("gtag(")) {
    stack.push("Google Tag Manager / GA4");
  }
  if (lower.includes("connect.facebook.net") || lower.includes("fbevents.js")) {
    stack.push("Meta Pixel");
  }
  if (lower.includes("tailwindcss") || lower.includes("tailwind")) {
    stack.push("Tailwind CSS");
  }
  if (serverHdr.toLowerCase().includes("cloudflare") || headers.get("cf-ray")) {
    stack.push("Cloudflare CDN");
  }
  if (poweredBy) {
    stack.push(poweredBy);
  }

  return {
    cms,
    techStack: Array.from(new Set(stack)),
    complexityMultiplier,
  };
}

async function verifySubpageHttpStatus(subUrl: string, source: "html" | "sitemap"): Promise<SubpageCheckResult> {
  const check = validateSafePublicUrl(subUrl);
  if (!check.valid || !check.normalizedUrl) {
    return { url: subUrl, status: 0, source, responseTimeMs: 0 };
  }
  const start = Date.now();
  try {
    const res = await fetch(check.normalizedUrl, {
      method: "HEAD",
      redirect: "manual",
      signal: AbortSignal.timeout(3200),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; NovoPixAuditBot/2.0; +https://novopix.uk)",
      },
    });
    const elapsed = Date.now() - start;
    // If server rejects HEAD with 405, fallback to lightweight GET
    if (res.status === 405) {
      const getRes = await fetch(check.normalizedUrl, {
        method: "GET",
        redirect: "manual",
        signal: AbortSignal.timeout(3200),
      });
      return {
        url: subUrl,
        status: getRes.status,
        source,
        responseTimeMs: Date.now() - start,
        redirected: [301, 302, 303, 307, 308].includes(getRes.status),
      };
    }
    return {
      url: subUrl,
      status: res.status,
      source,
      responseTimeMs: elapsed,
      redirected: [301, 302, 303, 307, 308].includes(res.status),
    };
  } catch {
    return {
      url: subUrl,
      status: 0,
      source,
      responseTimeMs: Date.now() - start,
    };
  }
}

export async function performDeepLiveSeoInspection(targetUrl: string) {
  const fetched = await safeFetchHtml(targetUrl, 8500);
  if (!fetched.ok && fetched.status === 0) {
    return {
      url: targetUrl,
      isLiveFetch: false,
      error: fetched.error || "Nie udało się połączyć z badaną domeną.",
      responseTimeMs: fetched.responseTimeMs,
      htmlSizeKb: 0,
      https: targetUrl.startsWith("https://"),
      htmlLang: null,
      viewport: null,
      cmsTech: "Nieznany (brak odpowiedzi HTTP)",
      techStack: [],
      complexityMultiplier: 1.0,
      scriptStats: { totalScripts: 0, renderBlockingScripts: 0, stylesheets: 0 },
      hreflangs: [],
      title: { text: null, length: 0, pixelWidth: 0, status: "error" as const },
      description: { text: null, length: 0, pixelWidth: 0, status: "error" as const },
      headings: { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0, h1Texts: [], h2Texts: [], status: "error" as const },
      canonical: { url: null, isSelf: false, status: "error" as const },
      indexing: { robotsMeta: "brak", hasRobotsTxt: false, hasSitemapXml: false, status: "error" as const },
      images: { total: 0, missingAlt: 0, lazyLoaded: 0, status: "error" as const },
      links: { internal: 0, external: 0, total: 0 },
      social: { ogTitle: null, ogDescription: null, ogImage: null, twitterCard: null, schemaJsonLdCount: 0, status: "error" as const },
      securityHeaders: { https: targetUrl.startsWith("https://"), hsts: false, xFrameOptions: false, xContentTypeOptions: false, csp: false, score: 0 },
      discoveredSubpages: [],
    };
  }

  const htmlText = fetched.htmlText;
  const responseTimeMs = fetched.responseTimeMs;
  const htmlSizeKb = Math.max(1, Math.round(Buffer.byteLength(htmlText, "utf8") / 1024));

  const { cms, techStack, complexityMultiplier } = detectCmsAndTech(htmlText, fetched.headers);

  // Extract Head section for render-blocking script analysis
  const headMatch = htmlText.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const headHtml = headMatch ? headMatch[1] : "";
  const allScripts = htmlText.match(/<script\b[^>]*>/gi) || [];
  const headScripts = headHtml.match(/<script\b[^>]*src=["'][^"']+["'][^>]*>/gi) || [];
  const renderBlockingScripts = headScripts.filter(
    (s) => !/\b(defer|async)\b/i.test(s) && !/type=["']module["']/i.test(s)
  ).length;
  const stylesheets = (htmlText.match(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi) || []).length;

  // Hreflang tags
  const hreflangMatches = htmlText.match(/<link\b[^>]*hreflang=["']([^"']+)["'][^>]*>/gi) || [];
  const hreflangs = hreflangMatches
    .map((tag) => {
      const m = tag.match(/hreflang=["']([^"']+)["']/i);
      return m ? m[1] : null;
    })
    .filter((v): v is string => !!v);

  const stripTags = (str: string) => str.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

  const titleMatch = htmlText.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const metaDescMatch =
    htmlText.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
    htmlText.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
  const canonicalMatch =
    htmlText.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i) ||
    htmlText.match(/<link[^>]*href=["']([^"']*)["'][^>]*rel=["']canonical["']/i);
  const robotsMatch = htmlText.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']*)["']/i);
  const viewportMatch = htmlText.match(/<meta[^>]*name=["']viewport["'][^>]*content=["']([^"']*)["']/i);
  const langMatch = htmlText.match(/<html[^>]*lang=["']([^"']*)["']/i);

  const ogTitleMatch = htmlText.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i);
  const ogDescMatch = htmlText.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i);
  const ogImageMatch = htmlText.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i);
  const twitterCardMatch = htmlText.match(/<meta[^>]*name=["']twitter:card["'][^>]*content=["']([^"']*)["']/i);
  const jsonLdMatches = htmlText.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>/gi) || [];

  const extractHeadingTexts = (tag: string, max = 5): string[] => {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
    const results: string[] = [];
    let m;
    while ((m = regex.exec(htmlText)) !== null && results.length < max) {
      const clean = stripTags(m[1]);
      if (clean) results.push(clean.slice(0, 110));
    }
    return results;
  };

  const h1Count = (htmlText.match(/<h1(\s|>)/gi) || []).length;
  const h2Count = (htmlText.match(/<h2(\s|>)/gi) || []).length;
  const h3Count = (htmlText.match(/<h3(\s|>)/gi) || []).length;
  const h4Count = (htmlText.match(/<h4(\s|>)/gi) || []).length;
  const h5Count = (htmlText.match(/<h5(\s|>)/gi) || []).length;
  const h6Count = (htmlText.match(/<h6(\s|>)/gi) || []).length;

  const h1Texts = extractHeadingTexts("h1", 4);
  const h2Texts = extractHeadingTexts("h2", 6);

  const imgTags = htmlText.match(/<img\b[^>]*>/gi) || [];
  const totalImages = imgTags.length;
  let missingAlt = 0;
  let lazyLoadedImages = 0;
  for (const img of imgTags) {
    if (!/\balt=["'][^"']+["']/i.test(img)) {
      missingAlt++;
    }
    if (/\bloading=["']lazy["']/i.test(img)) {
      lazyLoadedImages++;
    }
  }

  // Discover internal links and verify real HTTP status codes
  const anchorTags = htmlText.match(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi) || [];
  const parsedOrigin = new URL(fetched.finalUrl).origin;
  let internalLinks = 0;
  let externalLinks = 0;
  const discoveredSubpageSet = new Set<string>();
  const rawCandidateSubpages: Array<{ url: string; source: "html" | "sitemap" }> = [];

  discoveredSubpageSet.add(fetched.finalUrl.replace(/\/$/, ""));

  for (const a of anchorTags) {
    const hrefM = a.match(/href=["']([^"']+)["']/i);
    const href = hrefM ? hrefM[1].trim() : "";
    if (!href || href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:")) {
      continue;
    }
    if (href.startsWith("/") || href.startsWith(parsedOrigin)) {
      internalLinks++;
      try {
        const fullSubUrl = new URL(href, parsedOrigin).href.split("#")[0].replace(/\/$/, "");
        if (!discoveredSubpageSet.has(fullSubUrl) && rawCandidateSubpages.length < 6) {
          discoveredSubpageSet.add(fullSubUrl);
          rawCandidateSubpages.push({ url: fullSubUrl, source: "html" });
        }
      } catch {}
    } else if (href.startsWith("http")) {
      externalLinks++;
    }
  }

  // Check /robots.txt and /sitemap.xml
  let hasRobots = false;
  let hasSitemap = false;
  try {
    const rCheck = validateSafePublicUrl(`${parsedOrigin}/robots.txt`);
    if (rCheck.valid && rCheck.normalizedUrl) {
      const rRes = await fetch(rCheck.normalizedUrl, { method: "HEAD", signal: AbortSignal.timeout(3000) });
      hasRobots = rRes.ok;
    }
  } catch {}
  try {
    const sCheck = validateSafePublicUrl(`${parsedOrigin}/sitemap.xml`);
    if (sCheck.valid && sCheck.normalizedUrl) {
      const sRes = await fetch(sCheck.normalizedUrl, { signal: AbortSignal.timeout(3500) });
      hasSitemap = sRes.ok;
      if (sRes.ok) {
        const sitemapXml = await sRes.text();
        const locMatches = sitemapXml.match(/<loc>\s*([^<\s]+)\s*<\/loc>/gi) || [];
        for (const locTag of locMatches) {
          if (rawCandidateSubpages.length >= 8) break;
          const locUrl = locTag.replace(/<\/?loc>/gi, "").trim().replace(/\/$/, "");
          if (locUrl && !discoveredSubpageSet.has(locUrl)) {
            discoveredSubpageSet.add(locUrl);
            rawCandidateSubpages.push({ url: locUrl, source: "sitemap" });
          }
        }
      }
    }
  } catch {}

  // Concurrently verify actual HTTP statuses of discovered subpages
  const verifiedSubpages = await Promise.all(
    rawCandidateSubpages.slice(0, 7).map((item) => verifySubpageHttpStatus(item.url, item.source))
  );

  const discoveredSubpages: SubpageCheckResult[] = [
    {
      url: fetched.finalUrl,
      status: fetched.status || 200,
      source: "html",
      responseTimeMs: fetched.responseTimeMs,
      redirected: fetched.redirectCount > 0,
    },
    ...verifiedSubpages,
  ];

  const headers = fetched.headers;
  const hasHsts = !!headers.get("strict-transport-security");
  const hasXfo = !!headers.get("x-frame-options");
  const hasXcto = !!headers.get("x-content-type-options");
  const hasCsp = !!headers.get("content-security-policy");

  const title = titleMatch ? stripTags(titleMatch[1]) : null;
  const description = metaDescMatch ? metaDescMatch[1].trim() : null;
  const canonical = canonicalMatch ? canonicalMatch[1].trim() : null;
  const robotsMeta = robotsMatch ? robotsMatch[1].trim() : "index, follow";

  return {
    url: fetched.finalUrl,
    isLiveFetch: true,
    responseTimeMs,
    redirectCount: fetched.redirectCount,
    redirectChain: fetched.redirectChain,
    htmlSizeKb,
    https: fetched.finalUrl.startsWith("https://"),
    htmlLang: langMatch ? langMatch[1] : null,
    viewport: viewportMatch ? viewportMatch[1] : null,
    cmsTech: cms,
    techStack,
    complexityMultiplier,
    scriptStats: {
      totalScripts: allScripts.length,
      renderBlockingScripts,
      stylesheets,
    },
    hreflangs,
    title: {
      text: title,
      length: title ? title.length : 0,
      pixelWidth: title ? Math.round(title.length * 9.2) : 0,
      status: title && title.length >= 30 && title.length <= 65 ? ("good" as const) : title ? ("warning" as const) : ("error" as const),
    },
    description: {
      text: description,
      length: description ? description.length : 0,
      pixelWidth: description ? Math.round(description.length * 6.8) : 0,
      status:
        description && description.length >= 110 && description.length <= 165
          ? ("good" as const)
          : description
          ? ("warning" as const)
          : ("error" as const),
    },
    headings: {
      h1: h1Count,
      h2: h2Count,
      h3: h3Count,
      h4: h4Count,
      h5: h5Count,
      h6: h6Count,
      h1Texts,
      h2Texts,
      status: h1Count === 1 ? ("good" as const) : h1Count === 0 ? ("error" as const) : ("warning" as const),
    },
    canonical: {
      url: canonical,
      isSelf: canonical ? canonical.replace(/\/$/, "") === fetched.finalUrl.replace(/\/$/, "") : false,
      status: canonical ? ("good" as const) : ("warning" as const),
    },
    indexing: {
      robotsMeta,
      hasRobotsTxt: hasRobots,
      hasSitemapXml: hasSitemap,
      status: robotsMeta.toLowerCase().includes("noindex")
        ? ("error" as const)
        : hasRobots && hasSitemap
        ? ("good" as const)
        : ("warning" as const),
    },
    images: {
      total: totalImages,
      missingAlt,
      lazyLoaded: lazyLoadedImages,
      status: missingAlt === 0 ? ("good" as const) : missingAlt <= 3 ? ("warning" as const) : ("error" as const),
    },
    links: {
      internal: internalLinks,
      external: externalLinks,
      total: internalLinks + externalLinks,
    },
    social: {
      ogTitle: ogTitleMatch ? ogTitleMatch[1] : null,
      ogDescription: ogDescMatch ? ogDescMatch[1] : null,
      ogImage: ogImageMatch ? ogImageMatch[1] : null,
      twitterCard: twitterCardMatch ? twitterCardMatch[1] : null,
      schemaJsonLdCount: jsonLdMatches.length,
      status: ogTitleMatch && ogImageMatch ? ("good" as const) : ("warning" as const),
    },
    securityHeaders: {
      https: fetched.finalUrl.startsWith("https://"),
      hsts: hasHsts,
      xFrameOptions: hasXfo,
      xContentTypeOptions: hasXcto,
      csp: hasCsp,
      score:
        (fetched.finalUrl.startsWith("https://") ? 35 : 0) +
        (hasHsts ? 20 : 0) +
        (hasXfo ? 15 : 0) +
        (hasXcto ? 15 : 0) +
        (hasCsp ? 15 : 0),
    },
    discoveredSubpages,
  };
}
