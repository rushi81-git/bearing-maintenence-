/**
 * Robust CSV Signal Parser
 * Handles:
 *  - Single column or multiple columns
 *  - Headers vs. Headerless
 *  - Comma, semicolon, tab, or space delimiters
 *  - NaN, Infinity, blank rows, and text cleaning
 */

export function parseVibrationCSV(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Empty or invalid CSV file content.');
  }

  const lines = text.split(/\r\n|\n|\r/).filter(line => line.trim().length > 0);
  if (lines.length === 0) {
    throw new Error('The CSV file is empty.');
  }

  // Detect delimiter
  const firstLine = lines[0];
  let delimiter = ',';
  if (firstLine.includes(',')) delimiter = ',';
  else if (firstLine.includes('\t')) delimiter = '\t';
  else if (firstLine.includes(';')) delimiter = ';';
  else if (firstLine.includes(' ')) delimiter = /\s+/;

  // Split first row into cells
  const firstRowCells = firstLine.split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
  
  // Check if first row contains column headers (non-numeric)
  const isFirstRowHeader = firstRowCells.some(cell => isNaN(parseFloat(cell)) && cell !== '');

  let headers = [];
  let dataStartIndex = 0;

  if (isFirstRowHeader) {
    headers = firstRowCells.map((h, i) => h || `Column_${i + 1}`);
    dataStartIndex = 1;
  } else {
    headers = firstRowCells.map((_, i) => `Column_${i + 1}`);
    dataStartIndex = 0;
  }

  // Collect raw values per column
  const columnData = headers.map(() => []);

  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cells = line.split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
    for (let c = 0; c < headers.length; c++) {
      if (c < cells.length) {
        const val = parseFloat(cells[c]);
        if (!isNaN(val) && isFinite(val)) {
          columnData[c].push(val);
        }
      }
    }
  }

  // Identify valid numeric signal columns
  const numericColumns = [];
  headers.forEach((header, idx) => {
    const samples = columnData[idx];
    if (samples.length >= 64) {
      numericColumns.push({
        columnIndex: idx,
        columnName: header,
        sampleCount: samples.length,
        data: samples,
        preview: samples.slice(0, 10),
        min: Math.min(...samples),
        max: Math.max(...samples),
        mean: samples.reduce((a, b) => a + b, 0) / samples.length
      });
    }
  });

  if (numericColumns.length === 0) {
    throw new Error('No valid numeric vibration signal columns found in the CSV.');
  }

  // Try to find default preferred column name
  let defaultColIndex = 0;
  const preferredNames = ['vibration', 'signal', 'acceleration', 'accel', 'de', 'fe', 'value', 'data'];
  const matchedIdx = numericColumns.findIndex(col => 
    preferredNames.some(pref => col.columnName.toLowerCase().includes(pref))
  );
  if (matchedIdx !== -1) {
    defaultColIndex = matchedIdx;
  }

  return {
    columns: numericColumns,
    defaultColumn: numericColumns[defaultColIndex],
    totalRows: lines.length - dataStartIndex
  };
}
