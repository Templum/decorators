import { UnitOfTime } from '../util/types.js';
import { convertFrom } from '../util/transfomers.js';

/**
 * A Method Decorator that throttles calls being made to the decorated target. Ensuring that
 * calls are at most called once per defined time window
 * @param time value
 * @param unit of the provided timing
 */
export function Throttle(time: number, unit: Exclude<UnitOfTime, 'Nanosecond'>) {
    // eslint-disable-next-line @typescript-eslint/ban-types
    return (target: Function, _ctx: ClassMethodDecoratorContext) => {
        let pendingTimeout: unknown = undefined;

        return <Fn, Arg, Result>(self: Fn, ...args: Arg[]): Result => {
            if (pendingTimeout === undefined) {
                pendingTimeout = setTimeout(
                    () => {
                        pendingTimeout = undefined;
                    },
                    convertFrom(time, UnitOfTime.Millisecond, unit),
                );
                return target.call(self, args) as Result;
            }
            return undefined as Result;
        };
    };
}
