// TEMPORARY: part of the GNOME 49–51 snap-restore workaround. Delete with
// extension/snaprestore.js. https://gitlab.gnome.org/GNOME/mutter/-/issues/4918
import { sameRect } from './rect.js';

// Mutter's MAX_UNMAXIMIZED_WINDOW_AREA.
const MAX_UNMAXIMIZED_AREA = 0.8;

export function isUsableRect(rect) {
  return !!rect && rect.width > 0 && rect.height > 0;
}

// What one notify::maximized-vertically means. Only a side snap from floating
// loses mutter's saved rect.
export function onMaximizeNotify({ maximizedH, maximizedV }, { hasRect, hasSnapshot, mutterSaved }) {
  if (maximizedV) {
    // Mutter saves the rect correctly when maximizing a floating window.
    const saved = mutterSaved || (maximizedH && !hasSnapshot);
    return { snapshot: !maximizedH && !hasSnapshot && hasRect && !saved, repair: false, mutterSaved: saved };
  }
  // Still maximized horizontally: keep the snapshot for the final unmaximize.
  if (maximizedH) return { snapshot: false, repair: false, mutterSaved };
  return { snapshot: false, repair: hasSnapshot, mutterSaved: false };
}

// Not if moved to another monitor while snapped, or the rect's monitor changed.
// Size-only repairs need just the size.
export function canRepair(snap, rectMonitorGeoNow, sizeOnly = false) {
  if (!snap || !isUsableRect(snap.rect)) return false;
  if (sizeOnly) return true;
  return snap.monitor === snap.tileMonitor && snap.rectMonitor >= 0 &&
    sameRect(snap.rectMonitorGeo, rectMonitorGeoNow);
}

// Mutter shrinks an 'almost maximized' restore to 80% of the work area, keeping the aspect.
// https://gitlab.gnome.org/GNOME/mutter/-/blob/51.1/src/core/window.c#L3587
export function clampUnmaximized(rect, workArea) {
  if (rect.width * rect.height <= workArea.width * workArea.height * MAX_UNMAXIMIZED_AREA)
    return { ...rect };
  const k = Math.sqrt(MAX_UNMAXIMIZED_AREA);
  if (rect.width > rect.height) {
    const width = Math.trunc(workArea.width * k);
    return { ...rect, width, height: Math.trunc(width * (rect.height / rect.width)) };
  }
  const height = Math.trunc(workArea.height * k);
  return { ...rect, width: Math.trunc(height * (rect.width / rect.height)), height };
}
