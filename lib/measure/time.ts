import { isHrTimeAvailable, isPromiseLike, isBigint } from '../util/predicates';
import { convertTime } from '../util/transfomers';
import type { MethodDecorator } from '../util/types.js';

export enum UnitOfTime {
    Nanosecond,
    Millisecond,
    Second,
    Minute,
}

export function RecordTime(unit: UnitOfTime): MethodDecorator {
    // eslint-disable-next-line @typescript-eslint/ban-types
    return (target: Function, ctx: ClassMethodDecoratorContext) => {
        return async (self: unknown, ...args: unknown[]) => {
            const startTime: bigint | number = isHrTimeAvailable() ? process.hrtime.bigint() : Date.now();

            try {
                let result: unknown = target.call(self, args);

                if (isPromiseLike(result)) {
                    result = await result;
                    const totalTime: bigint | number = isBigint(startTime) ? process.hrtime.bigint() - startTime : Date.now() - startTime;

                    const measuredTime: number = convertTime(totalTime, unit);
                    console.info(`Execution of ${ctx.name.toString()} took ${measuredTime}`);
                    return result;
                }

                const totalTime: bigint | number = isBigint(startTime) ? process.hrtime.bigint() - startTime : Date.now() - startTime;

                const measuredTime: number = convertTime(totalTime, unit);
                console.info(`Execution of ${ctx.name.toString()} took ${measuredTime}`);
                return result;
            } catch (error) {
                const totalTime: bigint | number = isBigint(startTime) ? process.hrtime.bigint() - startTime : Date.now() - startTime;

                const measuredTime: number = convertTime(totalTime, unit);
                console.info(`Execution of ${ctx.name.toString()} took ${measuredTime}`);
                throw error;
            }
        };
    };
}
