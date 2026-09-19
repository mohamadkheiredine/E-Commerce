import { getObjectKeys, getObjectValues } from '@/lib/utils/ts-utils';

export function hasBlankValues(obj: Record<string, unknown>) {
  return getObjectValues(obj).some((value) => !`${value ?? ''}`.trim());
}

export function hasNonBlankValues(obj: Record<string, unknown>) {
  return getObjectValues(obj).some((value) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    if (typeof value === 'object') {
      return value && getObjectKeys(value).length > 0;
    }
    return !!`${value ?? ''}`.trim();
  });
}

export function getObjectValuesSortedByKeys<T extends Record<string, unknown>>(
  obj: T,
): T[keyof T][] {
  const keys = getObjectKeys(obj);
  return keys.sort((a, b) => a.toString().localeCompare(b.toString())).map((key) => obj[key]);
}
