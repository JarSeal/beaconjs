import { Logger } from '../LIGHTER';
import { getText } from './lang';

const variables = {
  defaultFormat: {
    // Keywords:
    // - 0D and 0M = day or month number with a leading zero,
    // - DD and MM = day or month number without a leading zero,
    // - DTH = day number with st, nd, or th ending (or in other languages it could be a period)
    // - YYYY = full year (2021),
    // - YY = only decades (21),
    // - WD = full week day name (Monday),
    // - WDS = short week day name (Mon),
    // - MN = full month name (January),
    // - MNS = short month name (Jan),
    // - HH = 0-23 hour display
    // - 0H = 00-23 hour display (with leading zeros)
    // - MI = minutes with leading zeros,
    // - SS = seconds with leading zeros,
    // - MS = milliseconds
    // Example: 'DTH MNS YYYY, HH:MM' = '6th Jan 2021, 10:25'
    // TODO: create the am and pm time for hours and the two letter thing (am or pm)
    date: 'DD.MM.YYYY',
    time: 'HH.MM',
    full: 'DD.MM.YYYY, 0H:MI',
  },
};

const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

const parseDateFormat = (dateData, shape) => {
  let format = variables.defaultFormat.full;
  if (shape) format = shape;

  // Date
  format = format.replace('DD', dateData.getDate());
  dateData.getDate() < 10
    ? (format = format.replace('0D', '0' + dateData.getDate()))
    : (format = format.replace('0D', dateData.getDate()));
  if (format.includes('DTH')) {
    const date = dateData.getDate();
    let suffix = getText('order_number_suffix_th');
    if (date === 1) {
      suffix = getText('order_number_suffix_st');
    } else if (date === 2) {
      suffix = getText('order_number_suffix_nd');
    } else if (date === 3) {
      suffix = getText('order_number_suffix_rd');
    }
    format = format.replace('DTH', date + suffix);
  }

  // Week day name
  if (format.includes('WD')) {
    format = format.replace('WDS', getText('weekday_' + dayNames[dateData.getDay()] + '_short'));
    format = format.replace('WD', getText('weekday_' + dayNames[dateData.getDay()] + '_long'));
  }

  // Month
  format = format.replace('MM', dateData.getMonth() + 1);
  dateData.getMonth() + 1 < 10
    ? (format = format.replace('0M', '0' + dateData.getMonth() + 1))
    : (format = format.replace('0M', dateData.getMonth() + 1));
  if (format.includes('MN')) {
    format = format.replace('MNS', getText('month_' + months[dateData.getMonth()] + '_short'));
    format = format.replace('MN', getText('month_' + months[dateData.getMonth()] + '_long'));
  }

  // Year
  format = format.replace('YYYY', dateData.getFullYear());
  format = format.replace('YY', dateData.getFullYear().toString().slice(-2));

  // Hour
  format = format.replace('HH', dateData.getHours());
  dateData.getHours() < 10
    ? (format = format.replace('0H', '0' + dateData.getHours()))
    : (format = format.replace('0H', dateData.getHours()));

  // Minute
  dateData.getMinutes() < 10
    ? (format = format.replace('MI', '0' + dateData.getMinutes()))
    : (format = format.replace('MI', dateData.getMinutes()));

  // Second
  dateData.getSeconds() < 10
    ? (format = format.replace('SS', '0' + dateData.getSeconds()))
    : (format = format.replace('SS', dateData.getSeconds()));

  // Millisecond
  format = format.replace('MS', dateData.getMilliseconds());

  return format;
};

export const createDate = (dateData, shape) => {
  if (!dateData) return '';
  const newDate = new Date(dateData.toString());
  return parseDateFormat(newDate, shape);
};

export const getMonthName = (monthIndex, long) => {
  if (monthIndex < 0 || monthIndex > 11) {
    new Logger('Date, getMonthName *****').log('Month index is not withing 0 and 11.', monthIndex);
    return '';
  }
  let type = '_short';
  if (long) type = '_long';
  return getText('month_' + months[monthIndex] + type);
};

export const getWeekDayName = (weekDayIndex, long) => {
  if (weekDayIndex < 0 || weekDayIndex > 6) {
    new Logger('Date, getWeekDayIndex *****').log(
      'Weekday index is not withing 0 and 6.',
      weekDayIndex
    );
    return '';
  }
  let type = '_short';
  if (long) type = '_long';
  return getText('weekday_' + dayNames[weekDayIndex] + type);
};
