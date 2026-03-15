import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function expectFile(relativePath) {
  if (!fs.existsSync(path.join(root, relativePath))) {
    failures.push(`Missing required file: ${relativePath}`);
  }
}

function expectContains(relativePath, fragment) {
  const content = read(relativePath);
  if (!content.includes(fragment)) {
    failures.push(`${relativePath} is missing required text: ${fragment}`);
  }
}

function expectContainsCaseInsensitive(relativePath, fragment) {
  const content = read(relativePath).toLowerCase();
  if (!content.includes(fragment.toLowerCase())) {
    failures.push(`${relativePath} is missing required text: ${fragment}`);
  }
}

function expectNotContains(relativePath, fragment) {
  const content = read(relativePath);
  if (content.includes(fragment)) {
    failures.push(`${relativePath} still contains stale text: ${fragment}`);
  }
}

[
  'README.md',
  'AGENTS.md',
  'CONTEXT.md',
  'ROADMAP.md',
  'PROJECT_REORG_PLAN.md',
  'docs/INDEX.md',
  'docs/sprints/INDEX.md',
  'scripts/register-session.sh',
  'scripts/register-session.ps1',
  'scripts/end-session.sh',
  'scripts/end-session.ps1',
  'scripts/dashboard-snapshot.ps1',
].forEach(expectFile);

expectContains('README.md', 'git pull --rebase origin master');
expectContains('README.md', 'localhost');
expectContains('AGENTS.md', '/api/dashboard/sessions');
expectContains('docs/INDEX.md', 'Task Routing');
expectContainsCaseInsensitive('docs/sprints/INDEX.md', 'historical reference only');

expectContains('scripts/register-session.sh', 'http://localhost:3000');
expectContains('scripts/register-session.sh', '/api/dashboard/sessions');
expectContains('scripts/register-session.ps1', '/api/dashboard/sessions');
expectContains('scripts/end-session.sh', '/api/dashboard/sessions/');
expectContains('scripts/end-session.ps1', '/api/dashboard/sessions/');
expectContains('scripts/dashboard-snapshot.ps1', 'Authorization');

expectNotContains('scripts/register-session.sh', 'http://localhost:3001');
expectNotContains('scripts/register-session.sh', '/api/sessions');
expectNotContains('scripts/register-session.ps1', 'http://localhost:3001');
expectNotContains('scripts/register-session.ps1', '/api/sessions');
expectNotContains('scripts/end-session.sh', 'http://localhost:3001');
expectNotContains('scripts/end-session.sh', '/api/sessions');
expectNotContains('scripts/end-session.ps1', 'http://localhost:3001');
expectNotContains('scripts/end-session.ps1', '/api/sessions');

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('current-doc-contract: ok');
