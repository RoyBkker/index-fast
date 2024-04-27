import Sitemapper from "sitemapper";
import { fetchRetry } from "./utils.mjs";

async function getSitemapsList(
  accessToken: string,
  siteUrl: string
): Promise<string[]> {
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
    siteUrl
  )}/sitemaps`;

  const response = await fetchRetry(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 403) {
    console.error(`🔐 This service account doesn't have access to this site.`);
    return [];
  }

  if (response.status >= 300) {
    console.error(`❌ Failed to get list of sitemaps.`);
    console.error(`Response was: ${response.status}`);
    console.error(await response.text());
    return [];
  }

  const body = await response.json();
  return body.sitemap.map((x: { path: string }) => x.path);
}

export async function getSitemapPages(
  accessToken: string,
  siteUrl: string
): Promise<[string[], string[]]> {
  try {
    const sitemaps = await getSitemapsList(accessToken, siteUrl);

    let pages: Iterable<any> | null | undefined = [];
    for (const url of sitemaps) {
      // @ts-ignore
      const Google = new Sitemapper({ url });

      const { sites } = await Google.fetch();
      pages = [...pages, ...sites];
    }

    return [sitemaps, [...new Set(pages)]];
  } catch (error) {
    console.error(`❌ Failed to get sitemap pages.`);
    console.error(`Error was: ${error}`);
    return [[], []];
  }
}
