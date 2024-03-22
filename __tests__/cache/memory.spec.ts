import { InMemoryCache } from "../../lib/cache/memory.js";

describe('InMemoryCache', () => {
    describe('constructor', () => {
        it('should have a default max size of 50', async () => {
            const target = new InMemoryCache<number>();
            expect(target.maxRecord).toEqual(50);
        });

        it('should use provided max size', async () => {
            const target = new InMemoryCache<number>(100);
            expect(target.maxRecord).toEqual(100);
        })
    });

    describe('store', () => {

        beforeAll(() => {
            jest.useFakeTimers({ now: 10000 });
        });

        afterAll(() => {
            jest.useRealTimers();
        });

        it('should store value with provided ttl', async () => {
            const target = new InMemoryCache<number>();

            const storeRecorder = jest.spyOn((target as any).cache as Map<string, number>, 'set')

            target.store('cache', 1337, 100);

            expect(storeRecorder).toHaveBeenCalledWith('cache', { value: 1337, ttl: Date.now() + 100 });
            expect(storeRecorder).toHaveBeenCalledTimes(1);
        });

        it('should store value with no ttl', async () => {
            const target = new InMemoryCache<number>();
            const storeRecorder = jest.spyOn((target as any).cache as Map<string, number>, 'set')

            target.store('cache', 1337);

            expect(storeRecorder).toHaveBeenCalledWith('cache', { value: 1337, ttl: -1 });
            expect(storeRecorder).toHaveBeenCalledTimes(1);
        });

        it('should clean older values of limit is reached', async () => {
            const target = new InMemoryCache<number>(1);
            const storeRecorder = jest.spyOn((target as any).cache as Map<string, number>, 'set')
            const deleteRecorder = jest.spyOn((target as any).cache as Map<string, number>, 'delete')

            target.store('cache', 1337);
            target.store('cacher', 1337);

            expect(storeRecorder).toHaveBeenCalledWith('cache', { value: 1337, ttl: -1 });
            expect(storeRecorder).toHaveBeenCalledWith('cacher', { value: 1337, ttl: -1 });
            expect(storeRecorder).toHaveBeenCalledTimes(2);

            expect(deleteRecorder).toHaveBeenCalledWith('cache');
            expect(deleteRecorder).toHaveBeenCalledTimes(1);
        });
    })

    describe('has', () => {
        const target = new InMemoryCache<number>();

        target.store('object_with_ttl', 1337, 13000);
        target.store('object_with_no_ttl', 1337, -1);
        target.store('object_expired', 1337, -100);

        it('should return true if value is cached and has not expired yet', async () => {
            expect(target.has('object_with_ttl')).toBeTruthy();
        });

        it('should return true if value is cached and never expires', async () => {
            expect(target.has('object_with_no_ttl')).toBeTruthy();
        })

        it('should return false if value is not cached', async () => {
            expect(target.has('random_object')).toBeFalsy();
        });

        it('should return false if value is cached but expired (also lazy delete expired value)', async () => {
            const deleteRecorder = jest.spyOn((target as any).cache as Map<string, number>, 'delete')
            expect(target.has('object_expired')).toBeFalsy();
            expect(deleteRecorder).toHaveBeenCalledWith('object_expired');
            expect(deleteRecorder).toHaveBeenCalledTimes(1);
        });
    });

    describe('get', () => {
        const target = new InMemoryCache<number>();

        target.store('object_with_ttl', 1337, 13000);
        target.store('object_with_no_ttl', 1337, -1);
        target.store('object_expired', 1337, -100);

        it('should return the cached value if value is cached and has not expired yet', async () => {
            expect(target.get('object_with_ttl')).toEqual(1337);
        });

        it('should return the cached value if value is cached and never expires', async () => {
            expect(target.get('object_with_no_ttl')).toEqual(1337);
        })

        it('should return undefined if value is not cached', async () => {
            expect(target.get('random_object')).toBeUndefined();
        });

        it('should return undefined if value is cached but expired (also lazy delete expired value)', async () => {
            const deleteRecorder = jest.spyOn((target as any).cache as Map<string, number>, 'delete')
            expect(target.get('object_expired')).toBeUndefined();
            expect(deleteRecorder).toHaveBeenCalledWith('object_expired');
            expect(deleteRecorder).toHaveBeenCalledTimes(1);
        });
    });
});