import { Once } from "../../lib/execution/once.js";

describe('Once Decorator', () => {
    test('should call original method once and drop further calls if force=false', async () => {
        class Test {
            constructor(private spy: jest.Mock) { }

            @Once()
            public init(): void {
                this.spy();
            }

        }

        const callRecorder = jest.fn();
        const target = new Test(callRecorder);

        target.init();
        target.init();

        expect(callRecorder).toHaveBeenCalledTimes(1);
    });

    test('should call original method once and raise error for further calls if force=true', async () => {
        class Test {
            constructor(private spy: jest.Mock) { }


            @Once(true)
            public init(): void {
                this.spy();
            }
        }

        const callRecorder = jest.fn();
        const target = new Test(callRecorder);

        target.init();
        expect(() => target.init()).toThrow(`init is only callable once and was already called`);
        expect(callRecorder).toHaveBeenCalledTimes(1);
    });
});