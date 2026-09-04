// TEMPORARY: part of the GNOME 49/50 snap-restore workaround. Delete with
// extension/snaprestore.js. https://gitlab.gnome.org/GNOME/mutter/-/issues/4918

export function isUsableRect(rect) {
  return !!rect && rect.width > 0 && rect.height > 0;
}

// Only a side snap loses its geometry. A plain unmaximize restores correctly and
// applies mutter's deliberate 80%-of-work-area clamp, which we must not undo.
export function shouldRepair(wasSideTiled, cached) {
  return wasSideTiled === true && isUsableRect(cached);
}
