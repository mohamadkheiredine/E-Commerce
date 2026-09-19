import { format, isAfter, isSameDay } from 'date-fns';

export function formatDate(dateString: string | Date) {
  const date = new Date(dateString);
  return format(date, 'dd/MM/yyyy, HH:mm zzz');
}

export function isSameOrAfter(dateA: string | number | Date, dateB: string | number | Date) {
  return isSameDay(dateA, dateB) || isAfter(dateA, dateB);
}
