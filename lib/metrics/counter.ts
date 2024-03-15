import { isPromiseLike } from '../util/predicates.js';
import { Kind } from '../util/types.js';
import { MetricBroadcaster } from './broadcaster.js';

type CounterDecorator = <TThis, TArgs extends unknown[], Return>(
    // eslint-disable-next-line @typescript-eslint/ban-types
    target: Function,
    ctx: ClassMethodDecoratorContext<TThis, (this: TThis, ...args: TArgs) => Return>,
) => void;

/**
 * A Method Decorator that counts all calls being made, does not differeniate between success and failure
 * @param label that will be used for broadcasting
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
 * A Method Decorator that counts calls being made and tracks success and failures
 * @param label will be used for broadcasting success and failure as {label}_success / {label}_failure
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
