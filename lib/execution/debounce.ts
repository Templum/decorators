import { UnitOfTime } from '../util/types.js';
import { convertFrom } from '../util/transfomers.js';

type DebounceDecorator = <TThis, TArgs extends unknown[], Return extends void>(
    // eslint-disable-next-line @typescript-eslint/ban-types
    target: Function,
    ctx: ClassMethodDecoratorContext<TThis, (this: TThis, ...args: TArgs) => Return>,
) => void;
type BeforePatch = { _timeToNextCall_: number | undefined };
type AfterPatch = { _timeToNextCall_: number };

/**
 * A Method Decorator that debounces additional calls beig made to the decorated target. If the debounce
 * window has not yet passed.
 * @param time value
 * @param unit of the provided timing
 */
export function Debounce(time: number, unit: Exclude<UnitOfTime, 'Nanosecond'>): DebounceDecorator {
    return <TThis, TArgs extends unknown[], Return extends void>(
        // eslint-disable-next-line @typescript-eslint/ban-types
        target: Function,
        _ctx: ClassMethodDecoratorContext<TThis, (this: TThis, ...args: TArgs) => Return>,
    ) => {
        // TODO: Check if the patching can be moved to initializer

        // eslint-disable-next-line @typescript-eslint/ban-types
        return function (this: TThis, self: Function, ...args: unknown[]): void {
            if ((this as BeforePatch)._timeToNextCall_ === undefined) {
                (this as AfterPatch)._timeToNextCall_ = 0;
            }

            if (Date.now() >= (this as AfterPatch)._timeToNextCall_) {
                (this as AfterPatch)._timeToNextCall_ = Date.now() + convertFrom(time, UnitOfTime.Millisecond, unit);
                return self === undefined ? (target.call(this, args) as Return) : (target.call(self, args) as Return);
            }
            return;
        };
    };
}
