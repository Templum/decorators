// eslint-disable-next-line @typescript-eslint/ban-types
export type MethodDecorator = (target: Function, ctx: ClassMethodDecoratorContext) => (this: unknown, ...args: unknown[]) => unknown;

/**
 * The supported time units relevant for operations that touch on timings
 */
export enum UnitOfTime {
    Nanosecond,
    Millisecond,
    Second,
    Minute,
}
