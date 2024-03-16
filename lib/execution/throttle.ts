import { UnitOfTime } from '../util/types.js';
import { convertFrom } from '../util/transfomers.js';

type ThrottleDecorator = <TThis, TArgs extends unknown[], Return extends void>(
    // eslint-disable-next-line @typescript-eslint/ban-types
    target: Function,
    ctx: ClassMethodDecoratorContext<TThis, (this: TThis, ...args: TArgs) => Return>,
) => void;

/**
 * Throttle is an Class Method Decorator, that is configured with the specified parameters.
 * It throttle additional calls to the decorated method during the throttle window. It will
 * only pass calls to the decorated method during the starting edge of the throttle window.
 * The decorated method needs to have a void type return.
 *
 * @param time value
 * @param unit of the provided timing
 *
 * ```ts
 * class Example {
 *      @Throttle(5, UnitOfTime.Millisecond)
 *      public reportEvent(): void {
 *          ...
 *      }
 * }
 * ```
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
