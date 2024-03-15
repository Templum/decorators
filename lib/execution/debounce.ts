import { UnitOfTime } from '../util/types.js';
import { convertFrom } from '../util/transfomers.js';

type DebounceDecorator = <TThis, TArgs extends unknown[], Return extends void>(
    // eslint-disable-next-line @typescript-eslint/ban-types
    target: Function,
    ctx: ClassMethodDecoratorContext<TThis, (this: TThis, ...args: TArgs) => Return>,
) => void;

/**
 * A Method Decorator that debounces additional calls being made to the decorated target. If the debounce
 * window has not yet passed.
 * @param time value
 * @param unit of the provided timing
 */
export function Debounce(time: number, unit: Exclude<UnitOfTime, 'Nanosecond'>): DebounceDecorator {
    return <TThis, TArgs extends unknown[], Return extends void>(
        // eslint-disable-next-line @typescript-eslint/ban-types
        target: Function,
        ctx: ClassMethodDecoratorContext<TThis, (this: TThis, ...args: TArgs) => Return>,
    ) => {
        const timeToNextCall = Symbol.for('timeToNextCall');
        type Patched = TThis & { [timeToNextCall]: number };

        ctx.addInitializer(function () {
            (this as Patched)[timeToNextCall] = 0;
        });

        return function (this: Patched, ...args: unknown[]): void {
            if (Date.now() >= this[timeToNextCall]) {
                this[timeToNextCall] = Date.now() + convertFrom(time, UnitOfTime.Millisecond, unit);
                return target.call(this, ...args) as Return;
            }
            return;
        };
    };
}
