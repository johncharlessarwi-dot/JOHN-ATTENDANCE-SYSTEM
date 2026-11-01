import { describe, expect, it } from 'vitest';
import { csvCell } from '../src/report-utils';

describe('CSV export safety', () => {
  it('quotes commas and double quotes', () => {
    expect(csvCell('Safari, "Group A"')).toBe('"Safari, ""Group A"""');
  });
  it('escapes formula-like content from untrusted records', () => {
    expect(csvCell('=IMPORTXML("x","y")')).toBe('"\'=IMPORTXML(""x"",""y"")"');
    expect(csvCell('  +SUM(1,1)')).toBe('"\'  +SUM(1,1)"');
  });
});
