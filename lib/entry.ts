// Decorator covering Execution
export { Debounce } from './execution/debounce.js';
export { Once } from './execution/once.js';
export { Retry, RetryStrategy } from './execution/retry.js';
export type { RetryConfig } from './execution/retry.js';
export { Throttle } from './execution/throttle.js';

// Decorator covering Metrics
export { Counter, CallCounter } from './metrics/counter.js';
export { Gauge } from './metrics/gauge.js';
export { Measure } from './metrics/measure.js';

export { MetricBroadcaster } from './metrics/broadcaster.js';
export { Kind, UnitOfTime } from './util/types.js';
export type { Metric } from './util/types.js';

// Decorator covering Caching
export { Cache, CacheKey } from './cache/cache.js';
export type { CacheConfig } from './cache/cache.js';
export type { InMemoryCache, ICache } from './cache/memory.js';
// IDEA: Metric Decorators: Histogram based on Prometheus [https://github.com/siimon/prom-client]
// IDEA: Circuit Breaker
// IDEA: Delay
// IDEA: Timeout
// IDEA: Fallback
