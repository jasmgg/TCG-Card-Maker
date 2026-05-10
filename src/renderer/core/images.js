(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.TCGCore = Object.assign(root.TCGCore || {}, api);
  }
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

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

  return { resolveImage };
});
