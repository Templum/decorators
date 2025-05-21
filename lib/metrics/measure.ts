import { Kind, UnitOfTime } from '../util/types.js';
import { MetricBroadcaster } from './broadcaster.js';
import { isBigint, isHrTimeAvailable, isPromiseLike } from '../util/predicates.js';
import { convertRecordedTime } from '../util/transfomers.js';

type MeasureDecorator = <TThis, TArgs extends unknown[], Return>(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    target: Function,
    ctx: ClassMethodDecoratorContext<TThis, (this: TThis, ...args: TArgs) => Return>,
) => void;

/**
 * Measure is an Class Method Decorator as well as 'Metric' Decorator. The values recorded by this are consumable via the {@link MetricBroadcaster}.
 * It tracks how long an call to the decorated method is taking, the observed value is than transformed into the wanted unit of time.
 * If hrtime is available it will be leveraged to record the timings, in environments where it is not available timestamps via Date Object will be used.
 *
 * ```ts
 * import { Measure, UnitOfTime } from "@templum/decorators";
 *
 * class Measure {
 *      @Gauge('Backend', UnitOfTime.Second)
 *      public longRunningJob(): Promise<void> {
 *          ...
 *      }
 * }
 * ```
 *
 * @param label that will be used for broadcasting
 * @param unit in which the time should be broadcasted
 *
 */
export function Measure(label: string, unit: UnitOfTime): MeasureDecorator {
    return <TThis, TArgs extends unknown[], Return>(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
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
