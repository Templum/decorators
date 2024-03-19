export interface ICache<TCached> {
    /**
     * Specifies the maximum number of records that should be stored.
     */
    maxRecord: number;

    /**
     * Checks if the memory cache contains a value for the provided key and ensure it's ttl is not reached.
     * Entries with ttl=-1 are considered to never expire.
     * @param key used for caching
     * @returns true if stored and ttl not reached, false if stored and ttl reach or not stored
     */
    has(key: string): Promise<boolean> | boolean;
    /**
     * This method stores the value in the cache using the provided ttl.
     * Furthmore this method ensure {@link maxRecord} is not exceeded.
     * @param key used for caching
     * @param value that should be cached
     * @param ttl ttl number that should be added to {@link Date.now} to obtain time until the entry is valid, ttl=-1 indicate record never expires
     */
    store(key: string, value: TCached, ttl?: number): Promise<void> | void;
    /**
     * Before getting the value it's best to check with {@link ICache<TCached>.has} if the value is present and not expired.
     * It will return the cached value and if the value is not cached or expired it will return undefined.
     * @param key used for caching
     */
    get(key: string): Promise<TCached | undefined> | TCached | undefined;
}

export class InMemoryCache<TCached> implements ICache<TCached> {
    private cache: Map<string, { value: TCached; ttl: number }>;
    constructor(public readonly maxRecord: number = 50) {
        this.cache = new Map<string, { value: TCached; ttl: number }>();
    }

    has(key: string): boolean {
        if (this.cache.has(key)) {
            const { ttl } = this.cache.get(key)!;
            if (ttl === -1 || Date.now() <= ttl) {
                return true;
            }

            this.cache.delete(key);
            return false;
        }

        return false;
    }

    store(key: string, value: TCached, ttl: number = -1): void {
        if (this.cache.size >= this.maxRecord) {
            const next = this.cache.keys().next();
            this.cache.delete(next.value as string);
        }

        this.cache.set(key, { value, ttl: ttl === -1 ? -1 : Date.now() + ttl });
    }

    get(key: string): TCached | undefined {
        return this.has(key) ? this.cache.get(key)!.value : undefined;
    }
}
