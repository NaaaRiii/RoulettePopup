import { format } from 'date-fns';

export const formatDate = (input: Date | string): string => {
  const date = typeof input === 'string' ? new Date(input) : input;
  return format(date, 'yyyy-MM-dd');
};
