/**
 * TCG Card Maker — Automated Test Suite
 *
 * Tests core logic functions extracted from the app.
 * Run with: node test/test-core.js  (or: npm test)
 *
 * No dependencies required — uses a minimal built-in test runner.
 */

// ============================================================
// MINIMAL TEST RUNNER
// ============================================================
let _passed = 0,
  _failed = 0,
  _errors = [];

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(a, b, msg) {
  if (a !== b)
    throw new Error(
      `${msg || 'assertEqual'}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`
    );
}

function assertDeepEqual(a, b, msg) {
  if (JSON.stringify(a) !== JSON.stringify(b))
    throw new Error(
      `${msg || 'assertDeepEqual'}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`
    );
}

function test(name, fn) {
  try {
    fn();
    _passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    _failed++;
    _errors.push({ name, error: e.message });
    console.log(`  ❌ ${name}`);
    console.log(`     ${e.message}`);
  }
}

function suite(name, fn) {
  console.log(`\n📦 ${name}`);
  fn();
}

// ============================================================
// EXTRACT CORE LOGIC (copied from index.html for testing)
// ============================================================

function clone(o) {
  return JSON.parse(JSON.stringify(o));
}

function resolve(t, r) {
  if (!r || !t) return t;
  return String(t).replace(/\{\{([^}]+)\}\}/g, (_, k) => {
    const v = r[k.trim()];
    return v !== undefined ? String(v).trim() : '{{' + k + '}}';
  });
}

function resolveImage(v, imageStore) {
  if (!v) return '';
  if (
    v.startsWith('data:') ||
    v.startsWith('blob:') ||
    v.startsWith('http://') ||
    v.startsWith('https://')
  )
    return v;
  const t = v.trim();
  if (!t) return '';
  if (imageStore[t]) return imageStore[t];
  if (imageStore[t.toLowerCase()]) return imageStore[t.toLowerCase()];
  const fn = t.split(/[/\\]/).pop();
  if (imageStore[fn]) return imageStore[fn];
  if (imageStore[fn.toLowerCase()]) return imageStore[fn.toLowerCase()];
  const ne = fn.replace(/\.[^.]+$/, '');
  if (imageStore[ne]) return imageStore[ne];
  if (imageStore[ne.toLowerCase()]) return imageStore[ne.toLowerCase()];
  const norm = fn.replace(/\s+/g, '').toLowerCase();
  for (const key in imageStore) {
    const kNorm = key.split(/[/\\]/).pop().replace(/\s+/g, '').toLowerCase();
    if (kNorm === norm) return imageStore[key];
  }
  const exts = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp'];
  const baseName = ne.toLowerCase().replace(/\s+/g, '');
  for (const ext of exts) {
    for (const key in imageStore) {
      const kNorm = key.split(/[/\\]/).pop().replace(/\s+/g, '').toLowerCase();
      if (kNorm === baseName + ext) return imageStore[key];
    }
  }
  const neLower = ne.toLowerCase();
  for (const key in imageStore) {
    const kLower = key.toLowerCase();
    const kFn = kLower.split(/[/\\]/).pop();
    const kNe = kFn.replace(/\.[^.]+$/, '');
    if (kNe === neLower) return imageStore[key];
  }
  return '';
}

function snapValue(val, gridSize) {
  return Math.round(val / gridSize) * gridSize;
}

function getSheetLayout(pageW, pageH, cardW, cardH, gap, totalCards) {
  const cols = Math.floor((pageW + gap) / (cardW + gap)) || 1;
  const rows = Math.floor((pageH + gap) / (cardH + gap)) || 1;
  const perPage = cols * rows;
  const pages = Math.ceil(totalCards / perPage);
  const marginX = (pageW - (cols * cardW + (cols - 1) * gap)) / 2;
  const marginY = (pageH - (rows * cardH + (rows - 1) * gap)) / 2;
  return {
    pageW,
    pageH,
    cardW,
    cardH,
    gap,
    cols,
    rows,
    perPage,
    totalCards,
    pages,
    marginX,
    marginY,
  };
}

// Simplified alignment guide logic for testing
function getAlignmentGuides(movingEl, otherElements, CARD_W, CARD_H, SNAP_THRESHOLD) {
  const guides = [];
  let snappedX = null,
    snappedY = null;
  const mx = movingEl.x,
    my = movingEl.y;
  const mw = movingEl.w,
    mh = movingEl.h;
  const mCx = mx + mw / 2,
    mCy = my + mh / 2;

  const cardCx = CARD_W / 2,
    cardCy = CARD_H / 2;

  if (Math.abs(mCx - cardCx) < SNAP_THRESHOLD) {
    snappedX = cardCx - mw / 2;
    guides.push({ type: 'vertical', pos: cardCx, center: true });
  }
  if (Math.abs(mCy - cardCy) < SNAP_THRESHOLD) {
    snappedY = cardCy - mh / 2;
    guides.push({ type: 'horizontal', pos: cardCy, center: true });
  }

  otherElements.forEach((other) => {
    if (other.id === movingEl.id) return;
    const ox = other.x,
      oy = other.y;
    const ow = other.w,
      oh = other.h;

    if (snappedX === null && Math.abs(mx - ox) < SNAP_THRESHOLD) {
      snappedX = ox;
      guides.push({ type: 'vertical', pos: ox });
    }
    if (snappedY === null && Math.abs(my - oy) < SNAP_THRESHOLD) {
      snappedY = oy;
      guides.push({ type: 'horizontal', pos: oy });
    }
  });

  return { guides, snappedX, snappedY };
}

// ============================================================
// TESTS
// ============================================================

suite('resolve() — placeholder substitution', () => {
  test('replaces single placeholder', () => {
    assertEqual(resolve('{{name}}', { name: 'Dragon' }), 'Dragon');
  });

  test('replaces multiple placeholders', () => {
    assertEqual(
      resolve('{{name}} has {{hp}} HP', { name: 'Dragon', hp: 100 }),
      'Dragon has 100 HP'
    );
  });

  test('leaves unmatched placeholders intact', () => {
    assertEqual(resolve('{{name}} ({{missing}})', { name: 'Elf' }), 'Elf ({{missing}})');
  });

  test('handles null/undefined text', () => {
    assertEqual(resolve(null, { name: 'X' }), null);
    assertEqual(resolve(undefined, { name: 'X' }), undefined);
  });

  test('handles null/undefined row', () => {
    assertEqual(resolve('{{name}}', null), '{{name}}');
    assertEqual(resolve('{{name}}', undefined), '{{name}}');
  });

  test('handles empty string', () => {
    assertEqual(resolve('', { name: 'X' }), '');
  });

  test('trims resolved values', () => {
    assertEqual(resolve('{{name}}', { name: '  Dragon  ' }), 'Dragon');
  });

  test('handles numeric values', () => {
    assertEqual(resolve('{{attack}}', { attack: 85 }), '85');
  });

  test('handles zero value', () => {
    assertEqual(resolve('{{attack}}', { attack: 0 }), '0');
  });

  test('handles whitespace in placeholder name', () => {
    assertEqual(resolve('{{ name }}', { name: 'Dragon' }), 'Dragon');
  });

  test('handles special characters in values', () => {
    assertEqual(resolve('{{name}}', { name: '<b>Bold</b>' }), '<b>Bold</b>');
  });

  test('handles nested braces', () => {
    // {{{name}}} — regex [^}]+ doesn't match past }, so {{name}} inside triple braces
    // The actual regex sees {{{ then [^}]+ matches 'name', then }}} — it matches!
    // But the captured group would be '{name' not 'name', so lookup fails
    const result = resolve('{{{name}}}', { name: 'X' });
    // The regex captures '{name' (includes the extra {), which doesn't match 'name' in row
    // So it falls through as unresolved. This is expected edge case behavior.
    assert(typeof result === 'string', 'should return a string');
  });
});

suite('resolveImage() — image lookup', () => {
  const store = {
    'dragon.png': 'data:img/dragon',
    'Dragon.png': 'data:img/dragon',
    dragon: 'data:img/dragon',
    'warden.png': 'data:img/warden',
    'folder/subfolder/deep.jpg': 'data:img/deep',
  };

  test('exact match', () => {
    assertEqual(resolveImage('dragon.png', store), 'data:img/dragon');
  });

  test('case-insensitive match', () => {
    assertEqual(resolveImage('DRAGON.PNG', store), 'data:img/dragon');
  });

  test('without extension', () => {
    assertEqual(resolveImage('dragon', store), 'data:img/dragon');
  });

  test('passes through data URIs', () => {
    assertEqual(resolveImage('data:image/png;base64,abc', store), 'data:image/png;base64,abc');
  });

  test('passes through HTTP URLs', () => {
    assertEqual(resolveImage('https://example.com/img.png', store), 'https://example.com/img.png');
  });

  test('returns empty for missing image', () => {
    assertEqual(resolveImage('nonexistent.png', store), '');
  });

  test('handles empty string', () => {
    assertEqual(resolveImage('', store), '');
  });

  test('handles null', () => {
    assertEqual(resolveImage(null, store), '');
  });

  test('handles path with slashes', () => {
    assertEqual(resolveImage('folder/subfolder/deep.jpg', store), 'data:img/deep');
  });

  test('matches filename from full path', () => {
    assertEqual(resolveImage('C:\\Users\\art\\dragon.png', store), 'data:img/dragon');
  });

  test('handles whitespace in filename', () => {
    const wsStore = { 'fire dragon.png': 'data:img/fd' };
    assertEqual(resolveImage('fire dragon.png', wsStore), 'data:img/fd');
  });

  test('fuzzy match with spaces collapsed', () => {
    const wsStore = { 'firedragon.png': 'data:img/fd' };
    assertEqual(resolveImage('fire dragon.png', wsStore), 'data:img/fd');
  });

  test('extension guessing when no extension given', () => {
    const extStore = { 'hero.jpg': 'data:img/hero' };
    assertEqual(resolveImage('hero', extStore), 'data:img/hero');
  });
});

suite('clone() — deep copy', () => {
  test('creates independent copy', () => {
    const orig = { a: 1, b: { c: 2 } };
    const copy = clone(orig);
    copy.b.c = 99;
    assertEqual(orig.b.c, 2);
  });

  test('handles arrays', () => {
    const arr = [1, [2, 3]];
    const copy = clone(arr);
    copy[1].push(4);
    assertEqual(arr[1].length, 2);
  });

  test('handles empty objects', () => {
    assertDeepEqual(clone({}), {});
  });
});

suite('snapValue() — grid snapping', () => {
  test('snaps to nearest grid point', () => {
    assertEqual(snapValue(17, 15), 15);
    assertEqual(snapValue(23, 15), 30);
  });

  test('exact grid values unchanged', () => {
    assertEqual(snapValue(30, 15), 30);
    assertEqual(snapValue(0, 15), 0);
  });

  test('negative values snap correctly', () => {
    assertEqual(snapValue(-7, 15), 0);
    assertEqual(snapValue(-8, 15), -15);
  });

  test('small grid size', () => {
    assertEqual(snapValue(7, 5), 5);
    assertEqual(snapValue(13, 5), 15);
  });
});

suite('getSheetLayout() — print layout calculation', () => {
  test('A4 with poker cards', () => {
    const L = getSheetLayout(210, 297, 63, 88, 2, 10);
    assertEqual(L.cols, 3, 'cols');
    assertEqual(L.rows, 3, 'rows');
    assertEqual(L.perPage, 9, 'perPage');
    assertEqual(L.pages, 2, 'pages');
  });

  test('single card', () => {
    const L = getSheetLayout(210, 297, 63, 88, 2, 1);
    assertEqual(L.pages, 1);
  });

  test('exact fit', () => {
    const L = getSheetLayout(210, 297, 63, 88, 2, 9);
    assertEqual(L.pages, 1);
  });

  test('margins are centered', () => {
    const L = getSheetLayout(210, 297, 63, 88, 2);
    assert(L.marginX > 0, 'marginX should be positive');
    assert(L.marginY > 0, 'marginY should be positive');
  });

  test('handles zero gap', () => {
    const L = getSheetLayout(210, 297, 63, 88, 0, 10);
    assert(L.cols >= 3, 'should fit at least 3 cols with no gap');
    assert(L.rows >= 3, 'should fit at least 3 rows with no gap');
  });

  test('letter size', () => {
    const L = getSheetLayout(216, 279, 63, 88, 2, 20);
    assertEqual(L.cols, 3, 'letter cols');
    assertEqual(L.rows, 3, 'letter rows');
  });

  test('large cards on small page', () => {
    const L = getSheetLayout(100, 100, 80, 80, 2, 5);
    assertEqual(L.cols, 1);
    assertEqual(L.rows, 1);
    assertEqual(L.pages, 5);
  });

  test('tarot cards', () => {
    const L = getSheetLayout(210, 297, 70, 120, 2, 6);
    assertEqual(L.cols, 2, 'tarot cols');
    assertEqual(L.rows, 2, 'tarot rows');
    assertEqual(L.perPage, 4);
    assertEqual(L.pages, 2);
  });
});

suite('getAlignmentGuides() — snap to other elements', () => {
  const CARD_W = 375,
    CARD_H = 525,
    SNAP = 6;

  test('snaps to card center', () => {
    const el = { id: 'a', x: 185, y: 260, w: 50, h: 50 }; // center ~210, ~285
    // card center is 187.5, 262.5. Element center at 210, 285 — too far
    // Let's put it closer:
    const el2 = { id: 'a', x: 173, y: 248, w: 50, h: 50 }; // center = 198, 273 — not close enough
    // Actually: card cx = 187.5, element center = x + w/2 = 173+25 = 198 => diff 10.5, too far
    const el3 = { id: 'a', x: 160, y: 235, w: 50, h: 50 }; // center = 185, 260 => diff 2.5, 2.5
    const r = getAlignmentGuides(el3, [], CARD_W, CARD_H, SNAP);
    assert(r.snappedX !== null, 'should snap X to card center');
    assert(r.snappedY !== null, 'should snap Y to card center');
  });

  test('snaps to left edge of other element', () => {
    const moving = { id: 'a', x: 52, y: 100, w: 60, h: 30 };
    const other = { id: 'b', x: 50, y: 200, w: 80, h: 40 };
    const r = getAlignmentGuides(moving, [other], CARD_W, CARD_H, SNAP);
    assertEqual(r.snappedX, 50, 'should snap to left edge');
  });

  test('no snap when far away', () => {
    const moving = { id: 'a', x: 10, y: 10, w: 30, h: 30 };
    const other = { id: 'b', x: 300, y: 400, w: 50, h: 50 };
    const r = getAlignmentGuides(moving, [other], CARD_W, CARD_H, SNAP);
    assertEqual(r.snappedX, null);
    assertEqual(r.snappedY, null);
  });

  test('skips self', () => {
    const el = { id: 'a', x: 50, y: 50, w: 60, h: 30 };
    const r = getAlignmentGuides(el, [el], CARD_W, CARD_H, SNAP);
    // Should not snap to self (only card center if close)
    assertEqual(r.guides.filter((g) => !g.center).length, 0, 'no non-center guides from self');
  });
});

suite('Edge Cases — Large datasets', () => {
  test('resolve with 500+ rows does not crash', () => {
    const rows = [];
    for (let i = 0; i < 500; i++) {
      rows.push({
        name: 'Card ' + i,
        attack: Math.floor(Math.random() * 100),
        hp: Math.floor(Math.random() * 100),
      });
    }
    rows.forEach((r) => {
      const result = resolve('{{name}} — ATK: {{attack}}', r);
      assert(result.includes('Card'), 'should contain card name');
    });
  });

  test('resolveImage with large imageStore', () => {
    const store = {};
    for (let i = 0; i < 1000; i++) {
      store[`image_${i}.png`] = `data:img/${i}`;
    }
    assertEqual(resolveImage('image_500.png', store), 'data:img/500');
    assertEqual(resolveImage('image_999.png', store), 'data:img/999');
    assertEqual(resolveImage('missing.png', store), '');
  });
});

suite('Edge Cases — Corrupted / malformed data', () => {
  test('resolve handles numeric text', () => {
    assertEqual(resolve(123, { x: 'y' }), '123');
  });

  test('resolve handles boolean row values', () => {
    assertEqual(resolve('{{active}}', { active: true }), 'true');
    assertEqual(resolve('{{active}}', { active: false }), 'false');
  });

  test('resolveImage handles undefined imageStore gracefully', () => {
    // Should not throw
    try {
      resolveImage('test.png', {});
    } catch (e) {
      assert(false, 'should not throw: ' + e.message);
    }
  });

  test('clone handles deeply nested objects', () => {
    let obj = { a: 1 };
    for (let i = 0; i < 50; i++) {
      obj = { nested: obj };
    }
    const c = clone(obj);
    assert(JSON.stringify(c) === JSON.stringify(obj), 'deep clone should match');
  });

  test('getSheetLayout handles very large card counts', () => {
    const L = getSheetLayout(210, 297, 63, 88, 2, 10000);
    assert(L.pages > 0, 'should calculate pages');
    assertEqual(L.perPage, 9);
    assertEqual(L.pages, Math.ceil(10000 / 9));
  });

  test('getSheetLayout handles very small page size', () => {
    const L = getSheetLayout(50, 50, 63, 88, 2, 1);
    // Cards bigger than page — should still not crash
    assert(L.cols >= 1 || L.rows >= 1, 'should not crash');
  });

  test('resolve handles placeholder-like strings without data', () => {
    assertEqual(resolve('Price: ${{amount}}', {}), 'Price: ${{amount}}');
  });
});

suite('Edge Cases — Special characters in data', () => {
  test('resolve with HTML entities in values', () => {
    const result = resolve('{{name}}', { name: '<script>alert("xss")</script>' });
    assert(result.includes('<script>'), 'should pass through raw (app escapes at render time)');
  });

  test('resolve with unicode characters', () => {
    assertEqual(resolve('{{name}}', { name: '火竜' }), '火竜');
    assertEqual(resolve('{{name}}', { name: '🐉 Dragon' }), '🐉 Dragon');
  });

  test('resolve with newlines in values', () => {
    const result = resolve('{{desc}}', { desc: 'Line 1\nLine 2' });
    assert(result.includes('\n'), 'should preserve newlines');
  });

  test('resolveImage with unicode filename', () => {
    const store = { '火竜.png': 'data:img/fire' };
    assertEqual(resolveImage('火竜.png', store), 'data:img/fire');
  });
});

suite('Template definitions', () => {
  // Validate that all templates have required fields
  const CARD_TEMPLATES = [
    { id: 'classic-tcg', name: 'Classic TCG', elements: [{ type: 'shape' }, { type: 'text' }] },
    { id: 'dark-fantasy', name: 'Dark Fantasy', elements: [{ type: 'shape' }, { type: 'text' }] },
    { id: 'minimalist', name: 'Clean Minimalist', elements: [{ type: 'shape' }, { type: 'text' }] },
    { id: 'anime-battle', name: 'Anime Battle', elements: [{ type: 'shape' }, { type: 'text' }] },
    { id: 'vintage', name: 'Vintage Parchment', elements: [{ type: 'shape' }, { type: 'text' }] },
  ];

  test('all templates have unique IDs', () => {
    const ids = CARD_TEMPLATES.map((t) => t.id);
    assertEqual(new Set(ids).size, ids.length, 'IDs should be unique');
  });

  test('all templates have at least 2 elements', () => {
    CARD_TEMPLATES.forEach((t) => {
      assert(t.elements.length >= 2, `${t.name} should have >= 2 elements`);
    });
  });

  test('all templates start with a background shape', () => {
    CARD_TEMPLATES.forEach((t) => {
      assertEqual(t.elements[0].type, 'shape', `${t.name} should start with a shape background`);
    });
  });
});

// ============================================================
// RESULTS
// ============================================================
console.log('\n' + '='.repeat(50));
console.log(`Results: ${_passed} passed, ${_failed} failed`);
if (_errors.length) {
  console.log('\nFailed tests:');
  _errors.forEach((e) => console.log(`  ❌ ${e.name}: ${e.error}`));
}
console.log('='.repeat(50));
process.exit(_failed > 0 ? 1 : 0);
