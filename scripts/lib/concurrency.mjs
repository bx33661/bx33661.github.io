export async function mapConcurrent(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  const count = Math.min(Math.max(1, limit), items.length);

  async function runWorker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: count }, runWorker));
  return results;
}
