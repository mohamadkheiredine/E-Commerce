import { z, type ZodType } from 'zod';

export type Primitive = string | number | boolean | undefined | null;

export type DefinedPrimitive = Exclude<Primitive, undefined | null>;

/**
 * Checks if a key exists in an object. This is a type guard so we can use dynamic keys
 * on objects in TS.
 */
export function isKeyOf<T>(obj: T, key: PropertyKey): key is keyof T {
  return !!obj && typeof obj === 'object' && key in obj;
}

/**
 * Checks if a value is included in an array. This is a type guard for dynamic values.
 * if strictIncludes(['test1', 'test2'] as const, someStringValue) is true,
 * TS infers that `someStringValue` is 'test1' | 'test2'
 */
export function strictIncludes<T>(arr: readonly T[], value: unknown): value is T {
  return arr.includes(value as T);
}

/**
 * Returns a correctly typed array of keys of the object
 */
export const getObjectKeys = Object.keys as <T extends object>(obj: T) => Array<keyof T>;

/**
 * Returns a correctly typed array of values of the object
 */
export const getObjectValues = Object.values as <T extends object>(
  obj: T,
) => Array<(typeof obj)[keyof typeof obj]>;

/**
 * A type-safe wrapper for `structuredClone`
 */
export function deepClone<T>(value: T): T {
  return structuredClone(value);
}

type ArrayType<T> = Extract<
  true extends T & false ? unknown[] : T extends readonly unknown[] ? T : unknown[],
  T
>;
/**
 * A type-safe wrapper for `isArray`
 * Fixes the type of `Array.isArray` to correctly detect readonly arrays
 * https://github.com/microsoft/TypeScript/issues/17002
 */
export function isArray<T>(arg: T): arg is ArrayType<T> {
  return Array.isArray(arg);
}

/**
 * Checks if a value is of a certain type.
 */
export function is(value: unknown, type: 'object'): value is object;
export function is(value: unknown, type: 'string'): value is string;
export function is(value: unknown, type: 'number'): value is number;
export function is(value: unknown, type: 'bigint'): value is bigint;
export function is(value: unknown, type: 'boolean'): value is boolean;
export function is(value: unknown, type: 'symbol'): value is symbol;
export function is(value: unknown, type: 'undefined'): value is undefined;
export function is(value: unknown, type: 'primitive'): value is Primitive;
export function is<T>(value: unknown, type: ZodType<T>): value is T;
export function is(
  value: unknown,
  type:
    | 'object'
    | 'function'
    | 'string'
    | 'number'
    | 'bigint'
    | 'boolean'
    | 'symbol'
    | 'undefined'
    | 'primitive'
    | ZodType,
): boolean {
  if (type instanceof z.ZodType) {
    return type.safeParse(value).success;
  }

  const runtimeType = typeof value;
  if (type === 'primitive') {
    return value == null || (runtimeType !== 'object' && runtimeType !== 'function');
  }

  return runtimeType === type;
}
