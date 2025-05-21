import { isPromiseLike } from '../util/predicates.js';
import { convertFrom } from '../util/transfomers.js';
import { UnitOfTime } from '../util/types.js';

type RetryDecorator = <TThis, TArgs extends unknown[], Return>(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    target: Function,
    ctx: ClassMethodDecoratorContext<TThis, (this: TThis, ...args: TArgs) => Return>,
) => void;

/**
 * Retry Strategy for more details on the functions look at the individual members
 */
export enum RetryStrategy {
    /**
     * Calls will be made with a expontential growing delay between attempts.
     * This is useable by functions that return promise or are async. Sync methods can not use it.
     */
    Exponential,
    /**
     * Calls will be made with a fixed delay between attempts.
     * This is useable by functions that return promise or are async. Sync methods can not use it.
     */
    Delay,
    /**
     * Calls will be made sequential without any delay between attempts.
     * Sync methods only support this strategy as Exponential would change the return type.
     */
    Sequential,
}

/**
 * Allows to configure the retry behaviour
 *
 * ```ts
 *const defaultConfig: RetryConfig = {
 *    retries: 3,
 *    strategy: RetryStrategy.Delay,
 *    delay: 100,
 *    unit: UnitOfTime.Millisecond,
 *};
 * ```
 *
 */
export type RetryConfig = {
    /**
     * Specifies the retries that should be made
     */
    retries: number;
    /**
     * Specifies in which way retries should be attempted
     */
    strategy: RetryStrategy;
    /**
     * The base delay, get's ignored for {@link RetryStrategy.Sequential}
     */
    delay: number;
    /**
     * Unit of the delay, does not support Nanoseconds
     */
    unit: Omit<UnitOfTime, 'Nanosecond'>;
};

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
 * Please be aware that sync method may only leverage the {@link RetryStrategy.Sequential} in order to ensure the return type is not altered.
 *
 * ```ts
 * import { Retry, RetryStrategy, UnitOfTime } from "@templum/decorators";
 *
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
 *
 * @param isRetrieable method that is called with the catched error to determine if it can be retried
 * @param config for the retry behaviour, default is 3 retries with fixed delay of 100ms
 *
 */
export function Retry(isRetrieable: (error: Error) => boolean, config: Partial<RetryConfig> = {}): RetryDecorator {
    const { retries, delay, unit, strategy } = Object.assign(defaultConfig, config);
    const delayInMs = convertFrom(delay, UnitOfTime.Millisecond, unit as UnitOfTime);

    return <TThis, TArgs extends unknown[], Return>(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
        target: Function,
        _ctx: ClassMethodDecoratorContext<TThis, (this: TThis, ...args: TArgs) => Return>,
    ) => {
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
                            const exponentialDelay = delayInMs * (attempt + 1);
                            await new Promise<void>((resolve) => setTimeout(resolve, exponentialDelay));
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
                                    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
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
