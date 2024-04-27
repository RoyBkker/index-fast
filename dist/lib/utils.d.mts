interface BatchProcess {
    (url: string): Promise<void>;
}
export declare function batch(task: BatchProcess, items: string[], batchSize: number, onBatchComplete: {
    (batchIndex: number, batchCount: number): void;
    (arg0: number, arg1: number): void;
}): Promise<void>;
export declare function fetchRetry(url: string | URL | Request, options: RequestInit | undefined, retries?: number): Promise<Response>;
export {};
