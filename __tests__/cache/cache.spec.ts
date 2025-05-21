import { CACHE_KEY, Cache, CacheKey } from "../../lib/cache/cache.js";
import { UnitOfTime } from "../../lib/util/types.js";

describe('Cache Decorator', () => {
    it('should perform NO-OP if CacheKey has not injected a value', async () => {
        class Test {
            constructor(private spy: jest.Mock) { }

            @Cache()
            public missesOutterDecorator(): number {
                this.spy();
                return 1
            }
        }

        const callRecorder = jest.fn();
        const target = new Test(callRecorder);

        expect(target.missesOutterDecorator()).toEqual(1);
        expect(target.missesOutterDecorator()).toEqual(1);

        expect(callRecorder).toHaveBeenCalledTimes(2);
    });

    describe('Sync Method', () => {
        it('should cache successfull calls for a time', async () => {
            class Test {
                constructor(private spy: jest.Mock) { }

                @CacheKey(1)
                @Cache({ ttl: 5, unit: UnitOfTime.Millisecond })
                public expensiveCall(account: string, key: string): number {
                    this.spy(key);
                    return 1
                }
            }

            const callRecorder = jest.fn();
            const target = new Test(callRecorder);

            expect(target.expensiveCall('123456', 'cache')).toEqual(1);
            expect(target.expensiveCall('123456', 'cache')).toEqual(1);
            expect(target.expensiveCall('123456', 'cacher')).toEqual(1);

            expect(callRecorder).toHaveBeenNthCalledWith(1, 'cache');
            expect(callRecorder).toHaveBeenNthCalledWith(2, 'cacher');
            expect(callRecorder).toHaveBeenCalledTimes(2);
        });

        it('should call method if cached value is expired', async () => {
            class Test {
                constructor(private spy: jest.Mock) { }

                @CacheKey(0)
                @Cache({ ttl: 5, unit: UnitOfTime.Millisecond })
                public expensiveCall(account: string): number {
                    this.spy(account);
                    return 1
                }
            }

            const callRecorder = jest.fn();
            const target = new Test(callRecorder);

            expect(target.expensiveCall('123456')).toEqual(1);
            expect(target.expensiveCall('123456')).toEqual(1);

            await new Promise(resolve => setTimeout(resolve, 10));

            expect(target.expensiveCall('123456')).toEqual(1);
            expect(target.expensiveCall('123456')).toEqual(1);

            expect(callRecorder).toHaveBeenCalledWith('123456');
            expect(callRecorder).toHaveBeenCalledTimes(2);
        });

        it('should not cache errors', async () => {
            class Test {
                constructor(private spy: jest.Mock) { }

                @CacheKey(0)
                @Cache({ ttl: 5, unit: UnitOfTime.Millisecond })
                public expensiveCall(account: string): number {
                    this.spy(account);
                    throw new Error('Oops');
                }
            }

            const callRecorder = jest.fn();
            const target = new Test(callRecorder);

            expect(() => target.expensiveCall('123456')).toThrow('Oops');
            expect(() => target.expensiveCall('123456')).toThrow('Oops');

            expect(callRecorder).toHaveBeenCalledWith('123456');
            expect(callRecorder).toHaveBeenCalledTimes(2);
        });
    });

    describe('Async Method', () => {
        it('should cache successfull calls for a time', async () => {
            class Test {
                constructor(private spy: jest.Mock) { }

                @CacheKey(1)
                @Cache({ ttl: 5, unit: UnitOfTime.Millisecond })
                public async expensiveCall(account: string, key: string): Promise<number> {
                    this.spy(key);
                    return 1
                }
            }

            const callRecorder = jest.fn();
            const target = new Test(callRecorder);

            await expect(target.expensiveCall('123456', 'cache')).resolves.toEqual(1);
            await expect(target.expensiveCall('123456', 'cache')).resolves.toEqual(1);
            await expect(target.expensiveCall('123456', 'cacher')).resolves.toEqual(1);

            expect(callRecorder).toHaveBeenNthCalledWith(1, 'cache');
            expect(callRecorder).toHaveBeenNthCalledWith(2, 'cacher');
            expect(callRecorder).toHaveBeenCalledTimes(2);
        });

        it('should call method if cached value is expired', async () => {
            class Test {
                constructor(private spy: jest.Mock) { }

                @CacheKey(0)
                @Cache({ ttl: 5, unit: UnitOfTime.Millisecond })
                public async expensiveCall(account: string): Promise<number> {
                    this.spy(account);
                    return 1
                }
            }

            const callRecorder = jest.fn();
            const target = new Test(callRecorder);

            await expect(target.expensiveCall('123456')).resolves.toEqual(1);
            await expect(target.expensiveCall('123456')).resolves.toEqual(1);

            await new Promise(resolve => setTimeout(resolve, 10));

            await expect(target.expensiveCall('123456')).resolves.toEqual(1);
            await expect(target.expensiveCall('123456')).resolves.toEqual(1);

            expect(callRecorder).toHaveBeenCalledWith('123456');
            expect(callRecorder).toHaveBeenCalledTimes(2);
        });

        it('should not cache errors', async () => {
            class Test {
                constructor(private spy: jest.Mock) { }

                @CacheKey(0)
                @Cache({ ttl: 5, unit: UnitOfTime.Millisecond })
                public async expensiveCall(account: string): Promise<number> {
                    this.spy(account);
                    throw new Error('Oops');
                }
            }

            const callRecorder = jest.fn();
            const target = new Test(callRecorder);

            await expect(target.expensiveCall('123456')).rejects.toThrow('Oops');
            await expect(target.expensiveCall('123456')).rejects.toThrow('Oops');

            expect(callRecorder).toHaveBeenCalledWith('123456');
            expect(callRecorder).toHaveBeenCalledTimes(2);
        });
    });
});

describe('Cache Key Decorator', () => {
    test('should inject a valid string parameter into call to @Cache', async () => {
        class Test {
            constructor(private spy: jest.Mock) { }

            @CacheKey(0)
            public ಠ_ಠ(...args: unknown[]): string {
                this.spy(...args);
                return 'Hello'
            }
        }

        const callRecorder = jest.fn();
        const target = new Test(callRecorder);
        const result = target.ಠ_ಠ('Hello');

        expect(result).toEqual('Hello')

        expect(callRecorder).toHaveBeenCalledWith({ [CACHE_KEY]: 'Hello' }, 'Hello');
        expect(callRecorder).toHaveBeenCalledTimes(1);
    });

    test('should perform NO-OP if decorated target is not @Cache', async () => {
        class Test {
            constructor(private spy: jest.Mock) { }

            @CacheKey(0)
            public notCache(args: string): string {
                this.spy(args);
                return 'Hello'
            }
        }

        const callRecorder = jest.fn();
        const target = new Test(callRecorder);
        const result = target.notCache('Hello');

        expect(result).toEqual('Hello')
        expect(callRecorder).toHaveBeenCalledWith('Hello');
        expect(callRecorder).toHaveBeenCalledTimes(1);
    });

    test('should perform NO-OP if configured position is smaller than 0', async () => {
        class Test {
            constructor(private spy: jest.Mock) { }

            @CacheKey(-1)
            public ಠ_ಠ(args: string): string {
                this.spy(args);
                return 'Hello'
            }
        }

        const callRecorder = jest.fn();
        const target = new Test(callRecorder);
        const result = target.ಠ_ಠ('Hello');

        expect(result).toEqual('Hello')
        expect(callRecorder).toHaveBeenCalledWith('Hello');
        expect(callRecorder).toHaveBeenCalledTimes(1);
    });

    test('should perform NO-OP if configured position is larger than arguments', async () => {
        class Test {
            constructor(private spy: jest.Mock) { }

            @CacheKey(2)
            public ಠ_ಠ(args: string): string {
                this.spy(args);
                return 'Hello'
            }
        }

        const callRecorder = jest.fn();
        const target = new Test(callRecorder);
        const result = target.ಠ_ಠ('Hello');

        expect(result).toEqual('Hello')
        expect(callRecorder).toHaveBeenCalledWith('Hello');
        expect(callRecorder).toHaveBeenCalledTimes(1);
    });

    test('should perform NO-OP if configured postion belongs to none string argument', async () => {
        class Test {
            constructor(private spy: jest.Mock) { }

            @CacheKey(0)
            public ಠ_ಠ(args: number): string {
                this.spy(args);
                return 'Hello'
            }
        }

        const callRecorder = jest.fn();
        const target = new Test(callRecorder);
        const result = target.ಠ_ಠ(12);

        expect(result).toEqual('Hello')
        expect(callRecorder).toHaveBeenCalledWith(12);
        expect(callRecorder).toHaveBeenCalledTimes(1);
    });
});