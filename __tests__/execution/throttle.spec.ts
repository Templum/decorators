import { Throttle } from "../../lib/execution/throttle.js";
import { UnitOfTime } from "../../lib/util/types.js";

class Test {
    constructor(private spy: jest.Mock) { }

    @Throttle(5, UnitOfTime.Millisecond)
    public increment(): void {
        this.spy();
    }
}

describe('Throttle Decorator', () => {
    test('should directly call through if not in throttle window', async () => {
        const callRecorder = jest.fn();
        const target = new Test(callRecorder);

        target.increment();
        expect(callRecorder).toHaveBeenCalledTimes(1);
    });

    test('should block additional calls while in throttle window', async () => {
        const callRecorder = jest.fn();
        const target = new Test(callRecorder);

        target.increment();
        target.increment();
        target.increment();
        target.increment();
        target.increment();

        expect(callRecorder).toHaveBeenCalledTimes(1);
    });

    test('should allow a call after throttle window passed', async () => {
        const callRecorder = jest.fn();
        const target = new Test(callRecorder)

        target.increment();
        target.increment();
        target.increment();

        expect(callRecorder).toHaveBeenCalledTimes(1);
        await new Promise((resolve) => setTimeout(resolve, 10));

        target.increment();
        target.increment();
        target.increment();

        expect(callRecorder).toHaveBeenCalledTimes(2);
    });
});
