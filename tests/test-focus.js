// Tests Focus Changer's monitor choice. Run: gjs -m tests/test-focus.js
import { pickAdjacentMonitor as pick } from '../newworkspaceshortcut@barnix.io/extension/focus-pure.js';
import { check, finish } from './harness.js';

const m = (x, y, width = 1280, height = 800) => ({ x, y, width, height });

print('\n=== side by side at different heights (the original bug) ===');
{
  const mons = [m(0, 0), m(1280, 200)];
  check('down from 0 goes nowhere', pick('focus-changer-down', 0, mons, 640), null);
  check('right from 0',             pick('focus-changer-right', 0, mons, 400), 1);
  check('up from 1 goes nowhere',   pick('focus-changer-up', 1, mons, 1920), null);
}

print('\n=== two monitors share the right edge: nearest the window wins ===');
{
  const mons = [m(0, 400), m(1280, 0), m(1280, 800)];
  check('window low',  pick('focus-changer-right', 0, mons, 1000), 2);
  check('window high', pick('focus-changer-right', 0, mons, 500), 1);
}

print('\n=== L-shaped layout: only a diagonal monitor below ===');
{
  const mons = [m(0, 0), m(1280, 0), m(0, 800)];
  check('down from 1 reaches the diagonal one', pick('focus-changer-down', 1, mons, 1900), 2);
  check('down from 0 takes its neighbour',      pick('focus-changer-down', 0, mons, 640), 2);
}

print('\n=== a real neighbour beats a nearer diagonal ===');
{
  const mons = [m(0, 0), m(0, 800, 640, 800), m(1280, 800)];
  check('window at the right of 0', pick('focus-changer-down', 0, mons, 1200), 1);
}

print('\n=== gap between monitors ===');
{
  const mons = [m(0, 0), m(1400, 0)];
  check('right across the gap', pick('focus-changer-right', 0, mons, 400), 1);
  check('left back',            pick('focus-changer-left', 1, mons, 400), 0);
}

print('\n=== invalid active monitor ===');
check('index -1',        pick('focus-changer-down', -1, [m(0, 0)], 0), null);
check('index past end',  pick('focus-changer-down', 3, [m(0, 0)], 0), null);

finish();
