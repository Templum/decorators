import { UnitOfTime } from '../util/types.js';
import { convertFrom } from '../util/transfomers.js';

type ThrottleDecorator = <TThis, TArgs extends unknown[], Return extends void>(
    // eslint-disable-next-line @typescript-eslint/ban-types
    target: Function,
    ctx: ClassMethodDecoratorContext<TThis, (this: TThis, ...args: TArgs) => Return>,
) => void;

/**
 * A Method Decorator that throttles calls being made to the decorated target. Ensuring that
 * calls are at most called once per defined time window
 * @param time value
 * @param unit of the provided timing
 */
export function Throttle(time: number, unit: Exclude<UnitOfTime, 'Nanosecond'>): ThrottleDecorator {
    return <TThis, TArgs extends unknown[], Return extends void>(
        // eslint-disable-next-line @typescript-eslint/ban-types
        target: Function,
        ctx: ClassMethodDecoratorContext<TThis, (this: TThis, ...args: TArgs) => Return>,
    ) => {
        const pendingTimeout = Symbol.for('pendingTimeout');
        type Patched = TThis & { [pendingTimeout]: unknown };

        ctx.addInitializer(function () {
            (this as Patched)[pendingTimeout] = undefined;
        });

        const timeoutInMs = convertFrom(time, UnitOfTime.Millisecond, unit);

        return function (this: Patched, ...args: unknown[]): void {
            if (this[pendingTimeout] === undefined) {
                this[pendingTimeout] = setTimeout(() => {
                    this[pendingTimeout] = undefined;
                }, timeoutInMs);

                return target.call(this, ...args) as Return;
            }
            return;
        };
    };
}
