import { canBeNumber, isBigint, isPromiseLike } from "../../lib/util/predicates.js";



describe('Predicates', () => {

    describe('isPromiseLike', () => {

        test.each([{
            name: 'Native Promise',
            input: Promise.resolve(),
            expected: true
        }, {
            name: 'Promise Like',
            input: { then: () => {}},
            expected: true
        }, {
            name: 'Error',
            input: new Error(''),
            expected: false
        }, {
            name: 'Undefined',
            input: undefined,
            expected: false
        }, {
            name: 'Null',
            input: null,
            expected: false
        }, {
            name: 'String',
            input: '',
            expected: false
        }])("$name isPromiseLike should return $expected", ({input, expected}) => {
            const received = isPromiseLike(input);
            expect(received).toEqual(expected);
        });
    });

    describe('isBigint', () => {
        test.each([{
            name: 'Bigint',
            input: BigInt('1000'),
            expected: true
        }, {
            name: 'Number',
            input: 123,
            expected: false
        }, {
            name: 'Obj',
            input: {},
            expected: false
        }, {
            name: 'Undefined',
            input: undefined,
            expected: false
        }, {
            name: 'Null',
            input: null,
            expected: false
        }, {
            name: 'String',
            input: '',
            expected: false
        }])("$name isBigint should return $expected", ({input, expected}) => {
            const received = isBigint(input);
            expect(received).toEqual(expected);
        });
    });

    describe('canBeNumber', () => {
        test('should return true if bigint is safe integer', () => {
            const output = canBeNumber(BigInt(100));
            expect(output).toBeTruthy();
        });

        test(('should return false if bigint is above safe integer'), () => {
            const output = canBeNumber(BigInt('9007199254740992'));
            expect(output).toBeFalsy();
        });
    });

});