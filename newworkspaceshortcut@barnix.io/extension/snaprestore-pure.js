// TEMPORARY: part of the GNOME 49–51 snap-restore workaround. Delete with
// extension/snaprestore.js. https://gitlab.gnome.org/GNOME/mutter/-/issues/4918

export function isUsableRect(rect) {
  return !!rect && rect.width > 0 && rect.height > 0;
}

export function sameRect(a, b) {
  return !!a && !!b &&
    a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

// Only a side snap from floating loses mutter's saved rect. A snap from a
// full maximize keeps it.
export function takesSnapshot(maximizedH, hasSnapshot, hasRect, mutterSaved) {
  return !maximizedH && !hasSnapshot && hasRect && !mutterSaved;
}

// Positions replay only onto their own, unmoved monitor. A size-only repair
// needs just the size.
export function canRepair(preSnap, monitorGeoNow, sizeOnly = false) {
  if (!preSnap || !isUsableRect(preSnap.rect)) return false;
  return sizeOnly || (preSnap.monitor >= 0 && preSnap.monitor === preSnap.tileMonitor &&
    sameRect(preSnap.monitorGeo, monitorGeoNow));
}
