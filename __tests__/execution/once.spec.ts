import { Once } from "../../lib/execution/once";


class Test {
    constructor(private spy: jest.Mock){}

    @Once()
    public init(): void {
        this.spy();
    }

    @Once(true)
    public strictInit(): void {
        this.spy();
    }
}


describe('Once Decorator', () => {
    test('should call original method once and drop further calls if force=false', async () => {
        const callRecorder = jest.fn();
        const target = new Test(callRecorder);

        target.init();
        target.init();

        expect(callRecorder).toHaveBeenCalledTimes(1);
    });

    test('should call original method once and raise error for further calls if force=true', async () => {
        const callRecorder = jest.fn();
        const target = new Test(callRecorder);

        target.strictInit();
        expect(() => target.strictInit()).toThrow(`strictInit is only callable once and was already called`);
        expect(callRecorder).toHaveBeenCalledTimes(1); 
    });
});