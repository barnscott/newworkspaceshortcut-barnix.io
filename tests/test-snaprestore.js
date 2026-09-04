// Headless test for the GNOME 49/50 snap-restore workaround. Run: gjs -m tests/test-snaprestore.js
import { isUsableRect, shouldRepair } from '../newworkspaceshortcut@barnix.io/extension/snaprestore-pure.js';

let failures = 0;
function check(label, actual, expected) {
  const ok = String(actual) === String(expected);
  if (!ok) failures++;
  print(`   ${ok ? 'PASS' : 'FAIL'}  ${label}: ${actual}${ok ? '' : `  (expected ${expected})`}`);
}
const r = (x, y, width, height) => ({ x, y, width, height });

print('\n=== isUsableRect ===');
check('normal rect',      isUsableRect(r(0, 0, 800, 600)), true);
check('null',             isUsableRect(null), false);
check('undefined',        isUsableRect(undefined), false);
check('zero size',        isUsableRect(r(0, 0, 0, 0)), false);
check('negative width',   isUsableRect(r(0, 0, -5, 600)), false);
check('zero height',      isUsableRect(r(0, 0, 800, 0)), false);

print('\n=== shouldRepair: only a side snap loses geometry ===');
check('side-tiled, good cache',   shouldRepair(true, r(724, 500, 708, 452)), true);
check('plain unmaximize',         shouldRepair(false, r(724, 500, 708, 452)), false);
check('no tile state recorded',   shouldRepair(undefined, r(724, 500, 708, 452)), false);
check('side-tiled, no cache',     shouldRepair(true, null), false);
check('side-tiled, degenerate',   shouldRepair(true, r(0, 0, 0, 0)), false);

print(`\n${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'}\n`);
if (failures) imports.system.exit(1);
