import { isPromiseLike } from '../util/predicates.js';
import { Kind } from '../util/types.js';
import { MetricBroadcaster } from './broadcaster.js';

type CounterDecorator = <TThis, TArgs extends unknown[], Return>(
    // eslint-disable-next-line @typescript-eslint/ban-types
    target: Function,
    ctx: ClassMethodDecoratorContext<TThis, (this: TThis, ...args: TArgs) => Return>,
) => void;

/**
 * CallCounter is an Class Method Decorator as well as 'Metric' Decorator. The values recorded by this are consumable via the {@link MetricBroadcaster}.
 * It is a simple counter that increases everytime the method is called, it does not differentiate based on the outcome of the call.
 * The label will be part of the broadcasted metric and can be used to identify the origin.
 *
 * ```ts
 * import { CallCounter } from "@templum/decorators";
 *
 * class Example {
 *      @CallCounter('Something')
 *      public doSomething(): Promise<void> {
 *          ...
 *      }
 * }
 * ```
 *
 * @param label that will be used for broadcasting
 *
 */
export function CallCounter(label: string): CounterDecorator {
    return <TThis, TArgs extends unknown[], Return>(
        // eslint-disable-next-line @typescript-eslint/ban-types
        target: Function,
        _ctx: ClassMethodDecoratorContext<TThis, (this: TThis, ...args: TArgs) => Return>,
    ) => {
        const broadcaster = MetricBroadcaster.getInstance();
        let counter = 0;

        return function (this: TThis, ...args: unknown[]): Return {
            counter += 1;
            broadcaster.broadcast(Kind.Counter, { label, value: counter });

            return target.call(this, ...args) as Return;
        };
    };
}

/**
 * Counter is an Class Method Decorator as well as 'Metric' Decorator. The values recorded by this are consumable via the {@link MetricBroadcaster}.
 * It tracks the successfull and unsuccessfull calls to the decorated method.
 * The label will be part of the broadcasted metric and can be used to identify the origin.
 *
 * @param label builds the base for the broadcasting, success and failures will be broadcasted in the format {label}_success & {label}_failure
 *
 * ```ts
 * class Example {
 *      @Counter('CounterAPI')
 *      public mayFail(): Promise<void> {
 *          ...
 *      }
 * }
 * ```
 */
export function Counter(label: string): CounterDecorator {
    return <TThis, TArgs extends unknown[], Return>(
        // eslint-disable-next-line @typescript-eslint/ban-types
        target: Function,
        _ctx: ClassMethodDecoratorContext<TThis, (this: TThis, ...args: TArgs) => Return>,
    ) => {
        const broadcaster = MetricBroadcaster.getInstance();
        let success = 0;
        let failure = 0;

        return function (this: TThis, ...args: unknown[]): Return {
            try {
                const result = target.call(this, ...args) as Return;
                if (isPromiseLike(result)) {
                    return new Promise((resolve, reject) => {
                        result
                            .then((response) => {
                                success += 1;
                                broadcaster.broadcast(Kind.Counter, { label: `${label}_success`, value: success });

                                resolve(response);
                            })
                            .catch((error: Error) => {
                                failure += 1;
                                broadcaster.broadcast(Kind.Counter, { label: `${label}_failure`, value: failure });

                                reject(error);
                            });
                    }) as Return;
                }
                success += 1;
                broadcaster.broadcast(Kind.Counter, { label: `${label}_success`, value: success });

                return result;
            } catch (error) {
                failure += 1;
                broadcaster.broadcast(Kind.Counter, { label: `${label}_failure`, value: failure });

                throw error;
            }
        };
    };
}
