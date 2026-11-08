import { it, expect } from 'vitest';
import { buildAttendanceCsv } from '../src/report-export';
it('escapes spreadsheet formulas and includes BOM', () => { const result = buildAttendanceCsv(['Student'], [['=1+1']]); expect(result.startsWith('\uFEFF')).toBe(true); expect(result).toContain(`"'=1+1"`); });
it('rejects mismatched column count', () => { expect(() => buildAttendanceCsv(['a', 'b'], [['only-one']])).toThrow(); });

it('rejects non-array rows in untrusted CSV datasets',()=>{
 expect(()=>buildAttendanceCsv(['student'],[null as never])).toThrow(RangeError);
});

it('rejects unsafe or oversized CSV header labels',()=>{
 expect(()=>buildAttendanceCsv([42 as never],[])).toThrow(RangeError);
 expect(()=>buildAttendanceCsv(['x'.repeat(121)],[])).toThrow(RangeError);
});

it('rejects oversized CSV cell payloads',()=>{
 expect(()=>buildAttendanceCsv(['student'],[['x'.repeat(32768)]])).toThrow(RangeError);
});
