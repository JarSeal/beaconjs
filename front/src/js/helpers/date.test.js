import { createDate, getMonthName, getWeekDayName } from './date';
import { loadAssets } from './lang';

describe('date', () => {
  it('should create a formatted date from ISO date', () => {
    loadAssets();
    let date = new Date('2022-12-25');
    let parsedDate = createDate(date);
    expect(parsedDate).toBe('25.12.2022, 00:00');
    parsedDate = createDate(date, 'YYYY');
    expect(parsedDate).toBe('2022');
    parsedDate = createDate(date, 'YYYY-MM');
    expect(parsedDate).toBe('2022-12');
    date = new Date('2020-04-13T05:30:24.126+00:00');
    parsedDate = createDate(date, 'YYYY-MM-0D HH:MI:SS:MS');
    expect(parsedDate).toBe('2020-4-13 5:30:24:126');
    parsedDate = createDate(date, 'DTH');
    expect(parsedDate).toBe('13th');
    parsedDate = createDate(new Date('2020-4-1'), 'DTH');
    expect(parsedDate).toBe('1st');
    parsedDate = createDate(new Date('2020-4-2'), 'DTH');
    expect(parsedDate).toBe('2nd');
    parsedDate = createDate(new Date('2020-4-3'), 'WD DTH of MN');
    expect(parsedDate).toBe('Friday 3rd of April');
    parsedDate = createDate(new Date('2020-4-3'), 'WDS DTH of MNS');
    expect(parsedDate).toBe('Fri 3rd of Apr');
  });

  it('should get month name', () => {
    loadAssets();
    let monthName = getMonthName(0);
    expect(monthName).toBe('Jan');
    monthName = getMonthName(1, false);
    expect(monthName).toBe('Feb');
    monthName = getMonthName(11, true);
    expect(monthName).toBe('December');
    monthName = getMonthName(16, true);
    expect(monthName).toBe('');
  });

  it('should weekday name', () => {
    loadAssets();
    let dayName = getWeekDayName(0);
    expect(dayName).toBe('Sun');
    dayName = getWeekDayName(1, false);
    expect(dayName).toBe('Mon');
    dayName = getWeekDayName(5, true);
    expect(dayName).toBe('Friday');
    dayName = getWeekDayName(16, true);
    expect(dayName).toBe('');
  });
});
