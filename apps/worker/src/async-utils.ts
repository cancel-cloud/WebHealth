export async function withTimeout<T>(
  promise: Promise<T>,
  input: { timeoutMs: number; label: string },
): Promise<T> {
  let timeoutId: NodeJS.Timeout | null = null;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`${input.label} timed out after ${input.timeoutMs}ms`));
        }, input.timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
