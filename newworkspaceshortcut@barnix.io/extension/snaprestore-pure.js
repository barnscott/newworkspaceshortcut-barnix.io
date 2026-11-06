// TEMPORARY: part of the GNOME 49–51 snap-restore workaround. Delete with
// extension/snaprestore.js. https://gitlab.gnome.org/GNOME/mutter/-/issues/4918

export function isUsableRect(rect) {
  return !!rect && rect.width > 0 && rect.height > 0;
}
