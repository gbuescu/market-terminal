import { downloadCsv, fileStamp, toCsv } from '../lib/csv';

/**
 * Toolbar button that exports tabular data to CSV. `rows` is resolved lazily
 * on click so callers can pass current (filtered/sorted) state.
 */
export function ExportButton({
  name,
  headers,
  rows,
  disabled,
}: {
  /** filename stem, e.g. "screener" → screener-20260715-1432.csv */
  name: string;
  headers: string[];
  rows: () => (string | number | null | undefined)[][];
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className="btn"
      disabled={disabled}
      title="Export visible rows to CSV"
      onClick={() => downloadCsv(`${name}-${fileStamp()}.csv`, toCsv(headers, rows()))}
    >
      CSV
    </button>
  );
}
