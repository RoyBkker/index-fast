"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.mts
var src_exports = {};
__export(src_exports, {
  processSite: () => processSite
});
module.exports = __toCommonJS(src_exports);

// src/lib/auth.mts
var import_googleapis = require("googleapis");
var import_fs = require("fs");
async function getAccessToken() {
  if (!(0, import_fs.existsSync)("./service_account.json")) {
    console.error(
      "\u274C service_account.json not found, please follow the instructions in README.md"
    );
    console.error("");
    process.exit(1);
  }
  const key = JSON.parse((0, import_fs.readFileSync)("./service_account.json", "utf8"));
  const jwtClient = new import_googleapis.google.auth.JWT(
    key.client_email,
    void 0,
    key.private_key,
    [
      "https://www.googleapis.com/auth/webmasters.readonly",
      "https://www.googleapis.com/auth/indexing"
    ],
    void 0
  );
  const tokens = await jwtClient.authorize();
  return tokens.access_token;
}

// src/lib/utils.mts
var createChunks = (arr, size) => Array.from(
  { length: Math.ceil(arr.length / size) },
  (v, i) => arr.slice(i * size, i * size + size)
);
async function batch(task, items, batchSize, onBatchComplete) {
  const chunks = createChunks(items, batchSize);
  for (let i = 0; i < chunks.length; i++) {
    await Promise.all(chunks[i].map(task));
    onBatchComplete(i, chunks.length);
  }
}
async function fetchRetry(url, options, retries = 5) {
  try {
    const response = await fetch(url, options);
    if (response.status >= 500) {
      const body = await response.text();
      throw new Error(`Server error code ${response.status}
${body}`);
    }
    return response;
  } catch (err) {
    if (retries <= 0) {
      throw err;
    }
    return fetchRetry(url, options, retries - 1);
  }
}

// src/lib/gsc.mts
function convertToSiteUrl(input) {
  if (input.startsWith("http://") || input.startsWith("https://")) {
    return input.endsWith("/") ? input : `${input}/`;
  }
  return `sc-domain:${input}`;
}
async function getPageIndexingStatus(accessToken, siteUrl, inspectionUrl) {
  try {
    const response = await fetchRetry(
      `https://searchconsole.googleapis.com/v1/urlInspection/index:inspect`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          inspectionUrl,
          siteUrl
        })
      }
    );
    if (response.status === 403) {
      console.error(
        `\u{1F510} This service account doesn't have access to this site.`
      );
      console.error(await response.text());
      return "Forbidden";
    }
    if (response.status >= 300) {
      console.error(`\u274C Failed to get indexing status.`);
      console.error(`Response was: ${response.status}`);
      console.error(await response.text());
      return "Error";
    }
    const body = await response.json();
    return body.inspectionResult.indexStatusResult.coverageState;
  } catch (error) {
    console.error(`\u274C Failed to get indexing status.`);
    console.error(`Error was: ${error}`);
    throw error;
  }
}
function getEmojiForStatus(status) {
  switch (status) {
    case "Submitted and indexed":
      return "\u2705";
    case "Duplicate without user-selected canonical":
      return "\u{1F635}";
    case "Crawled - currently not indexed":
    case "Discovered - currently not indexed":
      return "\u{1F440}";
    case "Page with redirect":
      return "\u{1F500}";
    case "URL is unknown to Google":
      return "\u2753";
    default:
      return "\u274C";
  }
}
async function getPublishMetadata(accessToken, url) {
  const response = await fetchRetry(
    `https://indexing.googleapis.com/v3/urlNotifications/metadata?url=${encodeURIComponent(
      url
    )}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      }
    }
  );
  if (response.status === 403) {
    console.error(`\u{1F510} This service account doesn't have access to this site.`);
    console.error(`Response was: ${response.status}`);
    console.error(await response.text());
  }
  if (response.status >= 500) {
    console.error(`\u274C Failed to get publish metadata.`);
    console.error(`Response was: ${response.status}`);
    console.error(await response.text());
  }
  return response.status;
}
async function requestIndexing(accessToken, url) {
  const response = await fetchRetry(
    "https://indexing.googleapis.com/v3/urlNotifications:publish",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        url,
        type: "URL_UPDATED"
      })
    }
  );
  if (response.status === 403) {
    console.error(`\u{1F510} This service account doesn't have access to this site.`);
    console.error(`Response was: ${response.status}`);
  }
  if (response.status >= 300) {
    console.error(`\u274C Failed to request indexing.`);
    console.error(`Response was: ${response.status}`);
    console.error(await response.text());
  }
}

// src/lib/sitemap.mts
var import_sitemapper = __toESM(require("sitemapper"), 1);
async function getSitemapsList(accessToken, siteUrl) {
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
    siteUrl
  )}/sitemaps`;
  const response = await fetchRetry(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`
    }
  });
  if (response.status === 403) {
    console.error(`\u{1F510} This service account doesn't have access to this site.`);
    return [];
  }
  if (response.status >= 300) {
    console.error(`\u274C Failed to get list of sitemaps.`);
    console.error(`Response was: ${response.status}`);
    console.error(await response.text());
    return [];
  }
  const body = await response.json();
  return body.sitemap.map((x) => x.path);
}
async function getSitemapPages(accessToken, siteUrl) {
  try {
    const sitemaps = await getSitemapsList(accessToken, siteUrl);
    let pages = [];
    for (const url of sitemaps) {
      const Google = new import_sitemapper.default({ url });
      const { sites } = await Google.fetch();
      pages = [...pages, ...sites];
    }
    return [sitemaps, [...new Set(pages)]];
  } catch (error) {
    console.error(`\u274C Failed to get sitemap pages.`);
    console.error(`Error was: ${error}`);
    return [[], []];
  }
}

// src/index.mts
var import_fs2 = require("fs");
var CACHE_TIMEOUT = 1e3 * 60 * 60 * 24 * 14;
async function processSite(input) {
  if (!input) {
    console.error(
      "\u274C Please provide a domain or site URL as the first argument."
    );
    console.error("");
    process.exit(1);
  }
  const accessToken = await getAccessToken();
  const siteUrl = convertToSiteUrl(input);
  console.log(`\u{1F50E} Processing site: ${siteUrl}`);
  const cachePath = `.cache/${siteUrl.replace("http://", "http_").replace("https://", "https_").replace("/", "_")}.json`;
  if (!accessToken) {
    console.error("\u274C Failed to get access token.");
    console.error("");
    process.exit(1);
  }
  const [sitemaps, pages] = await getSitemapPages(accessToken, siteUrl);
  if (sitemaps.length === 0) {
    console.error(
      "\u274C No sitemaps found, add them to Google Search Console and try again."
    );
    console.error("");
    process.exit(1);
  }
  console.log(`\u{1F449} Found ${pages.length} URLs in ${sitemaps.length} sitemap`);
  const statusPerUrl = (0, import_fs2.existsSync)(cachePath) ? JSON.parse((0, import_fs2.readFileSync)(cachePath, "utf8")) : {};
  const pagesPerStatus = {};
  const indexableStatuses = [
    "Discovered - currently not indexed",
    "Crawled - currently not indexed",
    "URL is unknown to Google",
    "Forbidden",
    "Error"
  ];
  const shouldRecheck = (status, lastCheckedAt) => {
    const shouldIndexIt = indexableStatuses.includes(status);
    const isOld = new Date(lastCheckedAt) < new Date(Date.now() - CACHE_TIMEOUT);
    return shouldIndexIt || isOld;
  };
  await batch(
    async (url) => {
      let result = statusPerUrl[url];
      if (!result || shouldRecheck(result.status, result.lastCheckedAt)) {
        const status = await getPageIndexingStatus(accessToken, siteUrl, url);
        result = { status, lastCheckedAt: (/* @__PURE__ */ new Date()).toISOString() };
        statusPerUrl[url] = result;
      }
      pagesPerStatus[result.status] = pagesPerStatus[result.status] ? [...pagesPerStatus[result.status], url] : [url];
    },
    pages,
    50,
    (batchIndex, batchCount) => {
      console.log(`\u{1F4E6} Batch ${batchIndex + 1} of ${batchCount} complete`);
    }
  );
  console.log(``);
  console.log(`\u{1F44D} Done, here's the status of all ${pages.length} pages:`);
  (0, import_fs2.mkdirSync)(".cache", { recursive: true });
  (0, import_fs2.writeFileSync)(cachePath, JSON.stringify(statusPerUrl, null, 2));
  for (const [status, pages2] of Object.entries(pagesPerStatus)) {
    const pagesArray = pages2;
    console.log(
      `\u2022 ${getEmojiForStatus(status)} ${status}: ${pagesArray.length} pages`
    );
  }
  console.log("");
  const indexablePages = Object.entries(pagesPerStatus).flatMap(
    ([status, pages2]) => indexableStatuses.includes(status) ? pages2 : []
  );
  if (indexablePages.length === 0) {
    console.log(
      `\u2728 There are no pages that can be indexed. Everything is already indexed!`
    );
  } else {
    console.log(`\u2728 Found ${indexablePages.length} pages that can be indexed.`);
    indexablePages.forEach((url) => console.log(`\u2022 ${url}`));
  }
  console.log(``);
  for (const url of indexablePages) {
    console.log(`\u{1F4C4} Processing url: ${url}`);
    const status = await getPublishMetadata(accessToken, url);
    if (status === 404) {
      await requestIndexing(accessToken, url);
      console.log(
        "\u{1F680} Indexing requested successfully. It may take a few days for Google to process it."
      );
    } else if (status < 400) {
      console.log(
        `\u{1F55B} Indexing already requested previously. It may take a few days for Google to process it.`
      );
    }
    console.log(``);
  }
  console.log(`\u{1F44D} All done!`);
  console.log(`\u{1F496} Brought to you by https://twitter.com/RoyalB88`);
  console.log(``);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  processSite
});
//# sourceMappingURL=index.cjs.map