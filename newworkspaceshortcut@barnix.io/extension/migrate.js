// Settings migrations. No Shell imports, so bin/test-migration.js can load it.

// Restores 'tiler-toggle', renamed to 'winman-toggle' in 471 with no migration.
// https://github.com/barnscott/newworkspaceshortcut-barnix.io/commit/a51294c
export function migrateLegacySettings(settings) {
  if (settings.get_user_value('winman-toggle') !== null)
    return false;
  if (!settings.get_boolean('tiler-toggle'))
    return false;
  settings.set_boolean('winman-toggle', true);
  settings.reset('tiler-toggle');
  return true;
}
