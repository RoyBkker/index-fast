# Google Indexing Script

This script helps get your whole site noticed by Google in less than 48 hours. It's simple and uses a Google API.

## What You Need

- A [Google Search Console](https://search.google.com/search-console/about) account with sites you want to index
- A [Google Cloud](https://console.cloud.google.com/) account

## How to Use

1. Run `npm install @roybakker/index-fast`
2. Follow this [guide](https://developers.google.com/search/apis/indexing-api/v3/prereqs) from Google. You should end up with a Google Cloud project with the Indexing API turned on, and a service account that can manage your sites.
3. Turn on both the `Google Search Console API` and the `Web Search Indexing API` in your [Google Project ➤ API Services ➤ Enabled API & Services](https://console.cloud.google.com/apis/dashboard).
4. [Download the JSON](https://github.com/goenning/google-indexing-script/issues/2) file with your service account's credentials and save it in the same folder as the script. Name the file `service_account.json`.

5. - If your site is a `Domain` Property on GSC, use it like `processSite('example.com')`.
   - If it's a `URL Prefix` property, use it like `processSite('https://www.example.com')`.
   - If unsure, try both 😀. Or have a look in your Google Search Console for the correct property naming.

## Example

```
import { processSite } from "@roybakker/index-fast";

processSite("brickifyme.com");  // or processSite("https://www.brickifyme.com");

```

**Important Notes:**

- Your site needs one or more sitemaps on Google Search Console. If not, the script can't find the pages to index.
- You can use the script many times. It will only index pages that aren't already indexed.
- Indexing many pages might take time, so be patient.

## 📄 License

GPL-3.0-only

## 💖 Sponsor

This project is supported by [BrickifyMe](https://www.BrickifyMe.com)

![](https://www.Brickifyme.com/og-twitter-card-1.png)

## Credits

- Inspired by https://github.com/goenning
