import { convertFrom, convertRecordedTime } from "../../lib/util/transfomers.js";
import { UnitOfTime } from "../../lib/util/types";

describe('Transformers', () => {

    describe('convertRecordedTime', () => {
        test('should convert bigint as Nanoseconds to target unit', async () => {
            const time = BigInt('1000000000');

            const converted = convertRecordedTime(time, UnitOfTime.Second);
            expect(converted).toEqual(1);
        });
        
        test('should return -1 if time is bigint and to large for integer', async () => {
            const time = BigInt('9007199254740992');

            const converted = convertRecordedTime(time, UnitOfTime.Millisecond);
            expect(converted).toEqual(-1);
        });

        test('should convert number as Milliseconds to target unit', async () => {
            const time = 60000;
            
            const converted = convertRecordedTime(time, UnitOfTime.Minute);
            expect(converted).toEqual(1);
        });
    });

    describe('convertFrom', () => {
        test('should return unchanged time if from and to are same unit', async () => {
            const time = 10;

            const converted = convertFrom(time, UnitOfTime.Minute, UnitOfTime.Minute);
            expect(converted).toEqual(time);
        });

        test.each([{
            to: UnitOfTime.Millisecond,
            toAsString: 'ms',
            time: 2500,
            expected: 0.003, // toFixed will round up here
        }, {
            to: UnitOfTime.Second,
            toAsString: 's',
            time: 2500000,
            expected: 0.003, // toFixed will round up here
        },{
            to: UnitOfTime.Minute,
            toAsString: 'm',
            time: 25000000000,
            expected: 0.417, // toFixed will round up here
        }, {
            to: UnitOfTime.Millisecond,
            toAsString: 'ms',
            time: 1000000,
            expected: 1,
        }, {
            to: UnitOfTime.Second,
            toAsString: 's',
            time: 1000000000,
            expected: 1,
        }, {
            to: UnitOfTime.Minute,
            toAsString: 'm',
            time: 60000000000,
            expected: 1,
        }])("should convert $time ns to $expected $toAsString", ({time, to, expected}) => {
            const converted = convertFrom(time, UnitOfTime.Nanosecond, to);
            expect(converted).toEqual(expected);
        });

        test.each([{
            to: UnitOfTime.Nanosecond,
            toAsString: 'ns',
            time: 1,
            expected: 1000000,
        }, {
            to: UnitOfTime.Second,
            toAsString: 's',
            time: 1000,
            expected: 1,
        }, {
            to: UnitOfTime.Minute,
            toAsString: 'm',
            time: 60000,
            expected: 1,
        }])("should convert $time ms to $expected $toAsString", ({time, to, expected}) => {
            const converted = convertFrom(time, UnitOfTime.Millisecond, to);
            expect(converted).toEqual(expected);
        });

        test.each([{
            to: UnitOfTime.Nanosecond,
            toAsString: 'ns',
            time: 1,
            expected: 1000000000,
        }, {
            to: UnitOfTime.Millisecond,
            toAsString: 's',
            time: 1,
            expected: 1000,
        }, {
            to: UnitOfTime.Minute,
            toAsString: 'm',
            time: 60,
            expected: 1,
        }])("should convert $time s to $expected $toAsString", ({time, to, expected}) => {
            const converted = convertFrom(time, UnitOfTime.Second, to);
            expect(converted).toEqual(expected);
        });

        test.each([{
            to: UnitOfTime.Nanosecond,
            toAsString: 'ns',
            time: 1,
            expected: 60000000000,
        }, {
            to: UnitOfTime.Millisecond,
            toAsString: 's',
            time: 1,
            expected: 60000,
        }, {
            to: UnitOfTime.Second,
            toAsString: 's',
            time: 1,
            expected: 60,
        }])("should convert $time m to $expected $toAsString", ({time, to, expected}) => {
            const converted = convertFrom(time, UnitOfTime.Minute, to);
            expect(converted).toEqual(expected);
        });

    });
});