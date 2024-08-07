import { UnitOfTime } from '../util/types.js';
import { convertFrom } from '../util/transfomers.js';

type DebounceDecorator = <TThis, TArgs extends unknown[], Return extends void>(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    target: Function,
    ctx: ClassMethodDecoratorContext<TThis, (this: TThis, ...args: TArgs) => Return>,
) => void;

/**
 * Debounce is an Class Method Decorator, that is configured with the specified parameters.
 * It debounces additional calls to the decorated method during the debounce window. Hence
 * the decorated method needs to have a void type return.
 *
 * ```ts
 * import { Debounce, UnitOfTime } from "@templum/decorators";
 *
 * class Example {
 *      @Debounce(5, UnitOfTime.Millisecond)
 *      public reportEvent(): void {
 *          ...
 *      }
 * }
 * ```
 *
 * @param time value
 * @param unit of the provided timing
 *
 */
export function Debounce(time: number, unit: Exclude<UnitOfTime, 'Nanosecond'>): DebounceDecorator {
    return <TThis, TArgs extends unknown[], Return extends void>(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
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
