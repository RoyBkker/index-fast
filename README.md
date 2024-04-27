# Google Indexing Script

This script helps get your whole site noticed by Google in less than 48 hours. It's simple and uses a Google API.

> [!IMPORTANT]
>
> 1. Indexing is not the same as Ranking. This script won't improve your Google ranking, but it will let Google know your pages exist.
> 2. This script uses the [Google Indexing API](https://developers.google.com/search/apis/indexing-api/v3/quickstart). Not every page is guaranteed to be indexed, but tests in December 2023 showed good results.

## What You Need

- Install [Node.js](https://nodejs.org/en/download)
- A [Google Search Console](https://search.google.com/search-console/about) account with sites you want to index
- A [Google Cloud](https://console.cloud.google.com/) account

## Getting Ready

1. Download or clone this repository.
2. Follow this [guide](https://developers.google.com/search/apis/indexing-api/v3/prereqs) from Google. You should end up with a Google Cloud project with the Indexing API turned on, and a service account that can manage your sites.
3. Turn on both the `Google Search Console API` and the `Web Search Indexing API` in your [Google Project ➤ API Services ➤ Enabled API & Services](https://console.cloud.google.com/apis/dashboard).
4. [Download the JSON](https://github.com/goenning/google-indexing-script/issues/2) file with your service account's credentials and save it in the same folder as the script. Name the file `service_account.json`.

## How to Use

1. Open a terminal and go to the folder where you saved the repository.
2. Make sure your Node.js is up to date, preferably version 20 or later. Check your version with `node -v`.
3. Run `npm install` to set up the needed software.
4. Run `npm run index <domain or url>` to let Google know about your site's pages.

- If your site is a `Domain` Property on GSC, use it like `npm run index brickifyme.com`.
- If it's a `URL Prefix` property, use it like `npm run index https://brickifyme.com`.
- If unsure, try both 😀.

**Important Notes:**

- Your site needs one or more sitemaps on Google Search Console. If not, the script can't find the pages to index.
- You can use the script many times. It will only index pages that aren't already indexed.
- Indexing many pages might take time, so be patient.

## 📄 License

GPL-3.0-only

## 💖 Sponsor

This project is supported by [BrickifyMe](https://www.BrickifyMe.com)

![](https://www.Brickifyme.com/og-twitter-card-1.png)
