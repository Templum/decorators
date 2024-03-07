// eslint-disable-next-line @typescript-eslint/ban-types
export type MethodDecorator = (target: Function, ctx: ClassMethodDecoratorContext) => <Fn, Arg, Result>(self: Fn, ...args: Arg[]) => Result;

/**
 * The supported unit of times. Some decorators may exclude Nanosecond given
 * the nature of NodeJS/JavaScript
 */
export enum UnitOfTime {
    Nanosecond,
    Millisecond,
    Second,
    Minute,
}
