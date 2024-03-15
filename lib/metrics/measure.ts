import { Kind, UnitOfTime } from '../util/types.js';
import { MetricBroadcaster } from './broadcaster.js';
import { isBigint, isHrTimeAvailable, isPromiseLike } from '../util/predicates.js';
import { convertRecordedTime } from '../util/transfomers.js';

type MeasureDecorator = <TThis, TArgs extends unknown[], Return>(
    // eslint-disable-next-line @typescript-eslint/ban-types
    target: Function,
    ctx: ClassMethodDecoratorContext<TThis, (this: TThis, ...args: TArgs) => Return>,
) => void;

/**
 * A Method Decorat that measures execution time if hrtime is available it will be leverage
 * if not timings will be measured using dates. The time will be broadcasted in the specified unit.
 * @param label that will be used for broadcasting
 * @param unit which the time should be record in
 */
export function Measure(label: string, unit: UnitOfTime): MeasureDecorator {
    return <TThis, TArgs extends unknown[], Return>(
        // eslint-disable-next-line @typescript-eslint/ban-types
        target: Function,
        _ctx: ClassMethodDecoratorContext<TThis, (this: TThis, ...args: TArgs) => Return>,
    ) => {
        const broadcaster = MetricBroadcaster.getInstance();

        return function (this: TThis, ...args: unknown[]): Return {
            const start: bigint | number = isHrTimeAvailable() ? process.hrtime.bigint() : Date.now();
            const finishTiming = (): void => {
                const total: bigint | number = isBigint(start) ? process.hrtime.bigint() - start : Date.now() - start;
                const convertedTotal = convertRecordedTime(total, unit);
                broadcaster.broadcast(Kind.Timing, { label, value: convertedTotal });
            };

            try {
                const result = target.call(this, ...args) as Return;
                if (isPromiseLike(result)) {
                    return new Promise((resolve, reject) => {
                        result
                            .then((response) => {
                                finishTiming();
                                resolve(response);
                            })
                            .catch((error: Error) => {
                                finishTiming();
                                reject(error);
                            });
                    }) as Return;
                }

                finishTiming();
                return result;
            } catch (error) {
                finishTiming();
                throw error;
            }
        };
    };
}
