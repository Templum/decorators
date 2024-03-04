// eslint-disable-next-line @typescript-eslint/ban-types
export type MethodDecorator = (target: Function, ctx: ClassMethodDecoratorContext) => (this: unknown, ...args: unknown[]) => unknown;

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
