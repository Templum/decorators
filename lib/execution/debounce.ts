import { MethodDecorator, UnitOfTime } from '../util/types.js';
import { convertFrom } from '../util/transfomers.js';

/**
 * A Method Decorator that debounces additional calls beig made to the decorated target. If the debounce
 * window has not yet passed.
 * @param time value
 * @param unit of the provided timing
 */
export function Debounce(time: number, unit: Exclude<UnitOfTime, 'Nanosecond'>): MethodDecorator {
    // eslint-disable-next-line @typescript-eslint/ban-types
    return (target: Function, _ctx: ClassMethodDecoratorContext) => {
        let timeToNextCall = 0;

        return (self: unknown, ...args: unknown[]): unknown => {
            if (Date.now() >= timeToNextCall) {
                timeToNextCall = Date.now() + convertFrom(time, UnitOfTime.Millisecond, unit);
                return target.call(self, args);
            }
            return;
        };
    };
}
