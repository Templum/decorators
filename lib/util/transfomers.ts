import { canBeNumber, isBigint } from './predicates';
import { UnitOfTime } from './types';

const NS_PER_NS = 1 as const;
const NS_PER_SEC = 1e9 as const;
const NS_PER_MS = 1e6 as const;
const NS_PER_MIN = 6e10 as const;

function getFactor(targetUnit: UnitOfTime): typeof NS_PER_NS | typeof NS_PER_SEC | typeof NS_PER_MS | typeof NS_PER_MIN {
    switch (targetUnit) {
        case UnitOfTime.Nanosecond:
            return NS_PER_NS;
        case UnitOfTime.Millisecond:
            return NS_PER_MS;
        case UnitOfTime.Second:
            return NS_PER_SEC;
        case UnitOfTime.Minute:
            return NS_PER_MIN;
    }
}

/**
 * Converts the received time based on it's unit of time to the target unit of time. It does not support time differences
 * that are solarge they are no longer a safe integer.
 * @param time either captured via hrtim as bigint with nanosecond resolution or Date.now with millisecond resolution
 * @param to target unit
 * @returns converted time in target unit. If value of time is above safe integer it will return -1
 */
export function convertRecordedTime(time: bigint | number, to: UnitOfTime): number {
    if (isBigint(time)) {
        if (canBeNumber(time)) {
            return convertFrom(Number(time), UnitOfTime.Nanosecond, to);
        }

        // API won't support bigint
        return -1;
    }

    return convertFrom(time, UnitOfTime.Millisecond, to);
}

/**
 * Converts the provided time unit to target time unit.
 * @param time value
 * @param from unit
 * @param to unit
 * @returns convert unit
 */
export function convertFrom(time: number, from: UnitOfTime, to: UnitOfTime): number {
    if (from === to) {
        return time;
    }

    const timeInNs = from == UnitOfTime.Nanosecond ? time : time * getFactor(from);
    return Math.floor(timeInNs / getFactor(to));
}
