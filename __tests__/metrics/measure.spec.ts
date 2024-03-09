import { Measure } from "../../lib/metrics/measure";
import { MetricBroadcaster } from "../../lib/metrics/broadcaster";
import { Metric, UnitOfTime } from "../../lib/util/types";

class Test {
    constructor(private spy: jest.Mock) {}

    @Measure('sync', UnitOfTime.Nanosecond)
    public willSucceed(): number {
        this.spy();

        let sum = 0;
        for (let i = 0; i < 1000; i++) {
            sum += i * i;
        }

        return 1
    }

    @Measure('async', UnitOfTime.Second)
    public async willEventuallSucceed(): Promise<number> {
        this.spy();

        await new Promise((resolve) => setTimeout(resolve, 100));
    
        return 1
    }
}

describe('Measure Decorator', () => {
    const broadcaster = MetricBroadcaster.getInstance();

    describe('Sync Calls', () => {
        test('should record timing for succesfull calls', async () => {
            const callRecorder = jest.fn();
            const target = new Test(callRecorder);

            const broadcasted = new Promise<Metric<number>>((resolve) => {
                broadcaster.once('metric', (metric) => {
                    resolve(metric);
                });
            });

            const result = target.willSucceed();
            expect(result).toEqual(1)
            expect(callRecorder).toHaveBeenCalled();
            
            const metric = await broadcasted;
            expect(metric).toBeDefined()
            expect(metric.label).toEqual('sync');
            expect(metric.value).toBeGreaterThan(1);
        });

    });

    describe('Async Calls', () => {
        test('should record timing for succesfull calls', async () => {
            const callRecorder = jest.fn();
            const target = new Test(callRecorder);

            const broadcasted = new Promise<Metric<number>>((resolve) => {
                broadcaster.once('metric', (metric) => {
                    resolve(metric);
                });
            });

            const result = await target.willEventuallSucceed();
            expect(result).toEqual(1)
            expect(callRecorder).toHaveBeenCalled();
            
            const metric = await broadcasted;
            expect(metric).toBeDefined()
            expect(metric.label).toEqual('async');
            expect(metric.value).toBeGreaterThanOrEqual(0.1);
        });
    });
});