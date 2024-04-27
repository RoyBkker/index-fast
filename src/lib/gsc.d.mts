export declare function convertToSiteUrl(input: string): string;
export declare function getPageIndexingStatus(accessToken: string, siteUrl: string, inspectionUrl: string): Promise<string>;
export declare function getEmojiForStatus(status: string): "✅" | "😵" | "👀" | "🔀" | "❓" | "❌";
export declare function getPublishMetadata(accessToken: string, url: string): Promise<number>;
export declare function requestIndexing(accessToken: string, url: string): Promise<void>;
