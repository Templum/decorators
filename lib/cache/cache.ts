import { UnitOfTime } from '../util/types.js';
import { convertFrom } from '../util/transfomers.js';
import { InMemoryCache } from './memory.js';
import { isCacheKey, isPromiseLike } from '../util/predicates.js';

type CacheDecorator = <TThis, TArgs extends unknown[], Return>(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    target: Function,
    ctx: ClassMethodDecoratorContext<TThis, (this: TThis, ...args: TArgs) => Return>,
) => void;

/**
 * Allows to configure the cache behaviour
 *
 * ```ts
 *const defaultConfig: RetryConfig = {
    cacheSize: 50,
    ttl: 10,
    unit: UnitOfTime.Minute,
 *};
 * ```
 * 
 */
export type CacheConfig = {
    cacheSize?: number;
    ttl?: number;
    unit?: Omit<UnitOfTime, UnitOfTime.Nanosecond>;
};

// Is used for transfering cache key between the involved decorators
export const CACHE_KEY = Symbol.for('Cache_Key');

/**
 * CacheKey is an Class Method Decorator, that expects the position of the parameter that should be used for caching.
 * It is ment to be used only in combination with {@link Cache}, if it is not decorating a Cache decorated method it will perform NO-OP.
 * If the position provided is outside of the parameter range it will perform NO-OP, also if the specified parameter is no string it will perform NO-OP.
 *
 * ```ts
 * import { CacheKey, Cache, UnitOfTime } from "@templum/decorators";
 *
 * class Example {
 *      @CacheKey(0)
 *      @Cache({ ttl: 1, unit: UnitOfTime.Minute })
 *      public consumeAPI(accountID:string, payload: Record<string, unknown>): Promise<Record<string,string>> {
 *          ...
 *      }
 * }
 * ```
 *
 * @param position of the param (that must be a string) that should be used for caching
 */
export function CacheKey(position: number): CacheDecorator {
    return <TThis, TArgs extends unknown[], Return>(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
        target: Function,
        _ctx: ClassMethodDecoratorContext<TThis, (this: TThis, ...args: TArgs) => Return>,
    ) => {
        // Decorator function has this uniquje name allowing us to identify it with near 99% certainty
        const shouldInject = target.name === 'ಠ_ಠ';

        return function (this: TThis, ...args: unknown[]): Return {
            if (!shouldInject || position < 0 || position > args.length) {
                return target.call(this, ...args) as Return;
            }

            const key = args[position];
            if (typeof key !== 'string') {
                return target.call(this, ...args) as Return;
            }

            return target.call(this, { [CACHE_KEY]: key }, ...args) as Return;
        };
    };
}

/**
 * Cache is an Class Method Decorator, that is configured using an configuration parameter.
 * By default it will leverage an memory based cache. It relies on {@link CacheKey} to know
 * which parameter should be used as a cache key.
 * For more details on how the underlaying cache operates checkout {@link InMemoryCache<TCached>}.
 *
 * Please be aware if CacheKey is not specified or incorrectly configured, it will not modify execution at all.
 *
 * ```ts
 * import { CacheKey, Cache, UnitOfTime } from "@templum/decorators";
 *
 * class Example {
 *      @CacheKey(0)
 *      @Cache({ ttl: 1, unit: UnitOfTime.Minute })
 *      public consumeAPI(accountID:string, payload: Record<string, unknown>): Promise<Record<string,string>> {
 *          ...
 *      }
 * }
 * ```
 *
 * @param config for the caching behaviour, defaults to a max cache of 50 with 10 min TTL.
 */
export function Cache(config?: CacheConfig): CacheDecorator {
    return <TThis, TArgs extends unknown[], Return>(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
        target: Function,
        _ctx: ClassMethodDecoratorContext<TThis, (this: TThis, ...args: TArgs) => Return>,
    ) => {
        const { cacheSize, ttl, unit } = Object.assign(
            {
                cacheSize: 50,
                ttl: 10,
                unit: UnitOfTime.Minute,
            },
            config,
        );

        const ttlInTargetUnit = convertFrom(ttl, UnitOfTime.Millisecond, unit as UnitOfTime);
        const cache = new InMemoryCache<Return>(cacheSize);

        return function ಠ_ಠ(this: TThis, ...args: unknown[]): Return {
            if (args.length === 0 || !isCacheKey(args[0])) {
                return target.call(this, ...args) as Return;
            }

            // Obtain Position and remove injected argument
            const key = args[0][CACHE_KEY];
            args.shift();

            if (cache.has(key)) {
                return cache.get(key)!;
            } else {
                const result = target.call(this, ...args) as Return;
                if (isPromiseLike(result)) {
                    return new Promise((resolve, reject) => {
                        result
                            .then((current) => {
                                cache.store(key, Promise.resolve(current) as Return, ttlInTargetUnit);
                                resolve(current);
                            })
                            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                            .catch((error) => reject(error));
                    }) as Return;
                }

                cache.store(key, result, ttlInTargetUnit);
                return result;
            }
        };
    };
}
