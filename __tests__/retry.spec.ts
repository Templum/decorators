import { Retry, RetryStrategy } from "../lib/execution/retry.js";
import { UnitOfTime } from "../lib/util/types.js";

const ERROR_MESSAGE = 'Failed';

class Test {
    constructor(private spy: jest.Mock, private failed = 0){}

    @Retry(error => error instanceof Error)
    public callThatCanFail(shouldFail: boolean, onlyOnce = false): number {
        this.spy();

        if(shouldFail && !onlyOnce) {
            throw new Error(ERROR_MESSAGE);
        }

        if (onlyOnce && this.failed === 0){
            this.failed += 1;
            throw new Error(ERROR_MESSAGE);
        }

        return 1
    }

    @Retry(error => error instanceof Error, {strategy: RetryStrategy.Delay, delay: 5, unit: UnitOfTime.Millisecond})
    public async callAsyncThatCanFail(shouldFail: boolean, onlyOnce = false): Promise<number> {
        this.spy();

        if(shouldFail && !onlyOnce) {
            throw new Error(ERROR_MESSAGE);
        }

        if (onlyOnce && this.failed === 0){
            this.failed += 1;
            throw new Error(ERROR_MESSAGE);
        }

        await new Promise((resolve) => setTimeout(resolve, 5));

        return 1
    }

    @Retry(error => error instanceof Error, {strategy: RetryStrategy.Exponential, delay: 2, unit: UnitOfTime.Millisecond})
    public callPromiseThatCanFail(shouldFail: boolean, onlyOnce = false): Promise<number> {
        this.spy();

        if(shouldFail && !onlyOnce) {
            return Promise.reject(new Error(ERROR_MESSAGE));
        }

        if (onlyOnce && this.failed === 0){
            this.failed += 1;
            return Promise.reject(new Error(ERROR_MESSAGE));
        }

        return Promise.resolve(1)
    }
}

describe('Retry Decorator', () => {
    describe('Sync Method', () => {
        test('should just return the result if call does not fail', async () => {
            const callRecorder = jest.fn();
            const target = new Test(callRecorder);

            const result = target.callThatCanFail(false);
            expect(result).toEqual(1);
            expect(callRecorder).toHaveBeenCalledTimes(1);
        });

        test('should return result if retry was succesful', async () => {
            const callRecorder = jest.fn();
            const target = new Test(callRecorder);

            const result = target.callThatCanFail(true, true);
            expect(result).toEqual(1);
            expect(callRecorder).toHaveBeenCalledTimes(2);
        });

        test('should return final error if all retries failed', async () => {
            const callRecorder = jest.fn();
            const target = new Test(callRecorder);

            expect(() => target.callThatCanFail(true)).toThrow(ERROR_MESSAGE);
            expect(callRecorder).toHaveBeenCalledTimes(1 + 3);
        });
    });

    describe('Async Method', () => {
        test('should just return the result if call does not fail', async () => {
            const callRecorder = jest.fn();
            const target = new Test(callRecorder);

            const result = await target.callAsyncThatCanFail(false);
            expect(result).toEqual(1);
            expect(callRecorder).toHaveBeenCalledTimes(1);
        });

        test('should return result if retry was succesful', async () => {
            const callRecorder = jest.fn();
            const target = new Test(callRecorder);

            const result = await target.callAsyncThatCanFail(true, true);
            expect(result).toEqual(1);
            expect(callRecorder).toHaveBeenCalledTimes(2);
        });

        test('should return final error if all retries failed', async () => {
            const callRecorder = jest.fn();
            const target = new Test(callRecorder);

            await expect(async () => await target.callAsyncThatCanFail(true)).rejects.toThrow(ERROR_MESSAGE);
            expect(callRecorder).toHaveBeenCalledTimes(1 + 3);
        });
    });

    describe('Promise Method', () => {
        test('should just return the result if call does not fail', async () => {
            const callRecorder = jest.fn();
            const target = new Test(callRecorder);

            const result = await target.callPromiseThatCanFail(false);
            expect(result).toEqual(1);
            expect(callRecorder).toHaveBeenCalledTimes(1);
        });

        test('should return result if retry was succesful', async () => {
            const callRecorder = jest.fn();
            const target = new Test(callRecorder);

            const result = await target.callPromiseThatCanFail(true, true);
            expect(result).toEqual(1);
            expect(callRecorder).toHaveBeenCalledTimes(2);
        });

        test('should return final error if all retries failed', async () => {
            const callRecorder = jest.fn();
            const target = new Test(callRecorder);

            await expect(async () => await target.callPromiseThatCanFail(true)).rejects.toThrow(ERROR_MESSAGE);
            expect(callRecorder).toHaveBeenCalledTimes(1 + 3);
        });
    });

});




