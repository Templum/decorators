import { isPromise } from 'node:util/types';
import { CACHE_KEY } from '../cache/cache.js';

export function isPromiseLike(obj: unknown): obj is Promise<unknown> {
    if (obj === null || obj === undefined) {
        return false;
    }

    if (isPromise(obj)) {
        return true;
    }

    if (typeof obj === 'object' && 'then' in obj && typeof obj?.then === 'function') {
        return true;
    }

    return false;
}

export function isBigint(num: unknown): num is bigint {
    return typeof num === 'bigint';
}

export function canBeNumber(num: bigint): boolean {
    if (num <= Number.MAX_SAFE_INTEGER) {
        return true;
    }

    return false;
}

export function isHrTimeAvailable(): boolean {
    if (process === null || process === undefined) {
        return false;
    }

    if (typeof process === 'object' && 'hrtime' in process && typeof process.hrtime === 'function') {
        return true;
    }

    return false;
}

export function isCacheKey(obj: unknown): obj is { [CACHE_KEY]: string } {
    if (obj !== null && obj !== undefined && typeof obj === 'object') {
        return CACHE_KEY in obj;
    }

    return false;
}
