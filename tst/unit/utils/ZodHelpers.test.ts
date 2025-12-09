import { describe, it } from 'node:test'
import assert from 'node:assert'
import { z } from 'zod'
import { ZodHelpers } from '../../../src/proxy/utils/ZodHelpers.ts'

describe('ZodHelpers', () => {
    describe('scanObject - Basic Types', () => {
        it('should handle string type', () => {
            const schema = ZodHelpers.scanObject({
                type: 'string',
                description: 'A string field',
            })
            assert.ok(schema instanceof z.ZodString)
            assert.strictEqual(schema.parse('hello'), 'hello')
            assert.throws(() => schema.parse(123))
        })

        it('should handle string enum type', () => {
            const schema = ZodHelpers.scanObject({
                type: 'string',
                description: 'Status field',
                enum: ['active', 'inactive', 'pending'],
            })
            assert.strictEqual(schema.parse('active'), 'active')
            assert.throws(() => schema.parse('invalid'))
        })

        it('should handle number type', () => {
            const schema = ZodHelpers.scanObject({
                type: 'number',
                description: 'A number field',
            })
            assert.ok(schema instanceof z.ZodNumber)
            assert.strictEqual(schema.parse(42), 42)
            assert.strictEqual(schema.parse(3.14), 3.14)
            assert.throws(() => schema.parse('42'))
        })

        it('should handle integer type', () => {
            const schema = ZodHelpers.scanObject({
                type: 'integer',
                description: 'An integer field',
            })
            assert.ok(schema instanceof z.ZodNumber)
            assert.strictEqual(schema.parse(42), 42)
            assert.throws(() => schema.parse(3.14))
            assert.throws(() => schema.parse('42'))
        })

        it('should handle boolean type', () => {
            const schema = ZodHelpers.scanObject({
                type: 'boolean',
                description: 'A boolean field',
            })
            assert.ok(schema instanceof z.ZodBoolean)
            assert.strictEqual(schema.parse(true), true)
            assert.strictEqual(schema.parse(false), false)
            assert.throws(() => schema.parse('true'))
        })

        it('should handle object type', () => {
            const schema = ZodHelpers.scanObject({
                type: 'object',
                description: 'An object',
                properties: {
                    name: { type: 'string', description: 'Name' },
                    age: { type: 'integer', description: 'Age' },
                },
            })
            assert.ok(schema instanceof z.ZodObject)
            const result = schema.parse({ name: 'John', age: 30 })
            assert.deepStrictEqual(result, { name: 'John', age: 30 })
            assert.throws(() => schema.parse({ name: 'John', age: 30.5 }))
        })

        it('should handle unknown type', () => {
            const schema = ZodHelpers.scanObject({
                type: 'unknown-type',
                description: 'Unknown field',
            })
            assert.ok(schema instanceof z.ZodUnknown)
            assert.strictEqual(schema.parse('anything'), 'anything')
            assert.strictEqual(schema.parse(123), 123)
            assert.deepStrictEqual(schema.parse({ foo: 'bar' }), { foo: 'bar' })
        })
    })

    describe('scanObject - Array Types', () => {
        it('should handle array of strings', () => {
            const schema = ZodHelpers.scanObject({
                type: 'array',
                description: 'String array',
                items: { type: 'string', description: 'Item' },
            })
            assert.ok(schema instanceof z.ZodArray)
            assert.deepStrictEqual(schema.parse(['a', 'b', 'c']), [
                'a',
                'b',
                'c',
            ])
            assert.throws(() => schema.parse(['a', 123]))
        })

        it('should handle array of numbers', () => {
            const schema = ZodHelpers.scanObject({
                type: 'array',
                description: 'Number array',
                items: { type: 'number', description: 'Item' },
            })
            assert.deepStrictEqual(schema.parse([1, 2, 3]), [1, 2, 3])
            assert.throws(() => schema.parse([1, 'two']))
        })

        it('should handle array of objects', () => {
            const schema = ZodHelpers.scanObject({
                type: 'array',
                description: 'Object array',
                items: {
                    type: 'object',
                    description: 'Item',
                    properties: {
                        id: { type: 'integer', description: 'ID' },
                        name: { type: 'string', description: 'Name' },
                    },
                },
            })
            const data = [
                { id: 1, name: 'Alice' },
                { id: 2, name: 'Bob' },
            ]
            assert.deepStrictEqual(schema.parse(data), data)
            assert.throws(() => schema.parse([{ id: 1.5, name: 'Alice' }]))
        })

        it('should handle array without items (unknown)', () => {
            const schema = ZodHelpers.scanObject({
                type: 'array',
                description: 'Any array',
            })
            assert.deepStrictEqual(schema.parse([1, 'two', { three: 3 }]), [
                1,
                'two',
                { three: 3 },
            ])
        })

        it('should handle array with minItems constraint', () => {
            const schema = ZodHelpers.scanObject({
                type: 'array',
                description: 'Array with min items',
                items: { type: 'string', description: 'Item' },
                minItems: 2,
            })
            assert.deepStrictEqual(schema.parse(['a', 'b']), ['a', 'b'])
            assert.deepStrictEqual(schema.parse(['a', 'b', 'c']), [
                'a',
                'b',
                'c',
            ])
            assert.throws(() => schema.parse(['a']))
        })

        it('should handle array with maxItems constraint', () => {
            const schema = ZodHelpers.scanObject({
                type: 'array',
                description: 'Array with max items',
                items: { type: 'string', description: 'Item' },
                maxItems: 3,
            })
            assert.deepStrictEqual(schema.parse(['a']), ['a'])
            assert.deepStrictEqual(schema.parse(['a', 'b', 'c']), [
                'a',
                'b',
                'c',
            ])
            assert.throws(() => schema.parse(['a', 'b', 'c', 'd']))
        })

        it('should handle array with both min and max constraints', () => {
            const schema = ZodHelpers.scanObject({
                type: 'array',
                description: 'Array with range',
                items: { type: 'number', description: 'Item' },
                minItems: 2,
                maxItems: 4,
            })
            assert.deepStrictEqual(schema.parse([1, 2]), [1, 2])
            assert.deepStrictEqual(schema.parse([1, 2, 3, 4]), [1, 2, 3, 4])
            assert.throws(() => schema.parse([1]))
            assert.throws(() => schema.parse([1, 2, 3, 4, 5]))
        })

        it('should handle nested arrays', () => {
            const schema = ZodHelpers.scanObject({
                type: 'array',
                description: 'Matrix',
                items: {
                    type: 'array',
                    description: 'Row',
                    items: { type: 'number', description: 'Cell' },
                },
            })
            assert.deepStrictEqual(
                schema.parse([
                    [1, 2, 3],
                    [4, 5, 6],
                ]),
                [
                    [1, 2, 3],
                    [4, 5, 6],
                ],
            )
        })
    })

    describe('scanObject - Tuple Types', () => {
        it('should handle simple tuple', () => {
            const schema = ZodHelpers.scanObject({
                type: 'array',
                description: 'Coordinate tuple',
                prefixItems: [
                    { type: 'number', description: 'X' },
                    { type: 'number', description: 'Y' },
                ],
            })
            assert.ok(schema instanceof z.ZodTuple)
            assert.deepStrictEqual(schema.parse([10, 20]), [10, 20])
            assert.throws(() => schema.parse([10]))
            assert.throws(() => schema.parse([10, 20, 30]))
        })

        it('should handle mixed-type tuple', () => {
            const schema = ZodHelpers.scanObject({
                type: 'array',
                description: 'Person tuple',
                prefixItems: [
                    { type: 'string', description: 'Name' },
                    { type: 'integer', description: 'Age' },
                    { type: 'boolean', description: 'Active' },
                ],
            })
            assert.deepStrictEqual(schema.parse(['Alice', 30, true]), [
                'Alice',
                30,
                true,
            ])
            assert.throws(() => schema.parse(['Alice', 30.5, true]))
            assert.throws(() => schema.parse(['Alice', 30, 'true']))
        })

        it('should handle tuple with object elements', () => {
            const schema = ZodHelpers.scanObject({
                type: 'array',
                description: 'Tuple with objects',
                prefixItems: [
                    { type: 'string', description: 'ID' },
                    {
                        type: 'object',
                        description: 'Data',
                        properties: {
                            value: { type: 'number', description: 'Value' },
                        },
                    },
                ],
            })
            assert.deepStrictEqual(schema.parse(['id123', { value: 42 }]), [
                'id123',
                { value: 42 },
            ])
        })
    })

    describe('inferZodRawShapeFromSpec', () => {
        it('should handle basic spec with required fields', () => {
            const spec = {
                name: JSON.parse(
                    JSON.stringify({ type: 'string', description: 'Name' }),
                ),
                age: JSON.parse(
                    JSON.stringify({ type: 'integer', description: 'Age' }),
                ),
            }
            const shape = ZodHelpers.inferZodRawShapeFromSpec(spec, [
                'name',
                'age',
            ])

            assert.ok(shape.name)
            assert.ok(shape.age)

            const objectSchema = z.object(shape)
            assert.deepStrictEqual(
                objectSchema.parse({ name: 'John', age: 30 }),
                { name: 'John', age: 30 },
            )
        })

        it('should handle spec with optional fields', () => {
            const spec = {
                name: JSON.parse(
                    JSON.stringify({ type: 'string', description: 'Name' }),
                ),
                email: JSON.parse(
                    JSON.stringify({ type: 'string', description: 'Email' }),
                ),
            }
            const shape = ZodHelpers.inferZodRawShapeFromSpec(spec, ['name'])

            const objectSchema = z.object(shape)
            // name is required, email is optional
            assert.deepStrictEqual(objectSchema.parse({ name: 'John' }), {
                name: 'John',
            })
            assert.deepStrictEqual(
                objectSchema.parse({ name: 'John', email: 'john@example.com' }),
                { name: 'John', email: 'john@example.com' },
            )
        })

        it('should handle spec with arrays', () => {
            const spec = {
                tags: JSON.parse(
                    JSON.stringify({
                        type: 'array',
                        description: 'Tags',
                        items: { type: 'string', description: 'Tag' },
                    }),
                ),
            }
            const shape = ZodHelpers.inferZodRawShapeFromSpec(spec, ['tags'])

            const objectSchema = z.object(shape)
            assert.deepStrictEqual(
                objectSchema.parse({ tags: ['tag1', 'tag2'] }),
                { tags: ['tag1', 'tag2'] },
            )
        })

        it('should handle complex nested spec', () => {
            const spec = {
                user: JSON.parse(
                    JSON.stringify({
                        type: 'object',
                        description: 'User',
                        properties: {
                            id: { type: 'integer', description: 'ID' },
                            profile: {
                                type: 'object',
                                description: 'Profile',
                                properties: {
                                    name: {
                                        type: 'string',
                                        description: 'Name',
                                    },
                                    scores: {
                                        type: 'array',
                                        description: 'Scores',
                                        items: {
                                            type: 'number',
                                            description: 'Score',
                                        },
                                    },
                                },
                            },
                        },
                    }),
                ),
            }
            const shape = ZodHelpers.inferZodRawShapeFromSpec(spec, ['user'])

            const objectSchema = z.object(shape)
            const data = {
                user: {
                    id: 1,
                    profile: {
                        name: 'Alice',
                        scores: [95.5, 87.3, 92.1],
                    },
                },
            }
            assert.deepStrictEqual(objectSchema.parse(data), data)
        })
    })

    describe('Edge Cases', () => {
        it('should handle empty object', () => {
            const schema = ZodHelpers.scanObject({
                type: 'object',
                description: 'Empty object',
                properties: {},
            })
            assert.deepStrictEqual(schema.parse({}), {})
        })

        it('should handle empty array', () => {
            const schema = ZodHelpers.scanObject({
                type: 'array',
                description: 'Empty array',
                items: { type: 'string', description: 'Item' },
            })
            assert.deepStrictEqual(schema.parse([]), [])
        })

        it('should preserve descriptions', () => {
            const schema = ZodHelpers.scanObject({
                type: 'string',
                description: 'Test description',
            })
            assert.strictEqual(schema.description, 'Test description')
        })

        it('should handle missing description gracefully', () => {
            const schema = ZodHelpers.scanObject({
                type: 'array',
                description: '',
                items: { type: 'string', description: '' },
            })
            assert.deepStrictEqual(schema.parse(['test']), ['test'])
        })
    })

    describe('scanObject - Union Types', () => {
        it('should handle anyOf with simple types', () => {
            const schema = ZodHelpers.scanObject({
                type: 'string', // type is ignored when anyOf is present
                description: 'String or number',
                anyOf: [
                    { type: 'string', description: 'String option' },
                    { type: 'number', description: 'Number option' },
                ],
            })
            assert.ok(schema instanceof z.ZodUnion)
            assert.strictEqual(schema.parse('hello'), 'hello')
            assert.strictEqual(schema.parse(42), 42)
            assert.throws(() => schema.parse(true))
        })

        it('should handle oneOf with simple types', () => {
            const schema = ZodHelpers.scanObject({
                type: 'string',
                description: 'String or boolean',
                oneOf: [
                    { type: 'string', description: 'String option' },
                    { type: 'boolean', description: 'Boolean option' },
                ],
            })
            assert.ok(schema instanceof z.ZodUnion)
            assert.strictEqual(schema.parse('test'), 'test')
            assert.strictEqual(schema.parse(false), false)
            assert.throws(() => schema.parse(123))
        })

        it('should handle union with complex types', () => {
            const schema = ZodHelpers.scanObject({
                type: 'object',
                description: 'Object or array',
                anyOf: [
                    {
                        type: 'object',
                        description: 'Object option',
                        properties: {
                            name: { type: 'string', description: 'Name' },
                        },
                    },
                    {
                        type: 'array',
                        description: 'Array option',
                        items: { type: 'string', description: 'Item' },
                    },
                ],
            })
            assert.deepStrictEqual(schema.parse({ name: 'John' }), {
                name: 'John',
            })
            assert.deepStrictEqual(schema.parse(['a', 'b']), ['a', 'b'])
        })

        it('should handle single-element anyOf (degenerates to single type)', () => {
            const schema = ZodHelpers.scanObject({
                type: 'string',
                description: 'Just string',
                anyOf: [{ type: 'string', description: 'String' }],
            })
            assert.ok(schema instanceof z.ZodString)
            assert.strictEqual(schema.parse('test'), 'test')
        })
    })

    describe('scanObject - Intersection Types', () => {
        it('should handle allOf with object types', () => {
            const schema = ZodHelpers.scanObject({
                type: 'object',
                description: 'Combined object',
                allOf: [
                    {
                        type: 'object',
                        description: 'First part',
                        properties: {
                            name: { type: 'string', description: 'Name' },
                        },
                    },
                    {
                        type: 'object',
                        description: 'Second part',
                        properties: {
                            age: { type: 'integer', description: 'Age' },
                        },
                    },
                ],
            })
            assert.ok(schema instanceof z.ZodIntersection)
            const result = schema.parse({ name: 'Alice', age: 30 })
            assert.deepStrictEqual(result, { name: 'Alice', age: 30 })
        })

        it('should handle single-element allOf', () => {
            const schema = ZodHelpers.scanObject({
                type: 'object',
                description: 'Single intersection',
                allOf: [
                    {
                        type: 'object',
                        description: 'Object',
                        properties: {
                            id: { type: 'integer', description: 'ID' },
                        },
                    },
                ],
            })
            assert.ok(schema instanceof z.ZodObject)
            assert.deepStrictEqual(schema.parse({ id: 123 }), { id: 123 })
        })
    })

    describe('scanObject - Nullable Types', () => {
        it('should handle nullable string', () => {
            const schema = ZodHelpers.scanObject({
                type: 'string',
                description: 'Nullable string',
                nullable: true,
            })
            assert.strictEqual(schema.parse('hello'), 'hello')
            assert.strictEqual(schema.parse(null), null)
            assert.throws(() => schema.parse(undefined))
        })

        it('should handle nullable number', () => {
            const schema = ZodHelpers.scanObject({
                type: 'number',
                description: 'Nullable number',
                nullable: true,
            })
            assert.strictEqual(schema.parse(42), 42)
            assert.strictEqual(schema.parse(null), null)
        })

        it('should handle nullable boolean', () => {
            const schema = ZodHelpers.scanObject({
                type: 'boolean',
                description: 'Nullable boolean',
                nullable: true,
            })
            assert.strictEqual(schema.parse(true), true)
            assert.strictEqual(schema.parse(null), null)
        })

        it('should handle nullable array', () => {
            const schema = ZodHelpers.scanObject({
                type: 'array',
                description: 'Nullable array',
                items: { type: 'string', description: 'Item' },
                nullable: true,
            })
            assert.deepStrictEqual(schema.parse(['a', 'b']), ['a', 'b'])
            assert.strictEqual(schema.parse(null), null)
        })

        it('should handle nullable object', () => {
            const schema = ZodHelpers.scanObject({
                type: 'object',
                description: 'Nullable object',
                properties: {
                    value: { type: 'string', description: 'Value' },
                },
                nullable: true,
            })
            assert.deepStrictEqual(schema.parse({ value: 'test' }), {
                value: 'test',
            })
            assert.strictEqual(schema.parse(null), null)
        })

        it('should handle nullable enum', () => {
            const schema = ZodHelpers.scanObject({
                type: 'string',
                description: 'Nullable enum',
                enum: ['red', 'green', 'blue'],
                nullable: true,
            })
            assert.strictEqual(schema.parse('red'), 'red')
            assert.strictEqual(schema.parse(null), null)
            assert.throws(() => schema.parse('yellow'))
        })

        it('should handle nullable tuple', () => {
            const schema = ZodHelpers.scanObject({
                type: 'array',
                description: 'Nullable tuple',
                prefixItems: [
                    { type: 'string', description: 'Name' },
                    { type: 'number', description: 'Score' },
                ],
                nullable: true,
            })
            assert.deepStrictEqual(schema.parse(['Alice', 95]), ['Alice', 95])
            assert.strictEqual(schema.parse(null), null)
        })
    })

    describe('scanObject - Literal/Const Types', () => {
        it('should handle string literal', () => {
            const schema = ZodHelpers.scanObject({
                type: 'string',
                description: 'Literal string',
                const: 'exact-value',
            })
            assert.ok(schema instanceof z.ZodLiteral)
            assert.strictEqual(schema.parse('exact-value'), 'exact-value')
            assert.throws(() => schema.parse('other-value'))
        })

        it('should handle number literal', () => {
            const schema = ZodHelpers.scanObject({
                type: 'number',
                description: 'Literal number',
                const: 42,
            })
            assert.ok(schema instanceof z.ZodLiteral)
            assert.strictEqual(schema.parse(42), 42)
            assert.throws(() => schema.parse(43))
        })

        it('should handle boolean literal', () => {
            const schema = ZodHelpers.scanObject({
                type: 'boolean',
                description: 'Literal true',
                const: true,
            })
            assert.ok(schema instanceof z.ZodLiteral)
            assert.strictEqual(schema.parse(true), true)
            assert.throws(() => schema.parse(false))
        })

        it('should handle null literal', () => {
            const schema = ZodHelpers.scanObject({
                type: 'null',
                description: 'Null type',
            })
            assert.ok(schema instanceof z.ZodNull)
            assert.strictEqual(schema.parse(null), null)
            assert.throws(() => schema.parse(undefined))
            assert.throws(() => schema.parse('null'))
        })
    })

    describe('scanObject - Complex Compositions', () => {
        it('should handle union of nullable types', () => {
            const schema = ZodHelpers.scanObject({
                type: 'string',
                description: 'String or number, both nullable',
                anyOf: [
                    { type: 'string', description: 'String', nullable: true },
                    { type: 'number', description: 'Number', nullable: true },
                ],
            })
            assert.strictEqual(schema.parse('text'), 'text')
            assert.strictEqual(schema.parse(123), 123)
            assert.strictEqual(schema.parse(null), null)
        })

        it('should handle array of union types', () => {
            const schema = ZodHelpers.scanObject({
                type: 'array',
                description: 'Array of string or number',
                items: {
                    type: 'string',
                    description: 'String or number',
                    anyOf: [
                        { type: 'string', description: 'String' },
                        { type: 'number', description: 'Number' },
                    ],
                },
            })
            assert.deepStrictEqual(schema.parse(['a', 1, 'b', 2]), [
                'a',
                1,
                'b',
                2,
            ])
        })

        it('should handle union with literal values', () => {
            const schema = ZodHelpers.scanObject({
                type: 'string',
                description: 'Success or error literal',
                anyOf: [
                    {
                        type: 'string',
                        description: 'Success',
                        const: 'success',
                    },
                    { type: 'string', description: 'Error', const: 'error' },
                ],
            })
            assert.strictEqual(schema.parse('success'), 'success')
            assert.strictEqual(schema.parse('error'), 'error')
            assert.throws(() => schema.parse('pending'))
        })
    })

    describe('scanObject - String Constraints', () => {
        it('should handle minLength constraint', () => {
            const schema = ZodHelpers.scanObject({
                type: 'string',
                description: 'String with min length',
                minLength: 3,
            })
            assert.strictEqual(schema.parse('abc'), 'abc')
            assert.strictEqual(schema.parse('abcd'), 'abcd')
            assert.throws(() => schema.parse('ab'))
        })

        it('should handle maxLength constraint', () => {
            const schema = ZodHelpers.scanObject({
                type: 'string',
                description: 'String with max length',
                maxLength: 5,
            })
            assert.strictEqual(schema.parse('abc'), 'abc')
            assert.strictEqual(schema.parse('abcde'), 'abcde')
            assert.throws(() => schema.parse('abcdef'))
        })

        it('should handle both min and max length', () => {
            const schema = ZodHelpers.scanObject({
                type: 'string',
                description: 'String with length range',
                minLength: 2,
                maxLength: 5,
            })
            assert.strictEqual(schema.parse('ab'), 'ab')
            assert.strictEqual(schema.parse('abcde'), 'abcde')
            assert.throws(() => schema.parse('a'))
            assert.throws(() => schema.parse('abcdef'))
        })

        it('should handle pattern (regex) constraint', () => {
            const schema = ZodHelpers.scanObject({
                type: 'string',
                description: 'String matching pattern',
                pattern: '^[A-Z][a-z]+$',
            })
            assert.strictEqual(schema.parse('Hello'), 'Hello')
            assert.strictEqual(schema.parse('World'), 'World')
            assert.throws(() => schema.parse('hello'))
            assert.throws(() => schema.parse('HELLO'))
            assert.throws(() => schema.parse('Hello123'))
        })

        it('should handle multiple string constraints together', () => {
            const schema = ZodHelpers.scanObject({
                type: 'string',
                description: 'Email-like with constraints',
                minLength: 5,
                maxLength: 50,
                pattern: '^[a-z]+@[a-z]+\\.[a-z]+$',
            })
            assert.strictEqual(
                schema.parse('user@example.com'),
                'user@example.com',
            )
            assert.throws(() => schema.parse('a@b')) // Too short (4 chars)
            assert.throws(() => schema.parse('User@example.com')) // Pattern mismatch
        })
    })

    describe('scanObject - Number Constraints', () => {
        it('should handle minimum constraint', () => {
            const schema = ZodHelpers.scanObject({
                type: 'number',
                description: 'Number with minimum',
                minimum: 0,
            })
            assert.strictEqual(schema.parse(0), 0)
            assert.strictEqual(schema.parse(10), 10)
            assert.throws(() => schema.parse(-1))
        })

        it('should handle maximum constraint', () => {
            const schema = ZodHelpers.scanObject({
                type: 'number',
                description: 'Number with maximum',
                maximum: 100,
            })
            assert.strictEqual(schema.parse(0), 0)
            assert.strictEqual(schema.parse(100), 100)
            assert.throws(() => schema.parse(101))
        })

        it('should handle both min and max', () => {
            const schema = ZodHelpers.scanObject({
                type: 'number',
                description: 'Number in range',
                minimum: 1,
                maximum: 10,
            })
            assert.strictEqual(schema.parse(1), 1)
            assert.strictEqual(schema.parse(10), 10)
            assert.strictEqual(schema.parse(5), 5)
            assert.throws(() => schema.parse(0))
            assert.throws(() => schema.parse(11))
        })

        it('should handle exclusiveMinimum', () => {
            const schema = ZodHelpers.scanObject({
                type: 'number',
                description: 'Number greater than 0',
                exclusiveMinimum: 0,
            })
            assert.strictEqual(schema.parse(0.1), 0.1)
            assert.strictEqual(schema.parse(1), 1)
            assert.throws(() => schema.parse(0))
            assert.throws(() => schema.parse(-1))
        })

        it('should handle exclusiveMaximum', () => {
            const schema = ZodHelpers.scanObject({
                type: 'number',
                description: 'Number less than 100',
                exclusiveMaximum: 100,
            })
            assert.strictEqual(schema.parse(99.9), 99.9)
            assert.strictEqual(schema.parse(50), 50)
            assert.throws(() => schema.parse(100))
            assert.throws(() => schema.parse(101))
        })

        it('should handle integer with constraints', () => {
            const schema = ZodHelpers.scanObject({
                type: 'integer',
                description: 'Integer between 1 and 100',
                minimum: 1,
                maximum: 100,
            })
            assert.strictEqual(schema.parse(1), 1)
            assert.strictEqual(schema.parse(50), 50)
            assert.strictEqual(schema.parse(100), 100)
            assert.throws(() => schema.parse(0))
            assert.throws(() => schema.parse(101))
            assert.throws(() => schema.parse(50.5))
        })
    })

    describe('scanObject - Record/AdditionalProperties', () => {
        it('should handle record with string values', () => {
            const schema = ZodHelpers.scanObject({
                type: 'object',
                description: 'Record of strings',
                additionalProperties: {
                    type: 'string',
                    description: 'String value',
                },
            })
            assert.ok(schema instanceof z.ZodRecord)
            assert.deepStrictEqual(schema.parse({ a: 'hello', b: 'world' }), {
                a: 'hello',
                b: 'world',
            })
            assert.throws(() => schema.parse({ a: 'hello', b: 123 }))
        })

        it('should handle record with number values', () => {
            const schema = ZodHelpers.scanObject({
                type: 'object',
                description: 'Record of numbers',
                additionalProperties: {
                    type: 'number',
                    description: 'Number value',
                },
            })
            assert.deepStrictEqual(schema.parse({ score1: 95, score2: 87.5 }), {
                score1: 95,
                score2: 87.5,
            })
            assert.throws(() => schema.parse({ score1: 'ninety-five' }))
        })

        it('should handle record with complex values', () => {
            const schema = ZodHelpers.scanObject({
                type: 'object',
                description: 'Record of objects',
                additionalProperties: {
                    type: 'object',
                    description: 'User object',
                    properties: {
                        name: { type: 'string', description: 'Name' },
                        age: { type: 'integer', description: 'Age' },
                    },
                },
            })
            const data = {
                user1: { name: 'Alice', age: 30 },
                user2: { name: 'Bob', age: 25 },
            }
            assert.deepStrictEqual(schema.parse(data), data)
        })

        it('should handle nullable record', () => {
            const schema = ZodHelpers.scanObject({
                type: 'object',
                description: 'Nullable record',
                additionalProperties: {
                    type: 'string',
                    description: 'Value',
                },
                nullable: true,
            })
            assert.deepStrictEqual(schema.parse({ key: 'value' }), {
                key: 'value',
            })
            assert.strictEqual(schema.parse(null), null)
        })

        it('should prefer object shape over additionalProperties when properties exist', () => {
            const schema = ZodHelpers.scanObject({
                type: 'object',
                description: 'Object with properties',
                properties: {
                    id: { type: 'integer', description: 'ID' },
                    name: { type: 'string', description: 'Name' },
                },
                additionalProperties: {
                    type: 'string',
                    description: 'Additional string',
                },
            })
            // Should create a regular object, not a record
            assert.ok(
                schema instanceof z.ZodObject ||
                    schema instanceof z.ZodNullable,
            )
            assert.deepStrictEqual(schema.parse({ id: 1, name: 'Test' }), {
                id: 1,
                name: 'Test',
            })
        })
    })

    describe('scanObject - Format Validations', () => {
        it('should handle email format', () => {
            const schema = ZodHelpers.scanObject({
                type: 'string',
                description: 'Email address',
                format: 'email',
            })
            assert.strictEqual(
                schema.parse('user@example.com'),
                'user@example.com',
            )
            assert.strictEqual(
                schema.parse('test.user+tag@domain.co.uk'),
                'test.user+tag@domain.co.uk',
            )
            assert.throws(() => schema.parse('invalid-email'))
            assert.throws(() => schema.parse('missing@domain'))
        })

        it('should handle url format', () => {
            const schema = ZodHelpers.scanObject({
                type: 'string',
                description: 'URL',
                format: 'url',
            })
            assert.strictEqual(
                schema.parse('https://example.com'),
                'https://example.com',
            )
            assert.strictEqual(
                schema.parse('http://localhost:8080/path'),
                'http://localhost:8080/path',
            )
            assert.throws(() => schema.parse('not-a-url'))
            assert.throws(() => schema.parse('just-text'))
        })

        it('should handle uri format (alias for url)', () => {
            const schema = ZodHelpers.scanObject({
                type: 'string',
                description: 'URI',
                format: 'uri',
            })
            assert.strictEqual(
                schema.parse('https://example.com'),
                'https://example.com',
            )
            assert.throws(() => schema.parse('not-a-uri'))
        })

        it('should handle uuid format', () => {
            const schema = ZodHelpers.scanObject({
                type: 'string',
                description: 'UUID',
                format: 'uuid',
            })
            assert.strictEqual(
                schema.parse('123e4567-e89b-12d3-a456-426614174000'),
                '123e4567-e89b-12d3-a456-426614174000',
            )
            assert.throws(() => schema.parse('not-a-uuid'))
            assert.throws(() => schema.parse('123e4567-e89b-12d3-a456'))
        })

        it('should handle date-time format', () => {
            const schema = ZodHelpers.scanObject({
                type: 'string',
                description: 'DateTime',
                format: 'date-time',
            })
            assert.strictEqual(
                schema.parse('2025-12-06T10:30:00Z'),
                '2025-12-06T10:30:00Z',
            )
            assert.strictEqual(
                schema.parse('2025-12-06T10:30:00.123Z'),
                '2025-12-06T10:30:00.123Z',
            )
            assert.throws(() => schema.parse('2025-12-06'))
            assert.throws(() => schema.parse('not-a-datetime'))
        })

        it('should handle datetime format (alias)', () => {
            const schema = ZodHelpers.scanObject({
                type: 'string',
                description: 'DateTime',
                format: 'datetime',
            })
            assert.strictEqual(
                schema.parse('2025-12-06T10:30:00Z'),
                '2025-12-06T10:30:00Z',
            )
        })

        it('should handle date format', () => {
            const schema = ZodHelpers.scanObject({
                type: 'string',
                description: 'Date',
                format: 'date',
            })
            assert.strictEqual(schema.parse('2025-12-06'), '2025-12-06')
            assert.throws(() => schema.parse('12/06/2025'))
            assert.throws(() => schema.parse('2025-12-06T10:30:00Z'))
        })

        it('should handle time format', () => {
            const schema = ZodHelpers.scanObject({
                type: 'string',
                description: 'Time',
                format: 'time',
            })
            assert.strictEqual(schema.parse('10:30:00'), '10:30:00')
            assert.strictEqual(schema.parse('23:59:59'), '23:59:59')
            assert.throws(() => schema.parse('25:00:00'))
            assert.throws(() => schema.parse('not-a-time'))
        })

        it('should handle ipv4 format', () => {
            const schema = ZodHelpers.scanObject({
                type: 'string',
                description: 'IPv4 address',
                format: 'ipv4',
            })
            assert.strictEqual(schema.parse('192.168.1.1'), '192.168.1.1')
            assert.strictEqual(schema.parse('10.0.0.1'), '10.0.0.1')
            assert.throws(() => schema.parse('256.1.1.1'))
            assert.throws(() => schema.parse('not-an-ip'))
        })

        it('should handle ipv6 format', () => {
            const schema = ZodHelpers.scanObject({
                type: 'string',
                description: 'IPv6 address',
                format: 'ipv6',
            })
            assert.strictEqual(
                schema.parse('2001:0db8:85a3:0000:0000:8a2e:0370:7334'),
                '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
            )
            assert.strictEqual(schema.parse('::1'), '::1')
            assert.throws(() => schema.parse('192.168.1.1'))
        })

        it('should handle ip format (both v4 and v6)', () => {
            const schema = ZodHelpers.scanObject({
                type: 'string',
                description: 'IP address',
                format: 'ip',
            })
            assert.strictEqual(schema.parse('192.168.1.1'), '192.168.1.1')
            assert.strictEqual(schema.parse('::1'), '::1')
            assert.throws(() => schema.parse('not-an-ip'))
        })

        it('should handle unknown format gracefully (no validation)', () => {
            const schema = ZodHelpers.scanObject({
                type: 'string',
                description: 'Custom format',
                format: 'custom-unknown-format',
            })
            // Should accept any string when format is unknown
            assert.strictEqual(schema.parse('any-string'), 'any-string')
            assert.strictEqual(schema.parse('123'), '123')
        })

        it('should combine format with other string constraints', () => {
            const schema = ZodHelpers.scanObject({
                type: 'string',
                description: 'Email with length constraint',
                format: 'email',
                minLength: 10,
                maxLength: 100,
            })
            assert.strictEqual(
                schema.parse('user@example.com'),
                'user@example.com',
            )
            assert.throws(() => schema.parse('a@b.co')) // Too short (6 chars)
            assert.throws(() => schema.parse('not-an-email-but-long-enough'))
        })

        it('should handle nullable format validations', () => {
            const schema = ZodHelpers.scanObject({
                type: 'string',
                description: 'Nullable email',
                format: 'email',
                nullable: true,
            })
            assert.strictEqual(
                schema.parse('user@example.com'),
                'user@example.com',
            )
            assert.strictEqual(schema.parse(null), null)
            assert.throws(() => schema.parse('invalid-email'))
        })
    })
})
