# TCG Card Maker

A desktop application for designing and batch-generating trading card game cards.

## Features

- **Visual Card Editor** — Drag, resize, and style card elements on a canvas
- **Element Library** — Save custom elements (flavour text boxes, stat blocks, etc.) and reuse them across projects
- **Data Binding** — Import Excel/CSV files and bind columns to card elements using `{{placeholder}}` syntax
- **Image Support** — Load local image folders and match filenames to data columns
- **Project Save/Load** — Save your work as `.tcg` project files
- **Batch Export** — Export all cards as individual PNG/JPG images at 1x, 2x, or 3x resolution
- **Full Typography** — 15 Google Fonts, adjustable size, weight, style, color, alignment, letter spacing

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)

### Setup

1. Open a terminal/command prompt in this folder

2. Install dependencies:

   ```
   npm install
   ```

3. Run the app:
   ```
   npm start
   ```

That's it! The app window will open.

## Usage

### Designing Cards

1. Click elements in the **Elements** tab to add them to the canvas
2. Drag to reposition, use corner/edge handles to resize
3. Edit properties in the right panel (fonts, colors, borders, etc.)
4. Use the **Layers** panel at the bottom-left to reorder or delete elements

### Data Binding

1. Switch to the **Data** tab
2. Click **Import Excel / CSV** to load your spreadsheet
3. Each row = one card. Column headers become placeholders
4. In the right panel, set an element's **Placeholder** to `{{column_name}}`
5. Use the arrow buttons to preview different cards
6. Upload images via **Folder** or **Files** buttons — filenames are auto-matched

### Element Library

1. Design a custom element (e.g. a styled flavour text box)
2. Select it on the canvas
3. Switch to the **Library** tab
4. Click **Save Selected to Library**
5. It persists across projects — click it anytime to add a copy

### Saving & Loading

- **Ctrl+S** — Quick save (or Save As if new)
- **File > Open** — Load a `.tcg` project file
- **File > Save As** — Save to a new location
- Project files store your template + imported data (not images)

### Batch Export

1. Click **Export Cards** in the title bar
2. Choose format (PNG/JPG) and scale (2x recommended)
3. Click **Choose Folder & Export**
4. All cards are rendered and saved as individual files

## Keyboard Shortcuts

| Shortcut           | Action                  |
| ------------------ | ----------------------- |
| Ctrl+Z             | Undo                    |
| Ctrl+Shift+Z       | Redo                    |
| Ctrl+S             | Save project            |
| Delete / Backspace | Delete selected element |

## Excel File Format

Your spreadsheet should have column headers in the first row:

| card_name    | description            | type | attack | defense | art_image  | flavour_text            |
| ------------ | ---------------------- | ---- | ------ | ------- | ---------- | ----------------------- |
| Fire Dragon  | A fierce dragon...     | Fire | 85     | 60      | dragon.png | "In the ember glow..."  |
| Frost Warden | An ancient guardian... | Ice  | 40     | 95      | warden.png | "The cold preserves..." |

- Column headers become placeholder names: `{{card_name}}`, `{{attack}}`, etc.
- Image columns should contain filenames matching your uploaded images
- Supports `.xlsx`, `.xls`, and `.csv` files

## Building an Installer / Portable EXE

To create a Windows installer + portable EXE (no install needed):

```
npm run build
```

This creates both a setup `.exe` installer AND a `TCG-Card-Maker-Portable.exe` in the `dist/` folder.

For just the portable EXE:

```
npm run build:portable
```

The portable EXE is a single file you can run from anywhere — no installation, no console, just double-click.

### Other Platforms

```
npm run build:mac      # macOS .dmg
npm run build:linux    # Linux AppImage
```

## Tech Stack

- **Electron** — Desktop app framework; card export uses Electron's native `capturePage` for pixel-perfect rendering (`src/main.js`)
- **SheetJS (`xlsx`)** — Excel/CSV parsing
- **Google Fonts** — Typography (15 fonts loaded from `fonts.googleapis.com`)

## Tests

```
npm test
```

Runs the dependency-free suite in `test/test-core.js` covering placeholder resolution, image lookup, grid snapping, sheet layout, and alignment guides.

## Helper Scripts

- **`scripts/split-stats.js`** — One-off CLI utility that splits a trailing `"X Attack, Y HP"` from a `description` column in a spreadsheet into separate `attack`/`hp`/`ability_text` columns. Run with `node scripts/split-stats.js your-cards.xlsx`.
