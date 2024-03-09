import { Counter } from "../../lib/metrics/counter";
import { MetricBroadcaster } from "../../lib/metrics/broadcaster";
import { Metric } from "../../lib/util/types";

class Test {
    constructor(private spy: jest.Mock) {}

    @Counter('success')
    public willSucceed(addTwo: number): number {
        this.spy();
        return addTwo + 2;
    }

    @Counter('failure')
    public willFail(addThree: number): number {
        this.spy();
        throw new Error('failed');
    }
}

describe('Counter Decorator', () => {

    const broadcaster = MetricBroadcaster.getInstance();

    test('should increase counter for successful calls', async () => {
        const callRecorder = jest.fn();
        const target = new Test(callRecorder);

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
        const target = new Test(callRecorder);

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