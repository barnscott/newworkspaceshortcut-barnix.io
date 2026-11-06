// TEMPORARY: part of the GNOME 49–51 snap-restore workaround. Delete with
// extension/snaprestore.js. https://gitlab.gnome.org/GNOME/mutter/-/issues/4918

export function isUsableRect(rect) {
  return !!rect && rect.width > 0 && rect.height > 0;
}

export function sameRect(a, b) {
  return !!a && !!b &&
    a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

// A side snap maximizes vertically only. A full maximize, or another snap
// notify, keeps the existing snapshot: mutter saves no rect from a tile.
export function takesSnapshot(maximizedH, maximizedV, hasSnapshot) {
  return maximizedV && !maximizedH && !hasSnapshot;
}

// Replay only onto the monitor it was taken on, if that monitor has not moved.
export function canRepair(preSnap, monitorGeoNow) {
  return !!preSnap && isUsableRect(preSnap.rect) &&
    preSnap.monitor >= 0 && preSnap.monitor === preSnap.tileMonitor &&
    sameRect(preSnap.monitorGeo, monitorGeoNow);
}
