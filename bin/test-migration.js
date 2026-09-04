// Isolated test of newWorkspaceShortcuts._migrateLegacySettings().
// Uses a keyfile GSettings backend, so dconf is never touched.
const { Gio, GLib } = imports.gi;

const SCHEMA_DIR = '/var/home/barnabas/Projects/Github/barnscott/newworkspaceshortcut-barnix.io/newworkspaceshortcut@barnix.io/schemas';
const SCHEMA_ID  = 'org.gnome.shell.extensions.newworkspaceshortcut';
const PATH       = '/org/gnome/shell/extensions/newworkspaceshortcut/';
const KF         = '/var/home/barnabas/Projects/Github/barnscott/newworkspaceshortcut-barnix.io/.tmp/test-settings.keyfile';

const source = Gio.SettingsSchemaSource.new_from_directory(
  SCHEMA_DIR, Gio.SettingsSchemaSource.get_default(), true);
const schema = source.lookup(SCHEMA_ID, false);
if (!schema) throw new Error('schema not found — did glib-compile-schemas run?');

function fresh() {
  GLib.unlink(KF);
  // root_group must be non-null: with NULL, keys directly below root_path
  // are not writable and every set_boolean() is silently dropped.
  const backend = Gio.keyfile_settings_backend_new(KF, PATH, 'newworkspaceshortcut');
  const s = Gio.Settings.new_full(schema, backend, PATH);
  if (!s.is_writable('winman-toggle') || !s.is_writable('tiler-toggle'))
    throw new Error('backend is not writable — test harness is broken, results would be meaningless');
  return s;
}

// ---- the exact logic from extension.js, verbatim ----
function migrate(settings) {
  if (settings.get_user_value('winman-toggle') !== null) return 'SKIP (winman-toggle has a user value)';
  if (!settings.get_boolean('tiler-toggle'))            return 'SKIP (tiler-toggle is false)';
  settings.set_boolean('winman-toggle', true);
  settings.reset('tiler-toggle');
  return 'MIGRATE';
}

let failures = 0;
function check(label, actual, expected) {
  const ok = String(actual) === String(expected);
  if (!ok) failures++;
  print(`   ${ok ? 'PASS' : 'FAIL'}  ${label}: ${actual}${ok ? '' : `  (expected ${expected})`}`);
}
const userVal = s => s.get_user_value('winman-toggle') === null ? 'null' : 'set';

print('\n=== A: legacy user — tiler-toggle=true, winman-toggle never set ===');
{
  const s = fresh();
  s.set_boolean('tiler-toggle', true);
  check('precondition winman user value', userVal(s), 'null');
  check('result', migrate(s), 'MIGRATE');
  check('winman-toggle', s.get_boolean('winman-toggle'), 'true');
  check('tiler-toggle reset to default', s.get_boolean('tiler-toggle'), 'false');
  check('tiler user value cleared', s.get_user_value('tiler-toggle') === null, 'true');
}

print('\n=== B: user deliberately turned Window Manager OFF ===');
{
  const s = fresh();
  s.set_boolean('winman-toggle', false);   // explicit user choice
  s.set_boolean('tiler-toggle', true);     // stale legacy value
  check('result', migrate(s), 'SKIP (winman-toggle has a user value)');
  check('winman-toggle stays false', s.get_boolean('winman-toggle'), 'false');
}

print('\n=== C: idempotency — migrate twice ===');
{
  const s = fresh();
  s.set_boolean('tiler-toggle', true);
  check('first run', migrate(s), 'MIGRATE');
  check('second run', migrate(s), 'SKIP (winman-toggle has a user value)');
  check('third run', migrate(s), 'SKIP (winman-toggle has a user value)');
  check('winman-toggle still true', s.get_boolean('winman-toggle'), 'true');
}

print('\n=== D: fresh install — neither key ever set ===');
{
  const s = fresh();
  check('result', migrate(s), 'SKIP (tiler-toggle is false)');
  check('winman-toggle untouched (still default)', s.get_boolean('winman-toggle'), 'false');
  check('no user value written', userVal(s), 'null');
}

print('\n=== E: legacy user who had the Tiler explicitly OFF ===');
{
  const s = fresh();
  s.set_boolean('tiler-toggle', false);
  check('result', migrate(s), 'SKIP (tiler-toggle is false)');
  check('winman-toggle stays false', s.get_boolean('winman-toggle'), 'false');
}

print('\n=== F: user turns it back off AFTER a migration ===');
{
  const s = fresh();
  s.set_boolean('tiler-toggle', true);
  migrate(s);
  s.set_boolean('winman-toggle', false);   // user opts out post-migration
  s.set_boolean('tiler-toggle', true);     // pretend the legacy key came back
  check('does not re-enable', migrate(s), 'SKIP (winman-toggle has a user value)');
  check('winman-toggle stays false', s.get_boolean('winman-toggle'), 'false');
}

GLib.unlink(KF);
print(`\n${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'}\n`);
if (failures) imports.system.exit(1);
