// TEMPORARY: part of the GNOME 49–51 snap-restore workaround. Delete with
// extension/snaprestore.js. https://gitlab.gnome.org/GNOME/mutter/-/issues/4918

export function isUsableRect(rect) {
  return !!rect && rect.width > 0 && rect.height > 0;
}

export function sameRect(a, b) {
  return !!a && !!b &&
    a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

// On a vertical maximize: only a side snap from a known floating rect. Later
// notifies keep the snapshot; mutter saves no rect from a tile.
export function takesSnapshot(maximizedH, hasSnapshot, hasRect) {
  return !maximizedH && !hasSnapshot && hasRect;
}

// A position replays only onto its own, unmoved monitor. A size-only repair
// takes its position from the pointer, so needs just the size.
export function canRepair(preSnap, monitorGeoNow, sizeOnly = false) {
  if (!preSnap || !isUsableRect(preSnap.rect)) return false;
  return sizeOnly || (preSnap.monitor >= 0 && preSnap.monitor === preSnap.tileMonitor &&
    sameRect(preSnap.monitorGeo, monitorGeoNow));
}
