const createChunks = (arr: string[] | any[], size: number) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
    arr.slice(i * size, i * size + size)
  );

interface BatchProcess {
  (url: string): Promise<void>;
}

export async function batch(
  task: BatchProcess,
  items: string[],
  batchSize: number,
  onBatchComplete: {
    (batchIndex: number, batchCount: number): void;
    (arg0: number, arg1: number): void;
  }
): Promise<void> {
  const chunks = createChunks(items, batchSize);
  for (let i = 0; i < chunks.length; i++) {
    await Promise.all(chunks[i].map(task));
    onBatchComplete(i, chunks.length);
  }
}

export async function fetchRetry(
  url: string | URL | Request,
  options: RequestInit | undefined,
  retries = 5
) {
  try {
    const response = await fetch(url, options);
    if (response.status >= 500) {
      const body = await response.text();
      throw new Error(`Server error code ${response.status}\n${body}`);
    }
    return response;
  } catch (err) {
    if (retries <= 0) {
      throw err;
    }
    return fetchRetry(url, options, retries - 1);
  }
}
