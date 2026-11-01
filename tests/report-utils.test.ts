import { describe, expect, it } from 'vitest';
import { csvCell, filterReportCourse, filterReportDates, filterReportStatus, searchReportRows } from '../src/report-utils';

describe('CSV export safety', () => {
  it('quotes commas and double quotes', () => {
    expect(csvCell('Safari, "Group A"')).toBe('"Safari, ""Group A"""');
  });
  it('escapes formula-like content from untrusted records', () => {
    expect(csvCell('=IMPORTXML("x","y")')).toBe('"\'=IMPORTXML(""x"",""y"")"');
    expect(csvCell('  +SUM(1,1)')).toBe('"\'  +SUM(1,1)"');
  });
});

describe('report text search', () => {
  const records = [
    { course: 'CSC 112', studentId: 'T001', venue: 'Main Hall' },
    { course: 'CSC 125', studentId: 'T002', venue: 'Lab 2' },
  ];
  it('searches across course, registration and venue ignoring case', () => {
    expect(searchReportRows(records, 'lab')).toEqual([records[1]]);
    expect(searchReportRows(records, 'CSC 112')).toEqual([records[0]]);
    expect(searchReportRows(records, ' t001 ')).toEqual([records[0]]);
  });
});

it('filters report records by exact review status', () => {
  const rows = [{ status: 'Verified' }, { status: 'Pending Verification' }];
  expect(filterReportStatus(rows, 'Verified')).toEqual([rows[0]]);
  expect(filterReportStatus(rows, '')).toEqual(rows);
});

it('limits report records to a selected course', () => {
  const rows = [{ course: 'CSC 111' }, { course: 'CSC 125' }];
  expect(filterReportCourse(rows, 'CSC 125')).toEqual([rows[1]]);
  expect(filterReportCourse(rows, '')).toEqual(rows);
});

it('filters report records by an inclusive local calendar date interval', () => {
  const rows = [{ checkedInAt: new Date('2026-11-01T12:00:00').getTime() }, { checkedInAt: new Date('2026-11-03T12:00:00').getTime() }];
  expect(filterReportDates(rows, '2026-11-01', '2026-11-01')).toEqual([rows[0]]);
  expect(filterReportDates(rows, '2026-11-03', '2026-11-01')).toEqual([]);
});
