import { format } from 'date-fns';
import { getObjectKeys } from '@/lib/utils/ts-utils';

export function toQueryString(
  params: Record<string, string | number | boolean | undefined | Array<unknown> | Date>,
) {
  const str = getObjectKeys(params)
    .map((key) => {
      let value = params[key]!;

      if (value === undefined) {
        return '';
      }

      if (Array.isArray(value)) {
        value = value.join(',');
      }

      if (value instanceof Date) {
        value = format(value, 'yyyy-MM-dd');
      }

      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    })
    .filter((param) => param !== '')
    .join('&');

  return str ? `?${str}` : '';
}

export function capitalize(value: string) {
  if (!value || value.length === 0) return '';

  return `${value[0].toUpperCase()}${value.slice(1)}`;
}

export function splitAndCapitalize(
  value: string,
  {
    splitBy = '-',
    joinWith = ' ',
  }: {
    splitBy?: string;
    joinWith?: string;
  } = {},
) {
  if (!value) return '';

  return value.split(splitBy).map(capitalize).join(joinWith);
}
