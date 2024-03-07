import { isPromiseLike } from '../util/predicates';
import { convertFrom } from '../util/transfomers';

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

const defaultConfig: RetryConfig = {
    retries: 3,
    strategy: RetryStrategy.Delay,
    delay: 100,
    unit: UnitOfTime.Millisecond,
};

export function Retry(isRetrieable: (error: Error) => boolean, config: Partial<RetryConfig> = {}) {
    const { retries, delay, unit, strategy } = Object.assign(defaultConfig, config);

    const delayInMs = convertFrom(delay, UnitOfTime.Millisecond, unit as UnitOfTime);

    // eslint-disable-next-line @typescript-eslint/ban-types
    return (target: Function, _ctx: ClassMethodDecoratorContext) => {
        return <Fn, Arg, Result>(self: Fn, ...args: Arg[]): Result => {
            const handleSyncRetries = (): unknown => {
                for (let attempt = 0; attempt < retries; attempt++) {
                    try {
                        const result: unknown = target.call(self, args);
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
                        const result: Promise<unknown> = target.call(self, args) as Promise<unknown>;
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
                const result: unknown = target.call(self, args);

                if (isPromiseLike(result)) {
                    return new Promise((resolve, reject) => {
                        result
                            .then((response) => resolve(response))
                            .catch((_error) =>
                                handleAsyncRetries()
                                    .then((response) => resolve(response))
                                    .catch((error) => reject(error)),
                            );
                    }) as Result;
                }

                return result as Result;
            } catch (_error) {
                return handleSyncRetries() as Result;
            }
        };
    };
}
