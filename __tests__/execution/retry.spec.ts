import { Retry, RetryStrategy } from "../../lib/execution/retry.js";
import { UnitOfTime } from "../../lib/util/types.js";

describe('Retry Decorator', () => {
    describe('Sync', () => {
        test('should just return the result if call does not fail', async () => {
            class Test {
                constructor(private spy: jest.Mock) { }

                @Retry(error => error instanceof Error)
                public callThatCanFail(): number {
                    this.spy();
                    return 1
                }
            }

            const callRecorder = jest.fn();
            const target = new Test(callRecorder);

            const result = target.callThatCanFail();
            expect(result).toEqual(1);
            expect(callRecorder).toHaveBeenCalledTimes(1);
        });

        test('should return result if retry was succesful', async () => {
            class Test {
                constructor(private spy: jest.Mock) { }

                @Retry(error => error instanceof Error)
                public callThatCanFail(): number {
                    this.spy();
                    return 1
                }
            }

            const callRecorder = jest.fn();
            callRecorder.mockImplementationOnce(() => { throw new Error('Oops'); })

            const target = new Test(callRecorder);

            const result = target.callThatCanFail();
            expect(result).toEqual(1);
            expect(callRecorder).toHaveBeenCalledTimes(2);
        });

        test('should return final error if all retries failed', async () => {
            class Test {
                constructor(private spy: jest.Mock) { }

                @Retry(error => error instanceof Error)
                public callThatCanFail(): number {
                    this.spy();
                    return 1
                }
            }

            const callRecorder = jest.fn();
            callRecorder.mockImplementation(() => { throw new Error('Oops'); });
            const target = new Test(callRecorder);

            expect(() => target.callThatCanFail()).toThrow('Oops');
            expect(callRecorder).toHaveBeenCalledTimes(1 + 3);
        });

        test('should ignore retry strategie as well as timeout', async () => {
            class Test {
                constructor(private spy: jest.Mock) { }

                @Retry(error => error instanceof Error, { delay: 1, unit: UnitOfTime.Second, strategy: RetryStrategy.Delay })
                public callThatCanFail(): number {
                    this.spy();
                    return 1
                }
            }

            const callRecorder = jest.fn();
            callRecorder.mockImplementation(() => { throw new Error('Oops'); });
            const target = new Test(callRecorder);

            const start = Date.now();
            expect(() => target.callThatCanFail()).toThrow('Oops');
            expect(callRecorder).toHaveBeenCalledTimes(1 + 3);
            expect(Date.now() - start).toBeLessThan(3 * 1000);
        });
    });

    describe('Async', () => {
        test('should just return the result if call does not fail', async () => {
            class Test {
                constructor(private spy: jest.Mock) { }

                @Retry(error => error instanceof Error)
                public async callThatCanFail(): Promise<number> {
                    await this.spy();
                    return 1
                }
            }

            const callRecorder = jest.fn();
            const target = new Test(callRecorder);

            const result = await target.callThatCanFail();
            expect(result).toEqual(1);
            expect(callRecorder).toHaveBeenCalledTimes(1);
        });

        test('should return result if retry was succesful', async () => {
            class Test {
                constructor(private spy: jest.Mock) { }

                @Retry(error => error instanceof Error, { delay: 5, unit: UnitOfTime.Millisecond })
                public async callThatCanFail(): Promise<number> {
                    await this.spy();
                    return 1
                }
            }

            const callRecorder = jest.fn();
            callRecorder.mockRejectedValueOnce(new Error('Oops'))
            const target = new Test(callRecorder);

            const result = await target.callThatCanFail();
            expect(result).toEqual(1);
            expect(callRecorder).toHaveBeenCalledTimes(2);
        });

        test('should return final error if all retries failed', async () => {
            class Test {
                constructor(private spy: jest.Mock) { }

                @Retry(error => error instanceof Error, { delay: 5, unit: UnitOfTime.Millisecond })
                public async callThatCanFail(): Promise<number> {
                    await this.spy();
                    return 1
                }
            }

            const callRecorder = jest.fn();
            callRecorder.mockRejectedValue(new Error('Oops'))
            const target = new Test(callRecorder);

            await expect(async () => await target.callThatCanFail()).rejects.toThrow('Oops');
            expect(callRecorder).toHaveBeenCalledTimes(1 + 3);
        });

        test('should wait with exponential increasing delay', async () => {
            class Test {
                constructor(private spy: jest.Mock) { }

                @Retry(error => error instanceof Error, { delay: 5, unit: UnitOfTime.Millisecond, strategy: RetryStrategy.Exponential })
                public async callThatCanFail(): Promise<number> {
                    await this.spy();
                    return 1
                }
            }

            const callRecorder = jest.fn();
            callRecorder.mockRejectedValue(new Error('Oops'))
            const target = new Test(callRecorder);


            const start = Date.now();
            await expect(async () => await target.callThatCanFail()).rejects.toThrow('Oops');
            expect(callRecorder).toHaveBeenCalledTimes(1 + 3);
            expect(Date.now() - start).toBeGreaterThanOrEqual(3 * 5);
        });

        test('should wait with consistent delays', async () => {
            class Test {
                constructor(private spy: jest.Mock) { }

                @Retry(error => error instanceof Error, { delay: 5, unit: UnitOfTime.Millisecond, strategy: RetryStrategy.Delay })
                public async callThatCanFail(): Promise<number> {
                    await this.spy();
                    return 1
                }
            }

            const callRecorder = jest.fn();
            callRecorder.mockRejectedValue(new Error('Oops'))
            const target = new Test(callRecorder);

            const start = Date.now();
            await expect(async () => await target.callThatCanFail()).rejects.toThrow('Oops');
            expect(callRecorder).toHaveBeenCalledTimes(1 + 3);
            expect(Date.now() - start).toBeLessThanOrEqual(3 * 5);
        });
    });
});




