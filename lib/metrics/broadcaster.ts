/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import EventEmitter from 'events';
import { Kind, Metric } from '../util/types.js';

/**
 * Following versions of the 'metric' event will be raised by the libary.
 * Please be aware that if you leverage different metric decorators you may
 * need to check the metric kind before consuming the value.
 */
export declare interface MetricBroadcaster {
    once(event: 'metric', listener: (metric: Metric<number> & { metric: Kind.Counter }) => void): this;
    once(event: 'metric', listener: (metric: Metric<number> & { metric: Kind.Timing }) => void): this;
    once(event: 'metric', listener: <T>(metric: Metric<T> & { metric: Kind }) => void): this;

    on(event: 'metric', listener: (metric: Metric<number> & { metric: Kind.Counter }) => void): this;
    on(event: 'metric', listener: (metric: Metric<number> & { metric: Kind.Timing }) => void): this;
    on(event: 'metric', listener: <T>(metric: Metric<T> & { metric: Kind }) => void): this;
}

/**
 * MetricBroadcaster is the central EventEmitter for this libary. It is a singleton that enables the consumption of metrics raised by
 * Metric related decorators. This way you can connect them to Prometheus or other destinations if wanted.
 *
 * ```ts
 * // Obtain instance
 * const broadcaster = MetricBroadcaster.getInstance();
 *
 * // Listen to broadcast once
 * broadcaster.once('metric', (metric) => {
 *      // Perform operations based on metric.kind
 *      ...
 * });
 *
 * // Listen to broadcast continous
 * broadcaster.on('metric', (metric) => {
 *      // Perform operations based on metric.kind
 *      ...
 * });
 * ```
 */
export class MetricBroadcaster extends EventEmitter {
    private static instance: MetricBroadcaster;
    private constructor() {
        super();
    }

    public static getInstance(): MetricBroadcaster {
        if (MetricBroadcaster.instance === undefined) {
            MetricBroadcaster.instance = new MetricBroadcaster();
        }

        return MetricBroadcaster.instance;
    }

    /**
     * This method should only called by the libary itself to broadcast observed metrics.
     * @param metric that was observed
     * @param value that was recorded
     */
    public broadcast<T>(metric: Kind, value: Metric<T>): void {
        this.emit('metric', { metric, ...value });
    }
}
