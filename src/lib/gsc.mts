import { fetchRetry } from "./utils.mjs";

export function convertToSiteUrl(input: string): string {
  if (input.startsWith("http://") || input.startsWith("https://")) {
    return input.endsWith("/") ? input : `${input}/`;
  }
  return `sc-domain:${input}`;
}

export async function getPageIndexingStatus(
  accessToken: string,
  siteUrl: string,
  inspectionUrl: string
): Promise<string> {
  try {
    const response = await fetchRetry(
      `https://searchconsole.googleapis.com/v1/urlInspection/index:inspect`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          inspectionUrl,
          siteUrl,
        }),
      }
    );

    if (response.status === 403) {
      console.error(
        `🔐 This service account doesn't have access to this site.`
      );
      console.error(await response.text());
      return "Forbidden";
    }

    if (response.status >= 300) {
      console.error(`❌ Failed to get indexing status.`);
      console.error(`Response was: ${response.status}`);
      console.error(await response.text());
      return "Error";
    }

    const body = await response.json();
    return body.inspectionResult.indexStatusResult.coverageState;
  } catch (error) {
    console.error(`❌ Failed to get indexing status.`);
    console.error(`Error was: ${error}`);
    throw error;
  }
}

export function getEmojiForStatus(status: string) {
  switch (status) {
    case "Submitted and indexed":
      return "✅";
    case "Duplicate without user-selected canonical":
      return "😵";
    case "Crawled - currently not indexed":
    case "Discovered - currently not indexed":
      return "👀";
    case "Page with redirect":
      return "🔀";
    case "URL is unknown to Google":
      return "❓";
    default:
      return "❌";
  }
}

export async function getPublishMetadata(
  accessToken: string,
  url: string
): Promise<number> {
  const response = await fetchRetry(
    `https://indexing.googleapis.com/v3/urlNotifications/metadata?url=${encodeURIComponent(
      url
    )}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (response.status === 403) {
    console.error(`🔐 This service account doesn't have access to this site.`);
    console.error(`Response was: ${response.status}`);
    console.error(await response.text());
  }

  if (response.status >= 500) {
    console.error(`❌ Failed to get publish metadata.`);
    console.error(`Response was: ${response.status}`);
    console.error(await response.text());
  }

  return response.status;
}

export async function requestIndexing(
  accessToken: string,
  url: string
): Promise<void> {
  const response = await fetchRetry(
    "https://indexing.googleapis.com/v3/urlNotifications:publish",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        url: url,
        type: "URL_UPDATED",
      }),
    }
  );

  if (response.status === 403) {
    console.error(`🔐 This service account doesn't have access to this site.`);
    console.error(`Response was: ${response.status}`);
  }

  if (response.status >= 300) {
    console.error(`❌ Failed to request indexing.`);
    console.error(`Response was: ${response.status}`);
    console.error(await response.text());
  }
}
