import * as mod from '../../lib/util/predicates.js';
import { Measure } from "../../lib/metrics/measure.js";
import { MetricBroadcaster } from "../../lib/metrics/broadcaster.js";
import { Metric, UnitOfTime } from "../../lib/util/types.js";

class Test {
    constructor(private spy: jest.Mock) {}

    @Measure('sync', UnitOfTime.Nanosecond)
    public willSucceed(): number {
        this.spy();

        let sum = 0;
        for (let i = 0; i < 100000; i++) {
            sum += i * i;
        }

        return 1
    }

    @Measure('sync', UnitOfTime.Nanosecond)
    public willFail(): number {
        this.spy();

        let sum = 0;
        for (let i = 0; i < 100000; i++) {
            sum += i * i;
        }

        throw new Error('failed');
    }

    @Measure('async', UnitOfTime.Second)
    public async willEventuallySucceed(): Promise<number> {
        this.spy();
        await new Promise((resolve) => setTimeout(resolve, 100));
        return 1
    }

    @Measure('async', UnitOfTime.Second)
    public async willEventuallyFail(): Promise<number> {
        this.spy();
        await new Promise((resolve) => setTimeout(resolve, 100));
        throw new Error('failed');
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

        test('should record timing for failing calls', async () => {
            const callRecorder = jest.fn();
            const target = new Test(callRecorder);

            const broadcasted = new Promise<Metric<number>>((resolve) => {
                broadcaster.once('metric', (metric) => {
                    resolve(metric);
                });
            });

            expect(() => target.willFail()).toThrow('failed');
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

            const result = await target.willEventuallySucceed();
            expect(result).toEqual(1)
            expect(callRecorder).toHaveBeenCalled();
            
            const metric = await broadcasted;
            expect(metric).toBeDefined()
            expect(metric.label).toEqual('async');
            expect(metric.value).toBeGreaterThanOrEqual(0.1);
        });
        
        test('should record timing for failing calls', async () => {
            const callRecorder = jest.fn();
            const target = new Test(callRecorder);

            const broadcasted = new Promise<Metric<number>>((resolve) => {
                broadcaster.once('metric', (metric) => {
                    resolve(metric);
                });
            });

            await expect(async () => target.willEventuallyFail()).rejects.toThrow('failed')
            expect(callRecorder).toHaveBeenCalled();
            
            const metric = await broadcasted;
            expect(metric).toBeDefined()
            expect(metric.label).toEqual('async');
            expect(metric.value).toBeGreaterThanOrEqual(0.1);
        });
    });

    describe('hrtime vs date', () => {
        let hrSwitchMock: jest.SpyInstance<boolean, [], any>;

        beforeEach(() => {
            hrSwitchMock = jest.spyOn(mod, 'isHrTimeAvailable');
        });

        afterEach(() => {
            hrSwitchMock.mockRestore();
        });

        test('should use hrtime if available', async () => {
            const callRecorder = jest.fn();
            hrSwitchMock.mockReturnValue(true);
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
            expect(hrSwitchMock).toHaveBeenCalled();
        });

        test('should use Date.now if hrtime is not available', async () =>  {
            const callRecorder = jest.fn();
            hrSwitchMock.mockReturnValue(false);
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
            expect(metric.value).toBeGreaterThanOrEqual(0);
            expect(hrSwitchMock).toHaveBeenCalled();
        });
    });
});