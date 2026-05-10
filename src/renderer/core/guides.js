(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.TCGCore = Object.assign(root.TCGCore || {}, api);
  }
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

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
    const mR = mx + mw,
      mB = my + mh;

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
      const oCx = ox + ow / 2,
        oCy = oy + oh / 2;
      const oR = ox + ow,
        oB = oy + oh;

      if (snappedX === null && Math.abs(mx - ox) < SNAP_THRESHOLD) {
        snappedX = ox;
        guides.push({ type: 'vertical', pos: ox });
      }
      if (snappedX === null && Math.abs(mR - oR) < SNAP_THRESHOLD) {
        snappedX = oR - mw;
        guides.push({ type: 'vertical', pos: oR });
      }
      if (snappedX === null && Math.abs(mx - oR) < SNAP_THRESHOLD) {
        snappedX = oR;
        guides.push({ type: 'vertical', pos: oR });
      }
      if (snappedX === null && Math.abs(mR - ox) < SNAP_THRESHOLD) {
        snappedX = ox - mw;
        guides.push({ type: 'vertical', pos: ox });
      }
      if (snappedX === null && Math.abs(mCx - oCx) < SNAP_THRESHOLD) {
        snappedX = oCx - mw / 2;
        guides.push({ type: 'vertical', pos: oCx, center: true });
      }

      if (snappedY === null && Math.abs(my - oy) < SNAP_THRESHOLD) {
        snappedY = oy;
        guides.push({ type: 'horizontal', pos: oy });
      }
      if (snappedY === null && Math.abs(mB - oB) < SNAP_THRESHOLD) {
        snappedY = oB - mh;
        guides.push({ type: 'horizontal', pos: oB });
      }
      if (snappedY === null && Math.abs(my - oB) < SNAP_THRESHOLD) {
        snappedY = oB;
        guides.push({ type: 'horizontal', pos: oB });
      }
      if (snappedY === null && Math.abs(mB - oy) < SNAP_THRESHOLD) {
        snappedY = oy - mh;
        guides.push({ type: 'horizontal', pos: oy });
      }
      if (snappedY === null && Math.abs(mCy - oCy) < SNAP_THRESHOLD) {
        snappedY = oCy - mh / 2;
        guides.push({ type: 'horizontal', pos: oCy, center: true });
      }
    });

    return { guides, snappedX, snappedY };
  }

  return { getAlignmentGuides };
});
