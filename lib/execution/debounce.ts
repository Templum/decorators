import { MethodDecorator, UnitOfTime } from '../util/types.js';
import { convertFrom } from '../util/transfomers.js';

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
