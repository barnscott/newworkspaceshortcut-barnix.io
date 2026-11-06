// Headless test for the GNOME 49–51 snap-restore workaround. Run: gjs -m tests/test-snaprestore.js
import { canRepair, isUsableRect, sameRect, takesSnapshot } from '../newworkspaceshortcut@barnix.io/extension/snaprestore-pure.js';
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

print('\n=== takesSnapshot: only a side snap from floating ===');
check('side snap from floating',          takesSnapshot(false, false, true), true);
check('full maximize from floating',      takesSnapshot(true, false, true), false);
check('maximize while snapped keeps it',  takesSnapshot(true, true, true), false);
check('repeat snap notify keeps it',      takesSnapshot(false, true, true), false);
check('no floating rect seen yet',        takesSnapshot(false, false, false), false);

print('\n=== canRepair: same monitor, unchanged layout ===');
const mon = r(0, 0, 1920, 1080);
const snap = (over = {}) => ({ rect: r(724, 500, 708, 452), monitor: 0, tileMonitor: 0, monitorGeo: mon, ...over });
check('snapped and restored in place', canRepair(snap(), mon), true);
check('no snapshot',                   canRepair(undefined, mon), false);
check('degenerate rect',               canRepair(snap({ rect: r(0, 0, 0, 0) }), mon), false);
check('moved to another monitor',      canRepair(snap({ tileMonitor: 1 }), mon), false);
check('window was off every monitor',  canRepair(snap({ monitor: -1, tileMonitor: -1 }), mon), false);
check('monitor rearranged',            canRepair(snap(), r(1920, 0, 1920, 1080)), false);
check('monitor gone',                  canRepair(snap(), null), false);
check('size-only ignores the monitor', canRepair(snap({ tileMonitor: 1 }), r(1920, 0, 1920, 1080), true), true);
check('size-only still needs a size',  canRepair(snap({ rect: r(0, 0, 0, 0) }), mon, true), false);

finish();
