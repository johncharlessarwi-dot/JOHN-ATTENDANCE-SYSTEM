import { it, expect } from 'vitest';
import { buildAttendanceCsv } from '../src/report-export';
it('escapes spreadsheet formulas and includes BOM', () => { const result = buildAttendanceCsv(['Student'], [['=1+1']]); expect(result.startsWith('\uFEFF')).toBe(true); expect(result).toContain(`"'=1+1"`); });
it('rejects mismatched column count', () => { expect(() => buildAttendanceCsv(['a', 'b'], [['only-one']])).toThrow(); });
