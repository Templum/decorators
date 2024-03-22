import { Gauge } from "../../lib/metrics/gauge.js";
import { MetricBroadcaster } from "../../lib/metrics/broadcaster.js";

describe('Gauge Decorator', () => {
    const broadcaster = MetricBroadcaster.getInstance();

    afterAll(() => {
        broadcaster.removeAllListeners('metric');
    });

    describe('Sync', () => {
        test('should record inflight calls that end in success', async () => {
            class Test {
                constructor(private spy: jest.Mock) { }
                @Gauge('success')
                public willSucceed(): number {
                    this.spy();

                    let sum = 0;
                    for (let i = 0; i < 100000; i++) {
                        sum += i * i;
                    }

                    return 1
                }
            }

            const callRecorder = jest.fn();
            const target = new Test(callRecorder);

            const history: number[] = [];
            broadcaster.on('metric', (metric) => {
                if (metric.label === 'success') {
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
            class Test {
                constructor(private spy: jest.Mock) { }
                @Gauge('failure')
                public willFail(): number {
                    this.spy();

                    let sum = 0;
                    for (let i = 0; i < 100000; i++) {
                        sum += i * i;
                    }

                    throw new Error('failed');
                }
            }

            const callRecorder = jest.fn();
            const target = new Test(callRecorder);

            const history: number[] = [];
            broadcaster.on('metric', (metric) => {
                if (metric.label === 'failure') {
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
            class Test {
                constructor(private spy: jest.Mock) { }
                @Gauge('success')
                public async willSucceed(): Promise<number> {
                    this.spy();
                    await new Promise((resolve) => setTimeout(resolve, 10));
                    return 1
                }
            }

            const callRecorder = jest.fn();
            const target = new Test(callRecorder);

            const history: number[] = [];
            broadcaster.on('metric', (metric) => {
                if (metric.label === 'success') {
                    history.push(metric.value);
                }
            });

            const result = await target.willSucceed();
            expect(result).toEqual(1);
            expect(callRecorder).toHaveBeenCalled();

            expect(history.length).toBeGreaterThanOrEqual(2);
            expect(history[0]).toBeGreaterThan(history[1]);
        });

        test('should record inflight calls that end in failure', async () => {
            class Test {
                constructor(private spy: jest.Mock) { }
                @Gauge('failure')
                public async willFail(): Promise<number> {
                    this.spy();
                    await new Promise((resolve) => setTimeout(resolve, 10));
                    throw new Error('failed');
                }
            }


            const callRecorder = jest.fn();
            const target = new Test(callRecorder);

            const history: number[] = [];
            broadcaster.on('metric', (metric) => {
                if (metric.label === 'failure') {
                    history.push(metric.value);
                }
            });

            await expect(async () => await target.willFail()).rejects.toThrow('failed');
            expect(callRecorder).toHaveBeenCalled();

            expect(history.length).toBeGreaterThanOrEqual(2);
            expect(history[0]).toBeGreaterThan(history[1]);
        });
    });
});