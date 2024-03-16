import { isPromiseLike } from '../util/predicates.js';
import { convertFrom } from '../util/transfomers.js';
import { UnitOfTime } from '../util/types.js';

/**
 * Retry Strategy for more details on the functions look at the individual members
 */
export enum RetryStrategy {
    /**
     * Calls will be made with a expontential growing delay waiting between attempts.
     * This is useable by functions that return promise or are async. Sync methods can not use it.
     */
    Exponential,
    /**
     * Calls will be made with a fixed delay between attempts.
     * This is useable by functions that return promise or are async. Sync methods can not use it.
     */
    Delay,
    /**
     * Calls will be made sequential without explicit waiting time between them.
     * Sync methods only support this strategy as Exponential would change the return type.
     */
    Sequential,
}

/**
 * Allows to configure the retry behaviour
 */
export type RetryConfig = {
    /**
     * Defaults to 3
     */
    retries: number;
    /**
     * Defaults to RetryStrategy.Delay, only relevant for Promise/Async Methods
     */
    strategy: RetryStrategy;
    /**
     * Defaults to 100, only relevant with proper RetryStrategy
     */
    delay: number;
    /**
     * Default to MS, only relevant with proper RetryStrategy
     */
    unit: Omit<UnitOfTime, 'Nanosecond'>;
};

type RetryDecorator = <TThis, TArgs extends unknown[], Return>(
    // eslint-disable-next-line @typescript-eslint/ban-types
    target: Function,
    ctx: ClassMethodDecoratorContext<TThis, (this: TThis, ...args: TArgs) => Return>,
) => void;

const defaultConfig: RetryConfig = {
    retries: 3,
    strategy: RetryStrategy.Delay,
    delay: 100,
    unit: UnitOfTime.Millisecond,
};

/**
 * Retry is an Class Method Decorator, that is configured using an configuration parameter and an predicate function.
 * It will attempt retries if the decorated method raised an retrtieable error. Deciding if an error is fatal or retrieable
 * happens using the provided predicate. How it will retry can be configured.
 *
 * Please be aware that sync method may only leverage the {@link RetryStrategy.Sequential} Strategie in order to ensure the return type is not altered.
 * @param isRetrieable method that is called with the catched error to determine if it can be retried
 * @param config for the retry behaviour, default is 3 retries with fixed delay of 100ms
 *
 * ```ts
 * class Example {
 *      @Retry(
 *          error => error instanceof Error,
 *          { strategy: RetryStrategy.Exponential, delay: 5, unit: UnitOfTime.Millisecond }
 *      )
 *      public consumeAPI(): Promise<Record<string,string>> {
 *          ...
 *      }
 * }
 * ```
 */
export function Retry(isRetrieable: (error: Error) => boolean, config: Partial<RetryConfig> = {}): RetryDecorator {
    const { retries, delay, unit, strategy } = Object.assign(defaultConfig, config);
    const delayInMs = convertFrom(delay, UnitOfTime.Millisecond, unit as UnitOfTime);

    return <TThis, TArgs extends unknown[], Return>(
        // eslint-disable-next-line @typescript-eslint/ban-types
        target: Function,
        _ctx: ClassMethodDecoratorContext<TThis, (this: TThis, ...args: TArgs) => Return>,
    ) => {
        // eslint-disable-next-line @typescript-eslint/ban-types
        return function (this: TThis, ...args: unknown[]): Return {
            const handleSyncRetries = (): unknown => {
                for (let attempt = 0; attempt < retries; attempt++) {
                    try {
                        const result: unknown = target.call(this, ...args);
                        return result;
                    } catch (error) {
                        if (!isRetrieable(error as Error) || attempt + 1 >= retries) {
                            throw error;
                        }
                    }
                }
            };

            const handleAsyncRetries = async (): Promise<unknown> => {
                for (let attempt = 0; attempt < retries; attempt++) {
                    try {
                        const result: Promise<unknown> = target.call(this, ...args) as Promise<unknown>;
                        return await result;
                    } catch (error) {
                        if (!isRetrieable(error as Error) || attempt + 1 >= retries) {
                            throw error;
                        }

                        if (strategy === RetryStrategy.Delay) {
                            await new Promise<void>((resolve) => setTimeout(resolve, delayInMs));
                        }

                        if (strategy === RetryStrategy.Exponential) {
                            await new Promise<void>((resolve) => setTimeout(resolve, delayInMs * (attempt + 1)));
                        }
                    }
                }
            };

            try {
                const result: unknown = target.call(this, ...args);

                if (isPromiseLike(result)) {
                    return new Promise((resolve, reject) => {
                        result
                            .then((response) => resolve(response))
                            .catch((_error) =>
                                handleAsyncRetries()
                                    .then((response) => resolve(response))
                                    .catch((error) => reject(error)),
                            );
                    }) as Return;
                }

                return result as Return;
            } catch (_error) {
                return handleSyncRetries() as Return;
            }
        };
    };
}
