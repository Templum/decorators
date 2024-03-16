import { Gauge } from "../../lib/metrics/gauge.js";
import { MetricBroadcaster } from "../../lib/metrics/broadcaster.js";
import { Metric } from "../../lib/util/types.js";
import { after } from "node:test";

class Test {
    constructor(private spy: jest.Mock) {}

    @Gauge('sync_succes')
    public willSucceed(): number {
        this.spy();

        let sum = 0;
        for (let i = 0; i < 100000; i++) {
            sum += i * i;
        }

        return 1
    }

    @Gauge('sync_failure')
    public willFail(): number {
        this.spy();

        let sum = 0;
        for (let i = 0; i < 100000; i++) {
            sum += i * i;
        }

        throw new Error('failed');
    }

    @Gauge('async_success')
    public async willEventuallySucceed(): Promise<number> {
        this.spy();
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 1
    }

    @Gauge('async_failure')
    public async willEventuallyFail(): Promise<number> {
        this.spy();
        await new Promise((resolve) => setTimeout(resolve, 10));
        throw new Error('failed');
    }
}

describe('Gauge Decorator', () => {
    const broadcaster = MetricBroadcaster.getInstance();

    after(() => {
        broadcaster.removeAllListeners('metric');
    });

    describe('Sync', () => {
        test('should record inflight calls that end in success', async () => {
            const callRecorder = jest.fn();
            const target = new Test(callRecorder);

            const history: number[] = [];
            broadcaster.on('metric', (metric) => {
                if (metric.label === 'sync_succes') {
                    history.push(metric.value);
                }
            });

            const result = target.willSucceed();
            expect(result).toEqual(1);
            expect(callRecorder).toHaveBeenCalled();

            expect(history.length).toBeGreaterThanOrEqual(2);
            expect(history[0]).toBeGreaterThan(history[1]);
        });

        test('should record inflight calls that end in failure', async () => {
            const callRecorder = jest.fn();
            const target = new Test(callRecorder);

            const history: number[] = [];
            broadcaster.on('metric', (metric) => {
                if (metric.label === 'sync_failure') {
                    history.push(metric.value);
                }
            });

            expect(() => target.willFail()).toThrow('failed');
            expect(callRecorder).toHaveBeenCalled();

            expect(history.length).toBeGreaterThanOrEqual(2);
            expect(history[0]).toBeGreaterThan(history[1]);
        });
    });

    describe('Async', () => {
        test('should record inflight calls that end in success', async () => {
            const callRecorder = jest.fn();
            const target = new Test(callRecorder);

            const history: number[] = [];
            broadcaster.on('metric', (metric) => {
                if (metric.label === 'async_success') {
                    history.push(metric.value);
                }
            });

            const result = await target.willEventuallySucceed();
            expect(result).toEqual(1);
            expect(callRecorder).toHaveBeenCalled();

            expect(history.length).toBeGreaterThanOrEqual(2);
            expect(history[0]).toBeGreaterThan(history[1]);
        });

        test('should record inflight calls that end in failure', async () => {
            const callRecorder = jest.fn();
            const target = new Test(callRecorder);

            const history: number[] = [];
            broadcaster.on('metric', (metric) => {
                if (metric.label === 'async_failure') {
                    history.push(metric.value);
                }
            });

            await expect(async () => await target.willEventuallyFail()).rejects.toThrow('failed');
            expect(callRecorder).toHaveBeenCalled();

            expect(history.length).toBeGreaterThanOrEqual(2);
            expect(history[0]).toBeGreaterThan(history[1]);
        });
    });
});