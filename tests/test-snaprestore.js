// Headless test for the GNOME 49–51 snap-restore workaround. Run: gjs -m tests/test-snaprestore.js
import { isUsableRect } from '../newworkspaceshortcut@barnix.io/extension/snaprestore-pure.js';
import { check, finish } from './harness.js';

const r = (x, y, width, height) => ({ x, y, width, height });

print('\n=== isUsableRect ===');
check('normal rect',      isUsableRect(r(0, 0, 800, 600)), true);
check('null',             isUsableRect(null), false);
check('undefined',        isUsableRect(undefined), false);
check('zero size',        isUsableRect(r(0, 0, 0, 0)), false);
check('negative width',   isUsableRect(r(0, 0, -5, 600)), false);
check('zero height',      isUsableRect(r(0, 0, 800, 0)), false);

finish();
