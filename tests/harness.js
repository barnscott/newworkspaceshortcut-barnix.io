// Shared PASS/FAIL reporting for the gjs tests in this directory.
import { exit } from 'system';

let failures = 0;

export function check(label, actual, expected) {
  const ok = String(actual) === String(expected);
  if (!ok) failures++;
  print(`   ${ok ? 'PASS' : 'FAIL'}  ${label}: ${actual}${ok ? '' : `  (expected ${expected})`}`);
}

export function fail(message) {
  failures++;
  printerr(`ERROR: ${message}`);
}

// Prints the summary and exits non-zero on any failure.
export function finish() {
  print(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}\n`);
  if (failures) exit(1);
}
