// Shared utilities for newworkspaceshortcut@barnix.io

/**
 * Returns the window that currently holds keyboard focus, or null if none.
 * @returns {Meta.Window|null}
 */
export function getFocusWin() {
  return global.display.focus_window;
}
