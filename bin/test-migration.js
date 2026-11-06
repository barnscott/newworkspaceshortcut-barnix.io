// Tests extension/migrate.js, the code the extension runs, against a keyfile
// GSettings backend, so dconf is never touched. Run: gjs -m bin/test-migration.js
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import { exit } from 'system';
import { migrateLegacySettings as migrate } from '../newworkspaceshortcut@barnix.io/extension/migrate.js';

const SCHEMA_ID = 'org.gnome.shell.extensions.newworkspaceshortcut';
const PATH      = '/org/gnome/shell/extensions/newworkspaceshortcut/';

const binDir     = GLib.path_get_dirname(GLib.filename_from_uri(import.meta.url)[0]);
const schemaSrc  = GLib.build_filenamev([binDir, '..', 'newworkspaceshortcut@barnix.io', 'schemas']);
const tmpDir     = GLib.dir_make_tmp('nws-migration-XXXXXX');
const compiled   = GLib.build_filenamev([tmpDir, 'gschemas.compiled']);
const KF         = GLib.build_filenamev([tmpDir, 'test-settings.keyfile']);

function cleanup() {
  GLib.unlink(KF);
  GLib.unlink(compiled);
  GLib.rmdir(tmpDir);
}

// Compile into tmpDir so the gitignored repo output is neither needed nor written.
function loadSchema() {
  const proc = Gio.Subprocess.new(
    ['glib-compile-schemas', '--strict', `--targetdir=${tmpDir}`, schemaSrc],
    Gio.SubprocessFlags.STDERR_PIPE);
  const [, , stderr] = proc.communicate_utf8(null, null);
  if (!proc.get_successful())
    throw new Error(`glib-compile-schemas failed: ${stderr}`);
  const source = Gio.SettingsSchemaSource.new_from_directory(
    tmpDir, Gio.SettingsSchemaSource.get_default(), true);
  const schema = source.lookup(SCHEMA_ID, false);
  if (!schema) throw new Error(`schema ${SCHEMA_ID} not found in ${schemaSrc}`);
  return schema;
}

let schema;
try {
  schema = loadSchema();
} catch (e) {
  cleanup();
  printerr(e.message);
  exit(2);
}

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

let failures = 0;
function check(label, actual, expected) {
  const ok = String(actual) === String(expected);
  if (!ok) failures++;
  print(`   ${ok ? 'PASS' : 'FAIL'}  ${label}: ${actual}${ok ? '' : `  (expected ${expected})`}`);
}
const userVal = (s, key) => s.get_user_value(key) === null ? 'null' : 'set';

try {
  print('\n=== A: legacy user — tiler-toggle=true, winman-toggle never set ===');
  {
    const s = fresh();
    s.set_boolean('tiler-toggle', true);
    check('precondition winman user value', userVal(s, 'winman-toggle'), 'null');
    check('migrated', migrate(s), true);
    check('winman-toggle', s.get_boolean('winman-toggle'), true);
    check('tiler-toggle reset to default', s.get_boolean('tiler-toggle'), false);
    check('tiler user value cleared', userVal(s, 'tiler-toggle'), 'null');
  }

  print('\n=== B: user deliberately turned Window Manager OFF ===');
  {
    const s = fresh();
    s.set_boolean('winman-toggle', false);   // explicit user choice
    s.set_boolean('tiler-toggle', true);     // stale legacy value
    check('migrated', migrate(s), false);
    check('winman-toggle stays false', s.get_boolean('winman-toggle'), false);
    check('tiler-toggle left alone', s.get_boolean('tiler-toggle'), true);
  }

  print('\n=== C: idempotency — migrate twice ===');
  {
    const s = fresh();
    s.set_boolean('tiler-toggle', true);
    check('first run', migrate(s), true);
    check('second run', migrate(s), false);
    check('third run', migrate(s), false);
    check('winman-toggle still true', s.get_boolean('winman-toggle'), true);
  }

  print('\n=== D: fresh install — neither key ever set ===');
  {
    const s = fresh();
    check('migrated', migrate(s), false);
    check('winman-toggle untouched (still default)', s.get_boolean('winman-toggle'), false);
    check('no user value written', userVal(s, 'winman-toggle'), 'null');
  }

  print('\n=== E: legacy user who had the Tiler explicitly OFF ===');
  {
    const s = fresh();
    s.set_boolean('tiler-toggle', false);
    check('migrated', migrate(s), false);
    check('winman-toggle stays false', s.get_boolean('winman-toggle'), false);
    check('no winman user value written', userVal(s, 'winman-toggle'), 'null');
  }

  print('\n=== F: user turns it back off AFTER a migration ===');
  {
    const s = fresh();
    s.set_boolean('tiler-toggle', true);
    migrate(s);
    s.set_boolean('winman-toggle', false);   // user opts out post-migration
    s.set_boolean('tiler-toggle', true);     // pretend the legacy key came back
    check('does not re-enable', migrate(s), false);
    check('winman-toggle stays false', s.get_boolean('winman-toggle'), false);
  }
} catch (e) {
  failures++;
  printerr(`ERROR: ${e.message}`);
} finally {
  cleanup();
}

print(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}\n`);
if (failures) exit(1);
