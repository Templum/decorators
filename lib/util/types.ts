// eslint-disable-next-line @typescript-eslint/ban-types
export type MethodDecorator = (target: Function, ctx: ClassMethodDecoratorContext) => (this: unknown, ...args: unknown[]) => unknown;
