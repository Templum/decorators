import { Debounce } from "../../lib/execution/debounce.js";
import { UnitOfTime } from "../../lib/util/types.js";

class Test {
    constructor(private spy: jest.Mock) { }

    @Debounce(5, UnitOfTime.Millisecond)
    public increment(): void {
        this.spy();
    }
}

describe('Debounce Decorator', () => {
    test('should call through if not in debounce window', async () => {
        const callRecorder = jest.fn();
        const target = new Test(callRecorder);

        target.increment();
        expect(callRecorder).toHaveBeenCalledTimes(1);
    });

    test('should block additional calls while in debounce window', async () => {
        const callRecorder = jest.fn();
        const target = new Test(callRecorder);

        target.increment();
        target.increment();
        target.increment();
        target.increment();
        target.increment();

        expect(callRecorder).toHaveBeenCalledTimes(1);
    });

    test('should allow a call after debounce window passed', async () => {
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
