type OnceDecorator = <TThis, TArgs extends unknown[], Return extends void>(
    // eslint-disable-next-line @typescript-eslint/ban-types
    target: Function,
    ctx: ClassMethodDecoratorContext<TThis, (this: TThis, ...args: TArgs) => Return>,
) => void;

/**
 * A Method Decorator that ensures a method may only be executed once.
 * @param force if true will throw error, else will simply drop calls.
 */
export function Once(force: boolean = false): OnceDecorator {
    return <TThis, TArgs extends unknown[], Return extends void>(
        // eslint-disable-next-line @typescript-eslint/ban-types
        target: Function,
        ctx: ClassMethodDecoratorContext<TThis, (this: TThis, ...args: TArgs) => Return>,
    ) => {
        let firstCall = false;

        return function (this: TThis, ...args: unknown[]): void {
            if (!firstCall) {
                firstCall = true;
                return target.call(this, ...args) as Return;
            }

            if (force) {
                throw new Error(`${ctx.name.toString()} is only callable once and was already called`);
            }
        };
    };
}
