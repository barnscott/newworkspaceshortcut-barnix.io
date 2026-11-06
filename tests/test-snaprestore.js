// Headless test for the GNOME 49–51 snap-restore workaround. Run: gjs -m tests/test-snaprestore.js
import { canRepair, clampUnmaximized, isUsableRect, onMaximizeNotify } from '../newworkspaceshortcut@barnix.io/extension/snaprestore-pure.js';
import { sameRect } from '../newworkspaceshortcut@barnix.io/extension/rect.js';
import { check, finish } from './harness.js';

const r = (x, y, width, height) => ({ x, y, width, height });

print('\n=== isUsableRect ===');
check('normal rect',      isUsableRect(r(0, 0, 800, 600)), true);
check('null',             isUsableRect(null), false);
check('undefined',        isUsableRect(undefined), false);
check('zero size',        isUsableRect(r(0, 0, 0, 0)), false);
check('negative width',   isUsableRect(r(0, 0, -5, 600)), false);
check('zero height',      isUsableRect(r(0, 0, 800, 0)), false);

print('\n=== sameRect ===');
check('equal',            sameRect(r(0, 0, 10, 10), r(0, 0, 10, 10)), true);
check('moved',            sameRect(r(0, 0, 10, 10), r(1, 0, 10, 10)), false);
check('null side',        sameRect(r(0, 0, 10, 10), null), false);

// Replays a sequence of maximize states through onMaximizeNotify, as the extension does.
const NONE = [false, false], SNAP = [false, true], MAX = [true, true], H_ONLY = [true, false];
function run(steps) {
  const s = { hasRect: true, hasSnapshot: false, mutterSaved: false };
  const log = [];
  for (const [maximizedH, maximizedV] of steps) {
    const step = onMaximizeNotify({ maximizedH, maximizedV }, s);
    s.mutterSaved = step.mutterSaved;
    if (step.snapshot) s.hasSnapshot = true;
    if (step.repair) s.hasSnapshot = false;
    log.push(step.snapshot ? 'snap' : step.repair ? 'repair' : '-');
  }
  return log.join(' ');
}

print('\n=== onMaximizeNotify: which flows snapshot and repair ===');
check('snap, restore',                       run([SNAP, NONE]), 'snap repair');
check('maximize, restore',                   run([MAX, NONE]), '- -');
check('snap, maximize, restore',             run([SNAP, MAX, NONE]), 'snap - repair');
check('maximize, snap, maximize, restore',   run([MAX, SNAP, MAX, NONE]), '- - - -');
check('maximize, snap, restore',             run([MAX, SNAP, NONE]), '- - -');
check('snap, maximize, H only, restore',     run([SNAP, MAX, H_ONLY, NONE]), 'snap - - repair');
check('repeat snap notify keeps one',        run([SNAP, SNAP, NONE]), 'snap - repair');
check('maximize, restore, snap, restore',    run([MAX, NONE, SNAP, NONE]), '- - snap repair');
check('no floating rect seen yet',
  onMaximizeNotify({ maximizedH: false, maximizedV: true }, { hasRect: false, hasSnapshot: false, mutterSaved: false }).snapshot, false);

print('\n=== canRepair: same monitor, unchanged layout ===');
const mon = r(0, 0, 1920, 1080);
const snap = (over = {}) => ({ rect: r(724, 500, 708, 452), monitor: 0, tileMonitor: 0, rectMonitor: 0, rectMonitorGeo: mon, ...over });
check('snapped and restored in place',  canRepair(snap(), mon), true);
check('no snapshot',                    canRepair(undefined, mon), false);
check('degenerate rect',                canRepair(snap({ rect: r(0, 0, 0, 0) }), mon), false);
check('moved to another monitor',       canRepair(snap({ tileMonitor: 1 }), mon), false);
check('rect was off every monitor',     canRepair(snap({ rectMonitor: -1 }), null), false);
check('rect monitor rearranged',        canRepair(snap(), r(1920, 0, 1920, 1080)), false);
check('rect monitor gone',              canRepair(snap(), null), false);
check('rect on another, unchanged monitor', canRepair(snap({ monitor: 1, tileMonitor: 1 }), mon), true);
check('size-only ignores the monitor',  canRepair(snap({ tileMonitor: 1 }), r(1920, 0, 1920, 1080), true), true);
check('size-only still needs a size',   canRepair(snap({ rect: r(0, 0, 0, 0) }), mon, true), false);

print('\n=== clampUnmaximized: mutter\'s 80% guard ===');
const work = r(0, 32, 1920, 1048);
check('small rect unchanged',      JSON.stringify(clampUnmaximized(r(100, 100, 800, 600), work)), JSON.stringify(r(100, 100, 800, 600)));
check('wide rect shrunk',          JSON.stringify(clampUnmaximized(r(50, 40, 1800, 1000), work)), JSON.stringify(r(50, 40, 1717, 953)));
check('tall rect shrunk',          JSON.stringify(clampUnmaximized(r(0, 32, 1000, 1040), r(0, 0, 1080, 1100))), JSON.stringify(r(0, 32, 945, 983)));
check('exactly 80% unchanged',     clampUnmaximized(r(0, 0, 800, 800), r(0, 0, 1000, 1000)).width, 800);

finish();
