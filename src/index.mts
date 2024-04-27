import { getAccessToken } from "./lib/auth.mjs";
import {
  convertToSiteUrl,
  getPublishMetadata,
  requestIndexing,
  getEmojiForStatus,
  getPageIndexingStatus,
} from "./lib/gsc.mjs";
import { getSitemapPages } from "./lib/sitemap.mjs";
import { batch } from "./lib/utils.mjs";
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "fs";

const CACHE_TIMEOUT = 1000 * 60 * 60 * 24 * 14; // 14 days
const input = process.argv[2];

if (!input) {
  console.error(
    "❌ Please provide a domain or site URL as the first argument."
  );
  console.error("");
  process.exit(1);
}

const accessToken = await getAccessToken();
const siteUrl = convertToSiteUrl(input);
console.log(`🔎 Processing site: ${siteUrl}`);
const cachePath = `.cache/${siteUrl
  .replace("http://", "http_")
  .replace("https://", "https_")
  .replace("/", "_")}.json`;

if (!accessToken) {
  console.error("❌ Failed to get access token.");
  console.error("");
  process.exit(1);
}

const [sitemaps, pages] = await getSitemapPages(accessToken, siteUrl);

if (sitemaps.length === 0) {
  console.error(
    "❌ No sitemaps found, add them to Google Search Console and try again."
  );
  console.error("");
  process.exit(1);
}

console.log(`👉 Found ${pages.length} URLs in ${sitemaps.length} sitemap`);

const statusPerUrl = existsSync(cachePath)
  ? JSON.parse(readFileSync(cachePath, "utf8"))
  : {};
const pagesPerStatus: { [s: string]: string[] } | ArrayLike<unknown> = {};

const indexableStatuses = [
  "Discovered - currently not indexed",
  "Crawled - currently not indexed",
  "URL is unknown to Google",
  "Forbidden",
  "Error",
];

const shouldRecheck = (
  status: string,
  lastCheckedAt: string | number | Date
) => {
  const shouldIndexIt = indexableStatuses.includes(status);
  const isOld = new Date(lastCheckedAt) < new Date(Date.now() - CACHE_TIMEOUT);
  return shouldIndexIt || isOld;
};

await batch(
  async (url: string) => {
    let result = statusPerUrl[url];
    if (!result || shouldRecheck(result.status, result.lastCheckedAt)) {
      const status = await getPageIndexingStatus(accessToken, siteUrl, url);
      result = { status, lastCheckedAt: new Date().toISOString() };
      statusPerUrl[url] = result;
    }
    pagesPerStatus[result.status] = pagesPerStatus[result.status]
      ? [...(pagesPerStatus[result.status] as string[]), url]
      : [url];
  },
  pages,
  50,
  (batchIndex: number, batchCount: any) => {
    console.log(`📦 Batch ${batchIndex + 1} of ${batchCount} complete`);
  }
);

console.log(``);
console.log(`👍 Done, here's the status of all ${pages.length} pages:`);
mkdirSync(".cache", { recursive: true });
writeFileSync(cachePath, JSON.stringify(statusPerUrl, null, 2));

for (const [status, pages] of Object.entries(pagesPerStatus)) {
  const pagesArray = pages as string[];
  console.log(
    `• ${getEmojiForStatus(status)} ${status}: ${pagesArray.length} pages`
  );
}
console.log("");
const indexablePages = Object.entries(pagesPerStatus).flatMap(
  ([status, pages]) => (indexableStatuses.includes(status) ? pages : [])
);

if (indexablePages.length === 0) {
  console.log(
    `✨ There are no pages that can be indexed. Everything is already indexed!`
  );
} else {
  console.log(`✨ Found ${indexablePages.length} pages that can be indexed.`);
  indexablePages.forEach((url) => console.log(`• ${url}`));
}
console.log(``);

for (const url of indexablePages) {
  console.log(`📄 Processing url: ${url}`);
  const status = await getPublishMetadata(accessToken, url);
  if (status === 404) {
    await requestIndexing(accessToken, url);
    console.log(
      "🚀 Indexing requested successfully. It may take a few days for Google to process it."
    );
  } else if (status < 400) {
    console.log(
      `🕛 Indexing already requested previously. It may take a few days for Google to process it.`
    );
  }
  console.log(``);
}

console.log(`👍 All done!`);
console.log(`💖 Brought to you by https://twitter.com/RoyalB88`);
console.log(``);
