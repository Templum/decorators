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

/**
 * Different types of metrics that are available
 * via the metric broadcaster.
 */
export enum Kind {
    Counter,
    Timing,
    Histogram,
}

/**
 * Contains Metric name and the value which may differ based
 * on the metric kind.
 */
export type Metric<TValue> = {
    label: string;
    value: TValue;
};
