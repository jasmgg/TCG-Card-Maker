(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.TCGCore = Object.assign(root.TCGCore || {}, api);
  }
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

  function snapValue(val, gridSize) {
    return Math.round(val / gridSize) * gridSize;
  }

  return { snapValue };
});
