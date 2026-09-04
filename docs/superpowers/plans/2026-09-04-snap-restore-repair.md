# Snap-Restore Repair Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore a window's pre-snap geometry after `Super+Left` → `Super+Down` on GNOME 49/50, in a single self-contained file that can be deleted in one commit when Mutter fixes the upstream bug.

**Architecture:** A new `extension/snaprestore.js` module (plus a tiny import-free `snaprestore-pure.js` holding its one testable function) caches each focused window's frame rect while it is floating, and reapplies that rect inside a `BEFORE_REDRAW` later when the window transitions out of the maximized state. Everything lives in those two files plus a ~10-line seam in `extension.js`, one schema key, and one README paragraph.

**Tech Stack:** GJS / GNOME Shell 49–50 extension API, `Meta.Window` signals, `Meta.Laters`, GSettings.

**User decisions (already made):**
- "lets add feature for (B) approach" — the remember-and-repair strategy, not the maximize/unmaximize priming strategy.
- "implemented in a way that it is isolated code that is easy to remove when for future upgrades."
- "as much as possible, write the new code on a new isolated js file."
- "the top of the file should include a comment that this code is to overcome the related bug in gnome 49/50 and will be removed in future upgrades."
- "share for review before implementing" — this document is that review artifact. No code is written until it is approved.
- Ships inside **503** (retargeted from 504 after implementation, at the user's request).
- **D1** — `snap-restore-fix` defaults to **on**. The version gate already keeps it inert outside 49/50.
- **D2** — `AFFECTED_MAJORS = [49, 50]`; the module **auto-expires on GNOME 51**. If the bug outlives 50, bump the array.
- **D3** — the toggle **gets a Preferences row**. Chosen over gsettings-only; removal is five steps instead of four.

---

## 1. Problem, in one paragraph

`meta_window_tile_internal()` commits the tile mode to the window config (`window.c:3298`) *before* calling `meta_window_maximize_internal()` (`:3324`). The keyboard entry point passes `saved_rect = NULL` (`:3356`), so maximize falls through to the `save_rect` vfunc, and both backends bail on `if (!meta_window_config_is_floating (config)) return;` (`window-x11.c:2052`, `meta-window-wayland.c:1094`) because a tile mode is now set (`meta-window-config.c:347,357`). The pre-tile geometry is never recorded, and `Super+Down` replays a stale `saved_rect`. Upstream: [mutter#4918](https://gitlab.gnome.org/GNOME/mutter/-/issues/4918), [mutter#4481](https://gitlab.gnome.org/GNOME/mutter/-/issues/4481). Present 49.1 → 50.x, both X11 and Wayland backends.

`saved_rect` is private and not introspectable, so the extension cannot write it. It can only observe the bad restore and correct it.

## 2. Why the correction is not reverted

This was the reason to reject an extension-side fix in the original investigation, and it turned out to be wrong. Verified in 50.4 source:

- `window.c:3476` — `if (unmaximize_vertically) meta_window_config_set_tile_mode (window->config, META_TILE_NONE);` runs **before** the final move_resize.
- `constraints.c` — `constrain_tiling()` opens with `if (!meta_window_is_tiled_side_by_side (window)) return TRUE;`

By the time the restore completes, tile mode is `NONE`, so the tiling constraint exits early and a subsequent `move_resize_frame()` sticks. [mutter#2407](https://gitlab.gnome.org/GNOME/mutter/-/issues/2407) only applies while the window is still tiled.

## 3. Design

### 3.1 Module surface

`extension/snaprestore.js` exports one class, mirroring the shape of `highlight.js` and `focus.js` so the seam in `extension.js` looks like its neighbours:

| Member | Purpose |
| --- | --- |
| `constructor(settings)` | Store settings, initialise empty state. No signals. |
| `static isAffected()` | Version gate. `true` only on the shell majors listed in `AFFECTED_MAJORS`. |
| `enable()` | Connect `notify::focus-window`; begin tracking the current window. |
| `disable()` | Disconnect everything, remove any pending later, drop caches. |

### 3.2 Algorithm

1. **Track one window at a time.** On `notify::focus-window`, disconnect the previous window's handlers and connect the new one's: `size-changed`, `position-changed`, `notify::maximized-vertically`, `unmanaged`. Tiling and restoring both happen to the focused window, so tracking only that window is sufficient and keeps the bookkeeping small.
2. **Cache while floating.** On `size-changed` / `position-changed`, if the window is floating (`!is_fullscreen() && !maximized_horizontally && !maximized_vertically`), store `{rect, monitor}` in a `WeakMap` keyed by the window. The cache survives focus changes; only the signal connections move.
3. **Detect the restore.** On `notify::maximized-vertically`, if the property is now `false`, schedule a repair. If it is now `true`, do nothing — the cache already holds the pre-tile rect.
4. **Repair in the same frame.** `global.compositor.get_laters().add(Meta.LaterType.BEFORE_REDRAW, …)` — the idiom GNOME Shell itself uses at `windowManager.js:335`. In the callback, re-check state, compare rects, and call `move_resize_frame()` if they differ.

### 3.3 Why cache continuously rather than read at transition time

It is tempting to read `get_frame_rect()` inside the `notify::maximized-vertically` → `true` handler. Don't. That notify is emitted from inside `meta_window_maximize_internal()`, between the flag mutation and the final `move_resize` — the half-committed state where `get_frame_rect()` is documented (in this project's own 503 comment) as returning neither the old nor the new rect. Continuous caching from `size-changed` / `position-changed` avoids depending on mid-transition read semantics entirely.

### 3.4 The decision is a pure function, in its own file

`needsRepair(cached, current)` takes two plain rects and returns a boolean. No `Meta` types, no globals. This makes the only non-trivial logic headlessly testable with `gjs`, the same way `_migrateLegacySettings` was tested in 503.

Verified: plain `gjs` **cannot** import `resource:///org/gnome/shell/misc/config.js` (`The resource ... does not exist`). Since `snaprestore.js` needs that import for its version gate, the test cannot import `snaprestore.js`. The pure logic therefore lives in `extension/snaprestore-pure.js`, which has **no imports at all** — `snaprestore.js` imports it, and so does the test. Both files are deleted together.

Rules:
- `false` if `cached` is missing, or `cached.width <= 0`, or `cached.height <= 0` (never restore to a degenerate rect).
- `false` if both `|cached.width - current.width| <= TOLERANCE_PX` and `|cached.height - current.height| <= TOLERANCE_PX`.
- `true` otherwise.

`TOLERANCE_PX = 2`, to avoid fighting rounding and to make the drag-snap path (which already restores correctly) a no-op.

### 3.5 Guards

| Guard | Reason |
| --- | --- |
| `_repairing` flag around `move_resize_frame()` | Our own repair emits `size-changed`; without the flag we would re-enter the cache path during a repair. |
| Monitor equality check | A window moved to another monitor while tiled must not be restored to coordinates on the old one. |
| Re-check floating state inside the later | The window may have been re-tiled or closed between scheduling and the redraw. |
| `unmanaged` handler | Drop the window's handlers promptly rather than waiting for the next focus change. |
| `WeakMap` for the rect cache | No manual eviction, no leak of closed windows. |

### 3.6 Removal procedure

Written into the file header so a future maintainer does not have to reconstruct it:

1. Delete `extension/snaprestore.js` and `extension/snaprestore-pure.js`.
2. Delete the four seam blocks in `extension.js` (import, construct+enable, changed-handler, disable).
3. Delete the three-line `// snapRestore:` block in `prefs.js`.
4. Delete the `snap-restore-fix` key from the schema; recompile.
5. Delete the "Known upstream issue" paragraph in `README.md`.

Every touch point outside the two module files carries a `// snapRestore: remove with extension/snaprestore.js` marker, so `grep -rn 'snapRestore:' ` finds all of them. No other code references the module.

## 4. File structure

| File | Change | Responsibility |
| --- | --- | --- |
| `extension/snaprestore-pure.js` | **create** | `needsRepair` + `TOLERANCE_PX`. No imports, so it is testable headlessly. ~15 lines. |
| `extension/snaprestore.js` | **create** | Caching, detection, repair, version gate. Imports the pure module. ~100 lines. |
| `extension.js` | modify | Seam only: import, construct, gate, toggle handler, teardown. |
| `schemas/org.gnome.shell.extensions.newworkspaceshortcut.gschema.xml` | modify | One boolean key, `snap-restore-fix`. |
| `tests/test-snaprestore.js` | **create** | Headless `gjs` test of `needsRepair`. |
| `prefs.js` | modify | One group + one switch row on the Main page, three lines, marker-commented. |
| `README.md` | modify | Rewrite the "Known upstream issue" section — the workaround becomes automatic. |
| `CHANGELOG.md` | modify | Folded into the 503 entry. |
| `metadata.json` | modify | Stays at 503. |

## 5. Decisions (resolved)

| # | Decision | Effect on the plan |
| --- | --- | --- |
| D1 | `snap-restore-fix` defaults to **on** | Schema `<default>true</default>` in Task 3. |
| D2 | **Auto-expire on GNOME 51** | `AFFECTED_MAJORS = [49, 50]` in Task 1. If the bug outlives 50 the fix silently stops; bumping the array is a one-line change. |
| D3 | **Add a Preferences row** | `prefs.js` gains three marker-commented lines in Task 3; removal becomes five steps. |

## 6. Tasks

### Task 1: Module skeleton, version gate, and the pure decision function

**Goal:** Both module files exist with their headers, version gate, and a tested `needsRepair`, but no signals are connected yet.

**Files:**
- Create: `newworkspaceshortcut@barnix.io/extension/snaprestore-pure.js`
- Create: `newworkspaceshortcut@barnix.io/extension/snaprestore.js`
- Create: `tests/test-snaprestore.js`

**Acceptance Criteria:**
- [ ] File header names the upstream bug, links it, and states the removal procedure.
- [ ] `snapRestoreFix.isAffected()` returns `true` on shell 49.x and 50.x, `false` on 48.x and 51.x.
- [ ] `needsRepair` returns `false` for identical rects, `false` for ≤2 px differences, `false` for a degenerate cached rect, `true` for a half-width vs full-width difference.
- [ ] All comments ≤20 words per block, links excluded from the count.

**Verify:** `gjs -m tests/test-snaprestore.js` → `ALL CHECKS PASSED`

**Steps:**

- [ ] **Step 1a: Write the pure module** (no imports — this is what the test loads)

```js
// TEMPORARY: part of the GNOME 49/50 snap-restore workaround. Delete with
// extension/snaprestore.js. https://gitlab.gnome.org/GNOME/mutter/-/issues/4918

export const TOLERANCE_PX = 2;

// Repair only when the restored size differs beyond rounding noise.
export function needsRepair(cached, current) {
  if (!cached || cached.width <= 0 || cached.height <= 0) return false;
  return Math.abs(cached.width - current.width) > TOLERANCE_PX ||
         Math.abs(cached.height - current.height) > TOLERANCE_PX;
}
```

- [ ] **Step 1b: Write the module skeleton**

```js
// TEMPORARY: works around a GNOME 49/50 regression; delete this file and its
// seam in extension.js when mutter fixes it.
// https://gitlab.gnome.org/GNOME/mutter/-/issues/4918
//
// Keyboard tiling never records the pre-tile geometry, so Super+Down restores a
// stale rect. We cache the floating rect ourselves and reapply it on restore.
//
// To remove: delete this file; delete the four snapRestore blocks in
// extension.js; delete the 'snap-restore-fix' schema key and recompile; delete
// the "Known upstream issue" section in README.md.
import GLib from 'gi://GLib';
import Meta from 'gi://Meta';
import * as Config from 'resource:///org/gnome/shell/misc/config.js';
import { needsRepair } from './snaprestore-pure.js';

// Bump or delete when mutter ships a fix.
const AFFECTED_MAJORS = [49, 50];

export class snapRestoreFix {
  constructor(settings) {
    this._settings = settings;
    this._handles_display = [];
    this._handles_window = [];
    this._trackedWindow = null;
    this._floatingRects = new WeakMap();
    this._laterId = 0;
    this._repairing = false;
  }

  static isAffected() {
    const major = parseInt(Config.PACKAGE_VERSION.split('.')[0], 10);
    return AFFECTED_MAJORS.includes(major);
  }

}
```

- [ ] **Step 2: Write the failing test**

```js
// tests/test-snaprestore.js
import { needsRepair } from '../newworkspaceshortcut@barnix.io/extension/snaprestore-pure.js';

let failures = 0;
function check(label, actual, expected) {
  const ok = String(actual) === String(expected);
  if (!ok) failures++;
  print(`   ${ok ? 'PASS' : 'FAIL'}  ${label}: ${actual}${ok ? '' : `  (expected ${expected})`}`);
}
const r = (x, y, width, height) => ({ x, y, width, height });

print('\n=== needsRepair ===');
check('identical rects',        needsRepair(r(0, 0, 800, 600), r(0, 0, 800, 600)), false);
check('1px jitter',             needsRepair(r(0, 0, 800, 600), r(0, 0, 801, 599)), false);
check('2px jitter (at limit)',  needsRepair(r(0, 0, 800, 600), r(0, 0, 802, 598)), false);
check('3px differs',            needsRepair(r(0, 0, 800, 600), r(0, 0, 803, 600)), true);
check('half-width restore bug', needsRepair(r(0, 0, 1920, 1080), r(0, 0, 960, 1080)), true);
check('no cached rect',         needsRepair(null, r(0, 0, 960, 1080)), false);
check('degenerate cached 0x0',  needsRepair(r(0, 0, 0, 0), r(0, 0, 960, 1080)), false);

print(`\n${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'}\n`);
if (failures) imports.system.exit(1);
```

- [ ] **Step 3: Run the test, confirm it fails before the implementation exists**

Run: `gjs -m tests/test-snaprestore.js`
Expected: failure — module or export not found.

- [ ] **Step 4: Run the test against the Step 1 code**

Run: `gjs -m tests/test-snaprestore.js`
Expected: `ALL CHECKS PASSED`

- [ ] **Step 5: Commit**

```bash
git add newworkspaceshortcut@barnix.io/extension/snaprestore*.js tests/test-snaprestore.js
git commit -m "feat: snap-restore repair module skeleton and decision function"
```

---

### Task 2: Signal tracking, caching, and the repair

**Goal:** The module observes the focused window, caches its floating rect, and repairs geometry after a restore.

**Files:**
- Modify: `newworkspaceshortcut@barnix.io/extension/snaprestore.js`

**Acceptance Criteria:**
- [ ] `enable()` connects exactly one display signal; `disable()` leaves zero connected handlers and no pending later.
- [ ] The rect cache is only written while the window is floating.
- [ ] The repair runs inside a `BEFORE_REDRAW` later, guarded by `_repairing`.
- [ ] A window whose monitor changed while tiled is not repaired.
- [ ] Three `disable()`/`enable()` cycles leave no warnings in the journal.

**Verify:** `journalctl --user -b _PID=$(pgrep -x gnome-shell | tail -1) -o cat | grep -ciE 'JS ERROR|Source ID|snaprestore'` → `0`

**Steps:**

- [ ] **Step 1: Add enable/disable and window tracking**

```js
  enable() {
    this._handles_display.push(
      global.display.connect('notify::focus-window', () => this._trackFocused()),
    );
    this._trackFocused();
  }

  disable() {
    this._handles_display.splice(0).forEach(h => global.display.disconnect(h));
    this._untrack();
    if (this._laterId) {
      global.compositor.get_laters().remove(this._laterId);
      this._laterId = 0;
    }
  }

  _untrack() {
    if (this._trackedWindow)
      this._handles_window.splice(0).forEach(h => this._trackedWindow.disconnect(h));
    this._trackedWindow = null;
    this._handles_window = [];
  }

  _trackFocused() {
    this._untrack();
    const win = global.display.focus_window;
    if (win === null || win.window_type !== Meta.WindowType.NORMAL) return;

    this._trackedWindow = win;
    this._handles_window = [
      win.connect('size-changed', () => this._cacheIfFloating(win)),
      win.connect('position-changed', () => this._cacheIfFloating(win)),
      win.connect('notify::maximized-vertically', () => this._onMaximizedChanged(win)),
      win.connect('unmanaged', () => this._untrack()),
    ];
    this._cacheIfFloating(win);
  }
```

- [ ] **Step 2: Add caching and the restore trigger**

```js
  _isFloating(win) {
    return !win.is_fullscreen() &&
           !win.maximized_horizontally &&
           !win.maximized_vertically;
  }

  _cacheIfFloating(win) {
    if (this._repairing || !this._isFloating(win)) return;
    const r = win.get_frame_rect();
    this._floatingRects.set(win, {
      rect: { x: r.x, y: r.y, width: r.width, height: r.height },
      monitor: win.get_monitor(),
    });
  }

  _onMaximizedChanged(win) {
    if (win.maximized_vertically) return;
    if (this._laterId) return;
    const laters = global.compositor.get_laters();
    this._laterId = laters.add(Meta.LaterType.BEFORE_REDRAW, () => {
      this._laterId = 0;
      this._repair(win);
      return GLib.SOURCE_REMOVE;
    });
  }
```

- [ ] **Step 3: Add the repair**

```js
  _repair(win) {
    if (this._trackedWindow !== win || !this._isFloating(win)) return;
    const cached = this._floatingRects.get(win);
    if (!cached || cached.monitor !== win.get_monitor()) return;

    const current = win.get_frame_rect();
    if (!needsRepair(cached.rect, current)) return;

    this._repairing = true;
    win.move_resize_frame(false, cached.rect.x, cached.rect.y,
                          cached.rect.width, cached.rect.height);
    this._repairing = false;
  }
```

- [ ] **Step 4: Verify syntax**

Run: `cp newworkspaceshortcut@barnix.io/extension/snaprestore.js /tmp/c.mjs && node --check /tmp/c.mjs`
Expected: no output (exit 0).

- [ ] **Step 5: Commit**

```bash
git add newworkspaceshortcut@barnix.io/extension/snaprestore.js
git commit -m "feat: cache floating geometry and repair it after keyboard untile"
```

---

### Task 3: Schema key, extension.js seam, and Preferences row

**Goal:** The module is constructed, gated on version and setting, and torn down — in four clearly marked blocks.

**Files:**
- Modify: `newworkspaceshortcut@barnix.io/schemas/org.gnome.shell.extensions.newworkspaceshortcut.gschema.xml`
- Modify: `newworkspaceshortcut@barnix.io/extension.js`
- Modify: `newworkspaceshortcut@barnix.io/prefs.js`

**Acceptance Criteria:**
- [ ] Schema compiles under `--strict` and exposes `snap-restore-fix`.
- [ ] Toggling `snap-restore-fix` at runtime enables/disables the module without a shell restart.
- [ ] Extension `disable()` nulls the instance and disconnects the settings handler.
- [ ] A "Snap restore" group with one switch appears on the Main page of Preferences, and the switch drives the setting.
- [ ] `grep -rn 'snapRestore:' newworkspaceshortcut@barnix.io/` lists every touch point outside the two module files.

**Verify:** `glib-compile-schemas --strict newworkspaceshortcut@barnix.io/schemas/ && gsettings --schemadir newworkspaceshortcut@barnix.io/schemas/ list-keys org.gnome.shell.extensions.newworkspaceshortcut | grep -x snap-restore-fix`

**Steps:**

- [ ] **Step 1: Add the schema key** (`<default>` value is decision D1)

```xml
    <key name="snap-restore-fix" type="b">
      <default>true</default>
      <summary>Repair window geometry after keyboard untile</summary>
      <description>
        Workaround for a GNOME 49/50 Mutter regression where Super+Down does not
        restore a window snapped with Super+Left or Super+Right. Has no effect on
        other GNOME versions. Remove with extension/snaprestore.js.
      </description>
    </key>
```

Then: `glib-compile-schemas newworkspaceshortcut@barnix.io/schemas/`

- [ ] **Step 2: Add the seam to extension.js** — four blocks, each marked for deletion

```js
// snapRestore: remove with extension/snaprestore.js
import { snapRestoreFix } from './extension/snaprestore.js';
```

In `enable()`, after the focusChanger block:

```js
    // snapRestore: remove with extension/snaprestore.js
    this._snapRestore = new snapRestoreFix(this._settings);
    if (snapRestoreFix.isAffected() && this._settings.get_boolean('snap-restore-fix'))
      this._snapRestore.enable();
    this._snapRestoreHandlerId = this._settings.connect('changed::snap-restore-fix', () => {
      if (snapRestoreFix.isAffected() && this._settings.get_boolean('snap-restore-fix'))
        this._snapRestore.enable();
      else
        this._snapRestore.disable();
    });
```

In `disable()`, before `this._settings = null;`:

```js
    // snapRestore: remove with extension/snaprestore.js
    this._snapRestore.disable();
    this._snapRestore = null;
    if (this._snapRestoreHandlerId) {
      this._settings.disconnect(this._snapRestoreHandlerId);
      this._snapRestoreHandlerId = null;
    }
```

- [ ] **Step 3: Add the Preferences row**

In `prefs.js`, immediately after the `rwsGroup` block on the Main page (the existing `addSwitchRow(s, rwsGroup, 'Reorder-workspace shortcut will trigger Overview', ...)` line):

```js
        // snapRestore: remove with extension/snaprestore.js
        const srGroup = makeGroup(page_main, 'Snap restore (GNOME 49/50 workaround)');
        addSwitchRow(s, srGroup, 'Restore window size after un-snapping', 'snap-restore-fix');
```

Uses the existing `makeGroup` / `addSwitchRow` helpers unchanged — no shared helper is modified, so removal is a clean three-line delete.

- [ ] **Step 4: Verify syntax and schema**

Run: `for f in newworkspaceshortcut@barnix.io/extension.js newworkspaceshortcut@barnix.io/prefs.js; do cp "$f" /tmp/c.mjs; node --check /tmp/c.mjs || echo "FAIL $f"; done && glib-compile-schemas --strict newworkspaceshortcut@barnix.io/schemas/`
Expected: no output (exit 0).

- [ ] **Step 5: Confirm the Preferences row renders**

Run: `gnome-extensions prefs newworkspaceshortcut@barnix.io`
Expected: Main page shows a "Snap restore (GNOME 49/50 workaround)" group with the switch on; toggling it changes `gsettings get ... snap-restore-fix`.

- [ ] **Step 6: Commit**

```bash
git add newworkspaceshortcut@barnix.io/extension.js newworkspaceshortcut@barnix.io/prefs.js newworkspaceshortcut@barnix.io/schemas/
git commit -m "feat: wire snap-restore repair behind a version gate and setting"
```

---

### Task 4: Live verification, docs, and release

**Goal:** The fix is proven on the running shell and the release is packaged.

**Files:**
- Modify: `README.md:84-95`, `CHANGELOG.md`, `newworkspaceshortcut@barnix.io/metadata.json`

**Acceptance Criteria:**
- [ ] Every row of the manual matrix below passes.
- [ ] README no longer instructs the user to run the manual `Super+Up`/`Super+Down` workaround.
- [ ] `bin/packager.sh` produces `newworkspaceshortcut503.zip` and passes its own verification.

**Verify:** `bash bin/packager.sh` → `Packaged v503`

**Steps:**

- [ ] **Step 1: Log out and back in** — Wayland does not reload changed extension code on `disable`/`enable`.

- [ ] **Step 2: Run the manual matrix**

| # | Scenario | Expected |
| --- | --- | --- |
| 1 | Float a window, note its size, `Super+Left`, `Super+Down` | Returns to the noted size |
| 2 | Drag-snap to the edge, `Super+Down` | Returns correctly, no double-adjust or visible jump |
| 3 | `Super+Up`, `Super+Down` on a floating window | Normal maximize/unmaximize, no interference |
| 4 | `Super+Left`, drag to the other monitor, `Super+Down` | No repair applied; window stays on the new monitor |
| 5 | `Super+Left`, close the window before restoring | No warning in the journal |
| 6 | Fullscreen a video, exit fullscreen | No repair applied |
| 7 | Turn the Preferences switch off, repeat #1 | Old broken behaviour returns; no errors |
| 8 | Three `gnome-extensions disable`/`enable` cycles | No leaked-handler or `Source ID` warnings |

- [ ] **Step 3: Rewrite README.md:84-95** — replace the manual workaround with a description of the automatic repair, keeping the upstream links and noting the `snap-restore-fix` key and that it is inert outside GNOME 49/50.

- [ ] **Step 4: Fold the entry into 503 in CHANGELOG**

```markdown
# 503 (Sep 2026)
## BUG FIXES
- Windows snapped with `Super + Left` / `Super + Right` now return to their previous size on `Super + Down`. GNOME 49 and 50 fail to record the pre-snap geometry ([mutter#4918](https://gitlab.gnome.org/GNOME/mutter/-/issues/4918)), so the extension records it and reapplies it. Inert on other GNOME versions; disable with the `snap-restore-fix` key.
```

- [ ] **Step 5: Package and commit**

```bash
bash bin/packager.sh
git add README.md CHANGELOG.md newworkspaceshortcut@barnix.io/metadata.json
git commit -m "docs: document automatic snap-restore repair"
```

## 7. Risks

| Risk | Mitigation |
| --- | --- |
| Fights a third-party tiling extension | `snap-restore-fix=false` disables it; the repair only fires on a maximized→floating transition |
| Repair visible as a jump | `BEFORE_REDRAW` lands it in the same frame; matrix row 2 checks this |
| `size-changed` re-entry during repair | `_repairing` flag |
| Bug persists past GNOME 50 and the gate silently disables the fix | Decision D2 |
| Compat code outlives the upstream bug | Removal procedure in the file header; four-step deletion |

## 8. Out of scope

- Strategy A (maximize/unmaximize priming) — rejected: `unmaximize()` applies an 80% work-area clamp (`MAX_UNMAXIMIZED_WINDOW_AREA .8`) that resizes large windows, and the round-trip is observable by the application as a real state change.
- Repairing drag-snap — already correct upstream.
- Any change to `highlight.js`, `winman.js`, or `focus.js`.
