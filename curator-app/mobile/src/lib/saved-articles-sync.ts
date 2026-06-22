type UnsaveListener = (articleIds: string[]) => void;

const unsaveListeners = new Set<UnsaveListener>();

export function subscribeArticlesUnsaved(listener: UnsaveListener): () => void {
  unsaveListeners.add(listener);
  return () => {
    unsaveListeners.delete(listener);
  };
}

export function notifyArticlesUnsaved(articleIds: string[]): void {
  if (articleIds.length === 0) {
    return;
  }
  for (const listener of unsaveListeners) {
    listener(articleIds);
  }
}

/** Serialize async mutations so responses cannot overwrite each other. */
export function createSaveMutationQueue() {
  let chain = Promise.resolve();

  return function enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = chain.then(task, task);
    chain = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  };
}
