(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.TCGCore = Object.assign(root.TCGCore || {}, api);
  }
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

  function getSheetLayout(pageW, pageH, cardW, cardH, gap, totalCards) {
    const cols = Math.floor((pageW + gap) / (cardW + gap)) || 1;
    const rows = Math.floor((pageH + gap) / (cardH + gap)) || 1;
    const perPage = cols * rows;
    const total = totalCards !== null && totalCards !== undefined ? totalCards : 1;
    const pages = Math.ceil(total / perPage);
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
      total,
      totalCards: total,
      pages,
      marginX,
      marginY,
    };
  }

  return { getSheetLayout };
});
