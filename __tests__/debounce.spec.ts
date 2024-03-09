import { Debounce } from "../lib/execution/debounce.js";
import { UnitOfTime } from "../lib/util/types.js";

class Test {
    constructor(public counter: number = 0){}

    @Debounce(5, UnitOfTime.Millisecond)
    public increment(): void {
        this.counter += 1;
    }

    public setCounter(value: number): void {
        this.counter = value;
    }

    public getCounter(): number {
        return this.counter;
    }
}

describe('Debounce Decorator', () => {
    test('should call through if not in debounce window', async () => {
        const target = new Test();
        const before = target.getCounter();

        target.increment();

        expect(before).toEqual(0);
        expect(target.getCounter()).toEqual(1);    
    });

    test('should block additional calls while in debounce window', async () => {
        const target = new Test();
        const before = target.getCounter();

        target.increment();
        
        target.increment();
        target.increment();
        target.increment();
        target.increment();

        const delta = target.getCounter() - before;
        expect(before).toEqual(0);
        expect(delta).toEqual(1);
    });

    test('should allow a call after debounce window passed', async () => {
        const target = new Test();

        target.increment();
        target.increment();
        target.increment();

        const beforeWindow = target.getCounter();
        expect(beforeWindow).toEqual(1);
        await new Promise((resolve) => setTimeout(resolve, 10));

        target.increment();
        target.increment();
        target.increment();

        const afterWindow = target.getCounter();
        expect(afterWindow).toEqual(2);
    });
});
