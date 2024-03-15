import { isPromiseLike } from '../util/predicates.js';
import { Kind } from '../util/types.js';
import { MetricBroadcaster } from './broadcaster.js';

type GaugeDecorator = <TThis, TArgs extends unknown[], Return>(
    // eslint-disable-next-line @typescript-eslint/ban-types
    target: Function,
    ctx: ClassMethodDecoratorContext<TThis, (this: TThis, ...args: TArgs) => Return>,
) => void;

/**
 * A Method Decorator that tracks ongoing calls and broadcast updates as the happen.
 * @param label that will be used for broadcasting
 */
export function Gauge(label: string): GaugeDecorator {
    return <TThis, TArgs extends unknown[], Return>(
        // eslint-disable-next-line @typescript-eslint/ban-types
        target: Function,
        _ctx: ClassMethodDecoratorContext<TThis, (this: TThis, ...args: TArgs) => Return>,
    ) => {
        const broadcaster = MetricBroadcaster.getInstance();
        let inflight = 0;

        return function (this: TThis, ...args: unknown[]): Return {
            try {
                inflight += 1;
                broadcaster.broadcast(Kind.Counter, { label, value: inflight });

                const result = target.call(this, ...args) as Return;
                if (isPromiseLike(result)) {
                    return new Promise((resolve, reject) => {
                        result
                            .then((response) => {
                                inflight -= 1;
                                broadcaster.broadcast(Kind.Counter, { label, value: inflight });

                                resolve(response);
                            })
                            .catch((error: Error) => {
                                inflight -= 1;
                                broadcaster.broadcast(Kind.Counter, { label, value: inflight });

                                reject(error);
                            });
                    }) as Return;
                }
                inflight -= 1;
                broadcaster.broadcast(Kind.Counter, { label, value: inflight });

                return result;
            } catch (error) {
                inflight -= 1;
                broadcaster.broadcast(Kind.Counter, { label, value: inflight });

                throw error;
            }
        };
    };
}
