/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import EventEmitter from 'events';
import { Kind, Metric } from '../util/types.js';

/**
 * Decleration of the supported metrics
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
 * MetricBroadcaster allows you to listen to generated Metrics using the 'metric' event.
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

    public broadcast<T>(metric: Kind, value: Metric<T>): void {
        this.emit('metric', { metric, ...value });
    }
}
