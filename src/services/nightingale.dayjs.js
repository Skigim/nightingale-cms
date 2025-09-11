// ES Module refactor: use official dayjs package with plugins
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(customParseFormat);
dayjs.extend(relativeTime);

// Utility wrapper (preserve previous API surface for compatibility)
const dateUtils = {
  now: () => dayjs().toISOString(),
  format: (dateString, formatStr = 'MM/DD/YYYY') => {
    if (!dateString) return 'N/A';
    const date = dayjs(dateString);
    return date.isValid() ? date.format(formatStr) : 'N/A';
  },
  compareDates: (dateA, dateB) => {
    const d1 = dayjs(dateA);
    const d2 = dayjs(dateB);
    if (!d1.isValid() || !d2.isValid()) return 0;
    if (d1.isBefore(d2)) return -1;
    if (d1.isAfter(d2)) return 1;
    return 0;
  },
  isBefore: (a, b) => {
    const d1 = dayjs(a);
    const d2 = dayjs(b);
    return d1.isValid() && d2.isValid() ? d1.isBefore(d2) : false;
  },
  monthsAgo: (m) => dayjs().subtract(m, 'month').toISOString(),
  addDays: (d) => dayjs().add(d, 'day').toISOString(),
  addDaysToDate: (dateString, d) => {
    const date = dayjs(dateString);
    return date.isValid() ? date.add(d, 'day').toISOString() : dateString;
  },
  formatToday: (fmt = 'MM/DD/YYYY') => dayjs().format(fmt),
  todayForInput: () => dayjs().format('YYYY-MM-DD'),
};

export { dayjs };
export default dateUtils;
