import { CallCounter, Counter } from "../../lib/metrics/counter.js";
import { MetricBroadcaster } from "../../lib/metrics/broadcaster.js";
import { Metric } from "../../lib/util/types.js";

class CallTest {
    constructor(private spy: jest.Mock) {}

    @CallCounter('success')
    public willSucceed(addTwo: number): number {
        this.spy();
        return addTwo + 2;
    }

    @CallCounter('failure')
    public willFail(addThree: number): number {
        this.spy();
        throw new Error('failed');
    }
}

class CounterTest {
    constructor(private spy: jest.Mock) {}

    @Counter('sync')
    public syncCall(addTwo: number): number {
        this.spy();
        return addTwo + 2;
    }

    @Counter('async')
    public async asyncCall(addTwo: number): Promise<number> {
        await this.spy();
        return addTwo + 2;
    }
}

describe('CallCounter Decorator', () => {
    const broadcaster = MetricBroadcaster.getInstance();

    test('should increase counter for successful calls', async () => {
        const callRecorder = jest.fn();
        const target = new CallTest(callRecorder);

         const broadcasted = new Promise<Metric<number>>((resolve) => {
            broadcaster.once('metric', (metric) => {
                resolve(metric);
            });
        });

        const result = target.willSucceed(2);
        expect(result).toEqual(4);
        expect(callRecorder).toHaveBeenCalled();
        
        const metric = await broadcasted;
        expect(metric).toBeDefined()
        expect(metric.label).toEqual('success');
        expect(metric.value).toEqual(1);
    });

    test('should increase counter for failing calls', async () => {
        const callRecorder = jest.fn();
        const target = new CallTest(callRecorder);

        const broadcasted = new Promise<Metric<number>>((resolve) => {
            broadcaster.once('metric', (metric) => {
                resolve(metric);
            });
        });

        expect(() => target.willFail(2)).toThrow('failed');
        expect(callRecorder).toHaveBeenCalled();
        
        const metric = await broadcasted;
        expect(metric).toBeDefined()
        expect(metric.label).toEqual('failure');
        expect(metric.value).toEqual(1);
    });
});

describe('Counter Decorator', () => {
    const broadcaster = MetricBroadcaster.getInstance();

    describe('Sync', () => {
        test('should increase success counter for successfull calls', async () => {
            const callRecorder = jest.fn();
            const target = new CounterTest(callRecorder);

            const broadcasted = new Promise<Metric<number>>((resolve) => {
                broadcaster.once('metric', (metric) => {
                    resolve(metric);
                });
            });

            const result = target.syncCall(2);
            expect(result).toEqual(4);
            expect(callRecorder).toHaveBeenCalled();
            
            const metric = await broadcasted;
            expect(metric).toBeDefined()
            expect(metric.label).toEqual('sync_success');
            expect(metric.value).toEqual(1);
        });

        test('should increase failure counter for failed calls', async () => {
            const callRecorder = jest.fn(() => { throw new Error('Oops') });
            const target = new CounterTest(callRecorder);

            const broadcasted = new Promise<Metric<number>>((resolve) => {
                broadcaster.once('metric', (metric) => {
                    resolve(metric);
                });
            });

            expect(() => target.syncCall(2)).toThrow('Oops');
            expect(callRecorder).toHaveBeenCalled();
            
            const metric = await broadcasted;
            expect(metric).toBeDefined()
            expect(metric.label).toEqual('sync_failure');
            expect(metric.value).toEqual(1);
        });
    });

    describe('Async', () => {
        test('should increase success counter for successfull calls', async () => {
            const callRecorder = jest.fn();
            const target = new CounterTest(callRecorder);

            const broadcasted = new Promise<Metric<number>>((resolve) => {
                broadcaster.once('metric', (metric) => {
                    resolve(metric);
                });
            });

            const result = await target.asyncCall(2);
            expect(result).toEqual(4);
            expect(callRecorder).toHaveBeenCalled();
            
            const metric = await broadcasted;
            expect(metric).toBeDefined()
            expect(metric.label).toEqual('async_success');
            expect(metric.value).toEqual(1);
        });

        test('should increase failure counter for failed calls', async () => {
            const callRecorder = jest.fn();
            const target = new CounterTest(callRecorder);

            callRecorder.mockRejectedValueOnce(new Error('Oops'));

            const broadcasted = new Promise<Metric<number>>((resolve) => {
                broadcaster.once('metric', (metric) => {
                    resolve(metric);
                });
            });

            await expect(async () => await target.asyncCall(2)).rejects.toThrow('Oops');
            expect(callRecorder).toHaveBeenCalled();
            
            const metric = await broadcasted;
            expect(metric).toBeDefined()
            expect(metric.label).toEqual('async_failure');
            expect(metric.value).toEqual(1);
        });
    });
});