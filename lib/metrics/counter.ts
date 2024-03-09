import { Kind } from '../util/types.js';
import { MetricBroadcaster } from './broadcaster.js';

type CounterDecorator = <TThis, TArgs extends unknown[], Return>(
    // eslint-disable-next-line @typescript-eslint/ban-types
    target: Function,
    ctx: ClassMethodDecoratorContext<TThis, (this: TThis, ...args: TArgs) => Return>,
) => void;

export function Counter(label: string): CounterDecorator {
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
