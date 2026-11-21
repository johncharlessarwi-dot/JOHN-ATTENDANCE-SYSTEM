import { expect, it } from 'vitest';
import { read, utils, write } from 'xlsx';
import { spreadsheetSafeText } from '../src/report-utils';

it('writes attendance workbook rows and keeps report labels as text', () => {
  const row = { 'Attendance ID': '001', Course: spreadsheetSafeText('Intro to accounting'), Status: 'Verified' };
  const book = utils.book_new();
  utils.book_append_sheet(book, utils.json_to_sheet([row]), 'Attendance');
  const report = read(write(book, { bookType: 'xlsx', type: 'buffer' }), { type: 'buffer' });
  expect(report.SheetNames).toEqual(['Attendance']);
  expect(utils.sheet_to_json(report.Sheets.Attendance)).toEqual([row]);
  expect(report.Sheets.Attendance.A2.t).toBe('s');
});
