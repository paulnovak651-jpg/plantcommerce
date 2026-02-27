import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type RuleId =
  | 'begin-commit'
  | 'wrong-column-names'
  | 'no-concurrent-refresh'
  | 'no-full-to-part-sun'
  | 'on-conflict-required'
  | 'materialized-view-refresh'
  | 'valid-enum-values';

export interface LintResult {
  rule: RuleId;
  description: string;
  pass: boolean;
  issues: string[];
}

const RULE_DESCRIPTIONS: Record<RuleId, string> = {
  'begin-commit': 'Transaction wrapping (BEGIN/COMMIT)',
  'wrong-column-names': 'No incorrect column names',
  'no-concurrent-refresh': 'No CONCURRENTLY in REFRESH',
  'no-full-to-part-sun': 'No invalid sun enum',
  'on-conflict-required': 'All INSERTs have conflict guards',
  'materialized-view-refresh': 'Refresh present',
  'valid-enum-values': 'All enum values valid',
};

const VALID_SUN_REQUIREMENTS = new Set([
  'full_sun',
  'part_shade',
  'full_shade',
  'shade_tolerant',
]);

interface ParsedInsert {
  table: string;
  statement: string;
  columns: string[];
  tuples: string[][];
}

function stripSqlComments(sql: string): string {
  let out = '';
  let i = 0;
  let inSingleQuote = false;
  let inLineComment = false;
  let inBlockComment = false;

  while (i < sql.length) {
    const current = sql[i];
    const next = sql[i + 1];

    if (inLineComment) {
      if (current === '\n') {
        inLineComment = false;
        out += current;
      }
      i += 1;
      continue;
    }

    if (inBlockComment) {
      if (current === '*' && next === '/') {
        inBlockComment = false;
        i += 2;
        continue;
      }
      i += 1;
      continue;
    }

    if (!inSingleQuote && current === '-' && next === '-') {
      inLineComment = true;
      i += 2;
      continue;
    }

    if (!inSingleQuote && current === '/' && next === '*') {
      inBlockComment = true;
      i += 2;
      continue;
    }

    if (current === "'") {
      out += current;
      if (inSingleQuote && next === "'") {
        out += next;
        i += 2;
        continue;
      }
      inSingleQuote = !inSingleQuote;
      i += 1;
      continue;
    }

    out += current;
    i += 1;
  }

  return out;
}

function stripDoDollarBlocks(sql: string): string {
  return sql.replace(/DO\s+\$\$[\s\S]*?\$\$\s*;/gi, '');
}

function splitTopLevelComma(input: string): string[] {
  const parts: string[] = [];
  let current = '';
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  let inSingleQuote = false;

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    const next = input[i + 1];

    if (ch === "'") {
      current += ch;
      if (inSingleQuote && next === "'") {
        current += next;
        i += 1;
        continue;
      }
      inSingleQuote = !inSingleQuote;
      continue;
    }

    if (!inSingleQuote) {
      if (ch === '(') parenDepth += 1;
      else if (ch === ')') parenDepth = Math.max(0, parenDepth - 1);
      else if (ch === '[') bracketDepth += 1;
      else if (ch === ']') bracketDepth = Math.max(0, bracketDepth - 1);
      else if (ch === '{') braceDepth += 1;
      else if (ch === '}') braceDepth = Math.max(0, braceDepth - 1);

      if (
        ch === ',' &&
        parenDepth === 0 &&
        bracketDepth === 0 &&
        braceDepth === 0
      ) {
        parts.push(current.trim());
        current = '';
        continue;
      }
    }

    current += ch;
  }

  const tail = current.trim();
  if (tail) parts.push(tail);
  return parts;
}

function normalizeSqlIdentifier(value: string): string {
  return value.trim().replace(/"/g, '').toLowerCase();
}

function extractInsertStatements(sql: string): string[] {
  const statements: string[] = [];
  const lower = sql.toLowerCase();
  let i = 0;

  while (i < sql.length) {
    const maybeStart = lower.slice(i);
    const startsInsert = /^insert\s+into\b/.test(maybeStart);
    const prevChar = i > 0 ? lower[i - 1] : ' ';
    const prevIsWord = /[a-z0-9_]/.test(prevChar);

    if (!startsInsert || prevIsWord) {
      i += 1;
      continue;
    }

    const start = i;
    let j = i;
    let inSingleQuote = false;

    while (j < sql.length) {
      const ch = sql[j];
      const next = sql[j + 1];

      if (ch === "'") {
        if (inSingleQuote && next === "'") {
          j += 2;
          continue;
        }
        inSingleQuote = !inSingleQuote;
        j += 1;
        continue;
      }

      if (!inSingleQuote && ch === ';') {
        statements.push(sql.slice(start, j + 1));
        j += 1;
        break;
      }

      j += 1;
    }

    i = j;
  }

  return statements;
}

function parseInsertStatements(sql: string): ParsedInsert[] {
  const results: ParsedInsert[] = [];
  const matches = extractInsertStatements(sql);

  for (const statement of matches) {
    const tableMatch = statement.match(/INSERT\s+INTO\s+([A-Za-z0-9_."$]+)/i);
    const columnsMatch = statement.match(
      /INSERT\s+INTO\s+[A-Za-z0-9_."$]+\s*\(([\s\S]*?)\)\s*(VALUES|SELECT)/i
    );

    if (!tableMatch || !columnsMatch) continue;

    const table = normalizeSqlIdentifier(tableMatch[1].split('.').pop() ?? tableMatch[1]);
    const columns = splitTopLevelComma(columnsMatch[1]).map(normalizeSqlIdentifier);

    const tuples: string[][] = [];
    const valuesSectionMatch = statement.match(
      /VALUES\s*([\s\S]*?)(ON\s+CONFLICT|RETURNING|;)/i
    );

    if (valuesSectionMatch) {
      const tupleBodies = extractTupleBodies(valuesSectionMatch[1]);
      for (const tupleBody of tupleBodies) {
        tuples.push(splitTopLevelComma(tupleBody));
      }
    }

    results.push({
      table,
      statement,
      columns,
      tuples,
    });
  }

  return results;
}

function extractTupleBodies(valuesSection: string): string[] {
  const tuples: string[] = [];
  let inSingleQuote = false;
  let depth = 0;
  let startIndex = -1;

  for (let i = 0; i < valuesSection.length; i += 1) {
    const ch = valuesSection[i];
    const next = valuesSection[i + 1];

    if (ch === "'") {
      if (inSingleQuote && next === "'") {
        i += 1;
        continue;
      }
      inSingleQuote = !inSingleQuote;
      continue;
    }

    if (inSingleQuote) continue;

    if (ch === '(') {
      if (depth === 0) startIndex = i + 1;
      depth += 1;
      continue;
    }

    if (ch === ')') {
      depth -= 1;
      if (depth === 0 && startIndex >= 0) {
        tuples.push(valuesSection.slice(startIndex, i));
        startIndex = -1;
      }
    }
  }

  return tuples;
}

function parseSingleQuotedLiteral(field: string): string | null {
  const trimmed = field.trim();
  const literal = trimmed.match(/^'((?:''|[^'])*)'(?:\s*::[\w.]+)?\s*$/);
  if (!literal) return null;
  return literal[1].replace(/''/g, "'");
}

function summarizeSql(statement: string): string {
  const compact = statement.replace(/\s+/g, ' ').trim();
  return compact.length > 120 ? `${compact.slice(0, 117)}...` : compact;
}

export function lintMigrationSql(sql: string): LintResult[] {
  const commentStripped = stripSqlComments(sql);
  const sqlNoDoBlocks = stripDoDollarBlocks(commentStripped);
  const insertStatements = parseInsertStatements(commentStripped);
  const insertStatementsNoDo = parseInsertStatements(sqlNoDoBlocks);
  const results: LintResult[] = [];

  const beginIssues: string[] = [];
  if (!/\bBEGIN\s*;/i.test(commentStripped)) beginIssues.push('Missing BEGIN;');
  if (!/\bCOMMIT\s*;/i.test(commentStripped)) beginIssues.push('Missing COMMIT;');
  results.push({
    rule: 'begin-commit',
    description: RULE_DESCRIPTIONS['begin-commit'],
    pass: beginIssues.length === 0,
    issues: beginIssues,
  });

  const wrongColumnIssues: string[] = [];
  if (/\bsoil_textures\b/i.test(commentStripped)) {
    wrongColumnIssues.push('Found forbidden column: soil_textures');
  }
  if (/\broot_type\b/i.test(commentStripped)) {
    wrongColumnIssues.push('Found forbidden column: root_type');
  }
  if (/\bnative_range\b(?!_description)/i.test(commentStripped)) {
    wrongColumnIssues.push('Found forbidden column: native_range');
  }

  for (const insert of insertStatements) {
    if (insert.table !== 'species_growing_profiles') continue;
    const dataSourceIndex = insert.columns.indexOf('data_source');
    if (dataSourceIndex < 0) continue;

    for (const tuple of insert.tuples) {
      if (dataSourceIndex >= tuple.length) continue;
      const literal = parseSingleQuotedLiteral(tuple[dataSourceIndex]);
      if (literal !== null) {
        wrongColumnIssues.push(
          `Found data_source string literal in species_growing_profiles: '${literal}'`
        );
        break;
      }
    }
  }

  results.push({
    rule: 'wrong-column-names',
    description: RULE_DESCRIPTIONS['wrong-column-names'],
    pass: wrongColumnIssues.length === 0,
    issues: wrongColumnIssues,
  });

  const concurrentIssues: string[] = [];
  if (/\bREFRESH\s+MATERIALIZED\s+VIEW\s+CONCURRENTLY\b/i.test(commentStripped)) {
    concurrentIssues.push('Found REFRESH MATERIALIZED VIEW CONCURRENTLY');
  }
  results.push({
    rule: 'no-concurrent-refresh',
    description: RULE_DESCRIPTIONS['no-concurrent-refresh'],
    pass: concurrentIssues.length === 0,
    issues: concurrentIssues,
  });

  const invalidSunLiteralIssues: string[] = [];
  if (/\bfull_to_part_sun\b/i.test(commentStripped)) {
    invalidSunLiteralIssues.push("Found invalid sun requirement literal: 'full_to_part_sun'");
  }
  results.push({
    rule: 'no-full-to-part-sun',
    description: RULE_DESCRIPTIONS['no-full-to-part-sun'],
    pass: invalidSunLiteralIssues.length === 0,
    issues: invalidSunLiteralIssues,
  });

  const conflictGuardIssues: string[] = [];
  for (const insert of insertStatementsNoDo) {
    const hasOnConflict = /\bON\s+CONFLICT\b/i.test(insert.statement);
    const hasWhereNotExists = /\bWHERE\s+NOT\s+EXISTS\b/i.test(insert.statement);
    if (!hasOnConflict && !hasWhereNotExists) {
      conflictGuardIssues.push(`Missing guard: ${summarizeSql(insert.statement)}`);
    }
  }
  results.push({
    rule: 'on-conflict-required',
    description: RULE_DESCRIPTIONS['on-conflict-required'],
    pass: conflictGuardIssues.length === 0,
    issues: conflictGuardIssues,
  });

  const refreshIssues: string[] = [];
  if (
    !/\bREFRESH\s+MATERIALIZED\s+VIEW(?:\s+CONCURRENTLY)?\s+material_search_index\s*;/i.test(
      commentStripped
    )
  ) {
    refreshIssues.push('Missing REFRESH MATERIALIZED VIEW material_search_index;');
  }
  results.push({
    rule: 'materialized-view-refresh',
    description: RULE_DESCRIPTIONS['materialized-view-refresh'],
    pass: refreshIssues.length === 0,
    issues: refreshIssues,
  });

  const enumIssues: string[] = [];
  for (const insert of insertStatements) {
    if (insert.table !== 'species_growing_profiles') continue;
    const sunIndex = insert.columns.indexOf('sun_requirement');
    if (sunIndex < 0) continue;

    for (const tuple of insert.tuples) {
      if (sunIndex >= tuple.length) continue;
      const literal = parseSingleQuotedLiteral(tuple[sunIndex]);
      if (literal === null) continue;
      if (!VALID_SUN_REQUIREMENTS.has(literal)) {
        enumIssues.push(`Invalid sun_requirement value: '${literal}'`);
      }
    }
  }
  results.push({
    rule: 'valid-enum-values',
    description: RULE_DESCRIPTIONS['valid-enum-values'],
    pass: enumIssues.length === 0,
    issues: [...new Set(enumIssues)],
  });

  return results;
}

async function runCli(): Promise<void> {
  const target = process.argv[2];
  if (!target) {
    console.error('Usage: npx tsx scripts/lint-migration.ts <sql-file-path>');
    process.exit(1);
  }

  const absolutePath = path.resolve(process.cwd(), target);
  const sql = await readFile(absolutePath, 'utf8');
  const results = lintMigrationSql(sql);
  const passed = results.filter((item) => item.pass).length;
  const total = results.length;

  console.log(`Linting: ${target}`);
  console.log();

  for (const result of results) {
    const status = result.pass ? 'PASS' : 'FAIL';
    const ruleLabel = result.rule.padEnd(26, ' ');
    console.log(`  [${status}] ${ruleLabel} ${result.description}`);
    if (!result.pass) {
      for (const issue of result.issues) {
        console.log(`         - ${issue}`);
      }
    }
  }

  console.log();
  const summary = passed === total ? 'PASS' : 'FAIL';
  console.log(`Result: ${summary} (${passed}/${total})`);
  process.exit(passed === total ? 0 : 1);
}

const scriptPath = fileURLToPath(import.meta.url);
const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';

if (invokedPath === scriptPath) {
  runCli().catch((error: unknown) => {
    console.error(`Lint failed: ${String(error)}`);
    process.exit(1);
  });
}
