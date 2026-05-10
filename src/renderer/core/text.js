(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.TCGCore = Object.assign(root.TCGCore || {}, api);
  }
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

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

  return { clone, resolve };
});
