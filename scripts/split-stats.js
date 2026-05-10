/**
 * TCG Card Data Splitter
 *
 * Splits the final "X Attack, Y HP" stats from the description column
 * into separate columns.
 *
 * Usage:
 *   node scripts/split-stats.js your-cards.xlsx
 *
 * Output:
 *   your-cards-split.xlsx (with new columns added)
 *
 * Prerequisites:
 *   npm install xlsx
 *   (already installed if you have the TCG Card Maker)
 */

const XLSX = require('xlsx');
const path = require('path');

// --- Configuration ---
// Change this to match your column name that contains the stats at the end
const SOURCE_COLUMN = 'description';
// Names for the new columns
const ATTACK_COLUMN = 'attack';
const HP_COLUMN = 'hp';
const CLEAN_DESC_COLUMN = 'ability_text';

// --- Regex to match "X Attack, Y HP" at the end of a string ---
// Matches patterns like:
//   "1 Attack, 1 HP"
//   "3 Attack 4 HP"
//   "+2 Attack, +3 HP"
//   "10 Attack, 5 HP"
const STAT_PATTERN = /\s*[,.]?\s*(\+?\d+)\s*Attack[,\s]+(\+?\d+)\s*HP\s*$/i;

function splitStats(text) {
  if (!text || typeof text !== 'string') {
    return { cleanText: text || '', attack: '', hp: '' };
  }

  const match = text.match(STAT_PATTERN);
  if (match) {
    const cleanText = text.slice(0, match.index).trim();
    return {
      cleanText,
      attack: match[1],
      hp: match[2],
    };
  }

  return { cleanText: text, attack: '', hp: '' };
}

// --- Main ---
const inputFile = process.argv[2];
if (!inputFile) {
  console.log('Usage: node scripts/split-stats.js <excel-file>');
  console.log('Example: node scripts/split-stats.js my-cards.xlsx');
  process.exit(1);
}

console.log(`Reading: ${inputFile}`);
const wb = XLSX.readFile(inputFile);
const sheetName = wb.SheetNames[0];
const data = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);

console.log(`Found ${data.length} rows in sheet "${sheetName}"`);
console.log(`Source column: "${SOURCE_COLUMN}"`);
console.log('');

// Check if column exists
if (data.length > 0 && !(SOURCE_COLUMN in data[0])) {
  console.log(`Column "${SOURCE_COLUMN}" not found!`);
  console.log(`Available columns: ${Object.keys(data[0]).join(', ')}`);
  console.log(
    `\nEdit the SOURCE_COLUMN variable at the top of this script to match your column name.`
  );
  process.exit(1);
}

// Process each row
let splitCount = 0;
const newData = data.map((row, i) => {
  const original = String(row[SOURCE_COLUMN] || '');
  const { cleanText, attack, hp } = splitStats(original);

  if (attack || hp) {
    splitCount++;
    if (i < 3) {
      // Show first 3 examples
      console.log(`Row ${i + 1}:`);
      console.log(`  Original:  "${original}"`);
      console.log(`  Cleaned:   "${cleanText}"`);
      console.log(`  Attack: ${attack}, HP: ${hp}`);
      console.log('');
    }
  }

  return {
    ...row,
    [CLEAN_DESC_COLUMN]: cleanText,
    [ATTACK_COLUMN]: attack,
    [HP_COLUMN]: hp,
  };
});

if (splitCount === 0) {
  console.log('No stats found to split. Check the pattern matches your data.');
  console.log('Expected pattern: "... X Attack, Y HP" at end of text');
} else {
  console.log(`Split stats from ${splitCount} / ${data.length} rows`);
}

// Write output
const ext = path.extname(inputFile);
const base = path.basename(inputFile, ext);
const dir = path.dirname(inputFile);
const outputFile = path.join(dir, `${base}-split${ext}`);

const newSheet = XLSX.utils.json_to_sheet(newData);
const newWb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(newWb, newSheet, sheetName);
XLSX.writeFile(newWb, outputFile);

console.log(`\nSaved: ${outputFile}`);
console.log(`New columns added: "${CLEAN_DESC_COLUMN}", "${ATTACK_COLUMN}", "${HP_COLUMN}"`);
