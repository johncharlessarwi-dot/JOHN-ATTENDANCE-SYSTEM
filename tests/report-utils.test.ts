import { describe, expect, it } from 'vitest';
import { csvCell, searchReportRows } from '../src/report-utils';

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
