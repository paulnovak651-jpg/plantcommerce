import { describe, expect, it } from 'vitest';
import { lintMigrationSql, type LintResult, type RuleId } from '../lint-migration';

function getRule(results: LintResult[], rule: RuleId): LintResult {
  const found = results.find((item) => item.rule === rule);
  if (!found) throw new Error(`Missing lint rule result: ${rule}`);
  return found;
}

describe('lintMigrationSql', () => {
  describe('begin-commit', () => {
    it('passes when BEGIN and COMMIT are present', () => {
      const sql = `
        BEGIN;
        REFRESH MATERIALIZED VIEW material_search_index;
        COMMIT;
      `;
      const result = getRule(lintMigrationSql(sql), 'begin-commit');
      expect(result.pass).toBe(true);
    });

    it('fails when BEGIN is missing', () => {
      const sql = `
        REFRESH MATERIALIZED VIEW material_search_index;
        COMMIT;
      `;
      const result = getRule(lintMigrationSql(sql), 'begin-commit');
      expect(result.pass).toBe(false);
      expect(result.issues.join(' ')).toContain('BEGIN');
    });

    it('fails when COMMIT is missing', () => {
      const sql = `
        BEGIN;
        REFRESH MATERIALIZED VIEW material_search_index;
      `;
      const result = getRule(lintMigrationSql(sql), 'begin-commit');
      expect(result.pass).toBe(false);
      expect(result.issues.join(' ')).toContain('COMMIT');
    });
  });

  describe('wrong-column-names', () => {
    it('catches soil_textures', () => {
      const result = getRule(
        lintMigrationSql('BEGIN; SELECT soil_textures FROM x; COMMIT;'),
        'wrong-column-names'
      );
      expect(result.pass).toBe(false);
    });

    it('catches root_type', () => {
      const result = getRule(
        lintMigrationSql('BEGIN; SELECT root_type FROM x; COMMIT;'),
        'wrong-column-names'
      );
      expect(result.pass).toBe(false);
    });

    it('catches native_range but not native_range_description', () => {
      const fail = getRule(
        lintMigrationSql('BEGIN; SELECT native_range FROM x; COMMIT;'),
        'wrong-column-names'
      );
      const pass = getRule(
        lintMigrationSql('BEGIN; SELECT native_range_description FROM x; COMMIT;'),
        'wrong-column-names'
      );
      expect(fail.pass).toBe(false);
      expect(pass.pass).toBe(true);
    });

    it('catches data_source string literal in species_growing_profiles', () => {
      const sql = `
        BEGIN;
        INSERT INTO species_growing_profiles (plant_entity_id, sun_requirement, data_source, curation_status)
        VALUES ('abc', 'full_sun', 'Source text', 'published')
        ON CONFLICT (plant_entity_id) DO NOTHING;
        REFRESH MATERIALIZED VIEW material_search_index;
        COMMIT;
      `;
      const result = getRule(lintMigrationSql(sql), 'wrong-column-names');
      expect(result.pass).toBe(false);
      expect(result.issues.join(' ')).toContain('data_source');
    });

    it('does not flag plant_entity_parents.data_source', () => {
      const sql = `
        BEGIN;
        INSERT INTO plant_entity_parents (hybrid_id, parent_id, data_source)
        VALUES ('h', 'p', 'legit here')
        ON CONFLICT DO NOTHING;
        REFRESH MATERIALIZED VIEW material_search_index;
        COMMIT;
      `;
      const result = getRule(lintMigrationSql(sql), 'wrong-column-names');
      expect(result.pass).toBe(true);
    });
  });

  describe('no-concurrent-refresh', () => {
    it('fails on CONCURRENTLY', () => {
      const sql = `
        BEGIN;
        REFRESH MATERIALIZED VIEW CONCURRENTLY material_search_index;
        COMMIT;
      `;
      const result = getRule(lintMigrationSql(sql), 'no-concurrent-refresh');
      expect(result.pass).toBe(false);
    });

    it('passes on plain REFRESH', () => {
      const sql = `
        BEGIN;
        REFRESH MATERIALIZED VIEW material_search_index;
        COMMIT;
      `;
      const result = getRule(lintMigrationSql(sql), 'no-concurrent-refresh');
      expect(result.pass).toBe(true);
    });
  });

  describe('no-full-to-part-sun', () => {
    it('fails on full_to_part_sun', () => {
      const sql = `
        BEGIN;
        INSERT INTO species_growing_profiles (plant_entity_id, sun_requirement, curation_status)
        VALUES ('abc', 'full_to_part_sun', 'published')
        ON CONFLICT (plant_entity_id) DO NOTHING;
        REFRESH MATERIALIZED VIEW material_search_index;
        COMMIT;
      `;
      const result = getRule(lintMigrationSql(sql), 'no-full-to-part-sun');
      expect(result.pass).toBe(false);
    });
  });

  describe('on-conflict-required', () => {
    it('passes when all INSERTs have ON CONFLICT', () => {
      const sql = `
        BEGIN;
        INSERT INTO t (id) VALUES (1) ON CONFLICT DO NOTHING;
        INSERT INTO t (id) VALUES (2) ON CONFLICT DO NOTHING;
        REFRESH MATERIALIZED VIEW material_search_index;
        COMMIT;
      `;
      const result = getRule(lintMigrationSql(sql), 'on-conflict-required');
      expect(result.pass).toBe(true);
    });

    it('fails on bare INSERT without guard', () => {
      const sql = `
        BEGIN;
        INSERT INTO t (id) VALUES (1);
        REFRESH MATERIALIZED VIEW material_search_index;
        COMMIT;
      `;
      const result = getRule(lintMigrationSql(sql), 'on-conflict-required');
      expect(result.pass).toBe(false);
    });

    it('passes when guarded by WHERE NOT EXISTS', () => {
      const sql = `
        BEGIN;
        INSERT INTO t (id)
        SELECT 1
        WHERE NOT EXISTS (SELECT 1 FROM t WHERE id = 1);
        REFRESH MATERIALIZED VIEW material_search_index;
        COMMIT;
      `;
      const result = getRule(lintMigrationSql(sql), 'on-conflict-required');
      expect(result.pass).toBe(true);
    });

    it('ignores INSERT statements inside DO $$ blocks', () => {
      const sql = `
        BEGIN;
        DO $$
        BEGIN
          INSERT INTO t (id) VALUES (1);
        END $$;
        REFRESH MATERIALIZED VIEW material_search_index;
        COMMIT;
      `;
      const result = getRule(lintMigrationSql(sql), 'on-conflict-required');
      expect(result.pass).toBe(true);
    });
  });

  describe('materialized-view-refresh', () => {
    it('fails when material_search_index refresh is missing', () => {
      const sql = `
        BEGIN;
        INSERT INTO t (id) VALUES (1) ON CONFLICT DO NOTHING;
        COMMIT;
      `;
      const result = getRule(lintMigrationSql(sql), 'materialized-view-refresh');
      expect(result.pass).toBe(false);
    });

    it('passes when refresh is present', () => {
      const sql = `
        BEGIN;
        REFRESH MATERIALIZED VIEW material_search_index;
        COMMIT;
      `;
      const result = getRule(lintMigrationSql(sql), 'materialized-view-refresh');
      expect(result.pass).toBe(true);
    });
  });

  describe('valid-enum-values', () => {
    it('fails on invalid sun_requirement literal', () => {
      const sql = `
        BEGIN;
        INSERT INTO species_growing_profiles (plant_entity_id, sun_requirement, curation_status, data_sources)
        VALUES ('abc', 'bright_light', 'published', ARRAY['x'])
        ON CONFLICT (plant_entity_id) DO NOTHING;
        REFRESH MATERIALIZED VIEW material_search_index;
        COMMIT;
      `;
      const result = getRule(lintMigrationSql(sql), 'valid-enum-values');
      expect(result.pass).toBe(false);
      expect(result.issues.join(' ')).toContain('bright_light');
    });

    it('passes on allowed sun_requirement literals', () => {
      const sql = `
        BEGIN;
        INSERT INTO species_growing_profiles (plant_entity_id, sun_requirement, curation_status, data_sources)
        VALUES ('abc', 'part_shade', 'published', ARRAY['x'])
        ON CONFLICT (plant_entity_id) DO NOTHING;
        REFRESH MATERIALIZED VIEW material_search_index;
        COMMIT;
      `;
      const result = getRule(lintMigrationSql(sql), 'valid-enum-values');
      expect(result.pass).toBe(true);
    });
  });

  it('passes all rules for a well-formed snippet', () => {
    const sql = `
      BEGIN;

      INSERT INTO species_growing_profiles (
        plant_entity_id,
        sun_requirement,
        growth_rate,
        usda_zone_min,
        usda_zone_max,
        data_sources,
        curation_status
      ) VALUES (
        'abc',
        'full_sun',
        'moderate',
        4,
        8,
        ARRAY['guide'],
        'published'
      ) ON CONFLICT (plant_entity_id) DO NOTHING;

      INSERT INTO plant_entity_parents (hybrid_id, parent_id, data_source)
      SELECT 'h', 'p', 'allowed here'
      WHERE NOT EXISTS (SELECT 1);

      REFRESH MATERIALIZED VIEW material_search_index;
      COMMIT;
    `;

    const results = lintMigrationSql(sql);
    for (const result of results) {
      expect(result.pass).toBe(true);
    }
  });
});
