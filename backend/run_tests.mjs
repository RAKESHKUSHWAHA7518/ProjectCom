import { spawnSync } from 'child_process';

const result = spawnSync('node', [
  '--test',
  '__tests__/unit/errorHandler.test.js',
  '__tests__/unit/corsOptions.test.js',
  '__tests__/unit/cspBuilder.test.js',
  '__tests__/unit/validators.test.js',
], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });

const combined = (result.stdout || '') + (result.stderr || '');
const lines = combined.split('\n').filter(l =>
  (l.startsWith('ok ') || l.startsWith('not ok') || l.startsWith('    ok') || l.startsWith('    not ok')) ||
  l.match(/^\s*(tests|pass|fail|suites|cancelled|duration_ms)\s+\d/) ||
  l.match(/failing tests/) ||
  l.includes('Counterexample') ||
  l.includes('Got AssertionError') ||
  l.includes('Error: Property') ||
  l.includes('AssertionError')
);

console.log('=== TEST RESULTS ===');
console.log('Exit code:', result.status);
console.log(lines.join('\n'));
