type OnceDecorator = <TThis, TArgs extends unknown[], Return extends void>(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    target: Function,
    ctx: ClassMethodDecoratorContext<TThis, (this: TThis, ...args: TArgs) => Return>,
) => void;

/**
 * Once is an Class Method Decorator, that is configured with the specified parameter.
 * It will ensure that the decorated method is only called once and based on the configuration
 * further calls will either be dropped or raise an error.
 *
 * ```ts
 * import { Once } from "@templum/decorators";
 *
 * class Example {
 *      @Once(true)
 *      public init(): Promise<void> {
 *          ...
 *      }
 * }
 * ```
 *
 * @param force if true will throw error, else will simply drop calls.
 *
 */
export function Once(force: boolean = false): OnceDecorator {
    return <TThis, TArgs extends unknown[], Return extends void>(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
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
