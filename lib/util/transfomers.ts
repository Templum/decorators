import { UnitOfTime } from '../measure/time';
import { canBeNumber, isBigint } from './predicates';

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

export function convertTime(time: bigint | number, to: UnitOfTime): number {
    if (isBigint(time)) {
        if (canBeNumber(time)) {
            return Math.floor(Number(time) / getFactor(to));
        }

        // API won't support bigint
        return -1;
    }

    return Math.floor(time / getFactor(to));
}
