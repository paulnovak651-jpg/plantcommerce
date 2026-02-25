-- ============================================================================
-- MIGRATION 006: Taxonomy Seed Data
-- Populates the taxonomy tree for permaculture food crop families.
-- Covers: Hazelnuts, Chestnuts, Walnuts/Hickories, Persimmons, Apples/Pears/
-- Stone fruit, Elderberry, Blueberries, Mulberries, Pawpaws, and more.
-- 
-- Run AFTER 002_taxonomy.sql
-- ============================================================================

BEGIN;

-- ============================================================================
-- SHARED ANCESTRY (Kingdom → Class → common Orders)
-- ============================================================================

-- Kingdom Plantae
INSERT INTO taxonomy_nodes (id, rank_id, name, common_name, slug, parent_id, notable_for_permaculture, display_order)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'kingdom'),
  'Plantae', 'Plants', 'plantae', NULL, TRUE, 1
) ON CONFLICT (slug) DO NOTHING;

-- Division Magnoliophyta (flowering plants)
INSERT INTO taxonomy_nodes (id, rank_id, name, common_name, slug, parent_id, notable_for_permaculture, display_order)
VALUES (
  'a0000000-0000-0000-0000-000000000002',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'division'),
  'Magnoliophyta', 'Flowering Plants', 'magnoliophyta',
  'a0000000-0000-0000-0000-000000000001', TRUE, 1
) ON CONFLICT (slug) DO NOTHING;

-- Class Magnoliopsida (dicots — most food trees)
INSERT INTO taxonomy_nodes (id, rank_id, name, common_name, slug, parent_id, notable_for_permaculture, display_order)
VALUES (
  'a0000000-0000-0000-0000-000000000003',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'class'),
  'Magnoliopsida', 'Dicotyledons', 'magnoliopsida',
  'a0000000-0000-0000-0000-000000000002', TRUE, 1
) ON CONFLICT (slug) DO NOTHING;

-- Class Liliopsida (monocots — not primary for permaculture trees, but included for completeness)
INSERT INTO taxonomy_nodes (id, rank_id, name, common_name, slug, parent_id, notable_for_permaculture, display_order)
VALUES (
  'a0000000-0000-0000-0000-000000000004',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'class'),
  'Liliopsida', 'Monocotyledons', 'liliopsida',
  'a0000000-0000-0000-0000-000000000002', FALSE, 2
) ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- ORDER: FAGALES (Beeches, Oaks, Birches — the nut tree order)
-- Contains: Hazelnuts, Chestnuts, Oaks, Walnuts, Hickories, Pecans
-- ============================================================================

INSERT INTO taxonomy_nodes (id, rank_id, name, common_name, slug, parent_id, notable_for_permaculture, display_order, description)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'order'),
  'Fagales', 'Beech & Nut Tree Order', 'fagales',
  'a0000000-0000-0000-0000-000000000003', TRUE, 1,
  'The dominant order for temperate nut crops. Includes hazelnuts, chestnuts, walnuts, hickories, pecans, and oaks.'
) ON CONFLICT (slug) DO NOTHING;

-- Family: Betulaceae (Birch family — includes Corylus/hazelnuts)
INSERT INTO taxonomy_nodes (id, rank_id, name, common_name, slug, parent_id, notable_for_permaculture, display_order, description)
VALUES (
  'c0000000-0000-0000-0000-000000000001',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'family'),
  'Betulaceae', 'Birch Family', 'betulaceae',
  'b0000000-0000-0000-0000-000000000001', TRUE, 1,
  'Wind-pollinated trees and shrubs. Includes hazelnuts (Corylus), birches (Betula), alders (Alnus), and hornbeams (Carpinus).'
) ON CONFLICT (slug) DO NOTHING;

-- Genus: Corylus (Hazelnuts) ← already have plant_entities for this
INSERT INTO taxonomy_nodes (id, rank_id, name, common_name, slug, parent_id, notable_for_permaculture, display_order, description)
VALUES (
  'd0000000-0000-0000-0000-000000000001',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'genus'),
  'Corylus', 'Hazelnuts & Filberts', 'genus-corylus',
  'c0000000-0000-0000-0000-000000000001', TRUE, 1,
  'Deciduous shrubs and small trees prized for edible nuts. Wind-pollinated, requiring cross-pollination between compatible S-allele groups.'
) ON CONFLICT (slug) DO NOTHING;

-- Genus: Alnus (Alders — nitrogen fixers, important in permaculture)
INSERT INTO taxonomy_nodes (id, rank_id, name, common_name, slug, parent_id, notable_for_permaculture, display_order, description)
VALUES (
  'd0000000-0000-0000-0000-000000000002',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'genus'),
  'Alnus', 'Alders', 'genus-alnus',
  'c0000000-0000-0000-0000-000000000001', TRUE, 2,
  'Nitrogen-fixing trees. Critical support species in permaculture food forests. Not a food crop but enables food crops nearby.'
) ON CONFLICT (slug) DO NOTHING;

-- Family: Fagaceae (Beech family — chestnuts, oaks)
INSERT INTO taxonomy_nodes (id, rank_id, name, common_name, slug, parent_id, notable_for_permaculture, display_order, description)
VALUES (
  'c0000000-0000-0000-0000-000000000002',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'family'),
  'Fagaceae', 'Beech Family', 'fagaceae',
  'b0000000-0000-0000-0000-000000000001', TRUE, 2,
  'Major nut-producing family. Includes chestnuts (Castanea), oaks (Quercus), and beeches (Fagus).'
) ON CONFLICT (slug) DO NOTHING;

-- Genus: Castanea (Chestnuts)
INSERT INTO taxonomy_nodes (id, rank_id, name, common_name, slug, parent_id, notable_for_permaculture, display_order, description)
VALUES (
  'd0000000-0000-0000-0000-000000000003',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'genus'),
  'Castanea', 'Chestnuts', 'genus-castanea',
  'c0000000-0000-0000-0000-000000000002', TRUE, 1,
  'Large trees producing starchy edible nuts. American chestnut nearly eliminated by blight; Chinese, Japanese, and hybrid varieties dominate modern plantings.'
) ON CONFLICT (slug) DO NOTHING;

-- Genus: Quercus (Oaks — acorn production)
INSERT INTO taxonomy_nodes (id, rank_id, name, common_name, slug, parent_id, notable_for_permaculture, display_order, description)
VALUES (
  'd0000000-0000-0000-0000-000000000004',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'genus'),
  'Quercus', 'Oaks', 'genus-quercus',
  'c0000000-0000-0000-0000-000000000002', TRUE, 2,
  'Acorns are an underutilized food source. White oaks produce sweeter, lower-tannin acorns. Massive wildlife value.'
) ON CONFLICT (slug) DO NOTHING;

-- Family: Juglandaceae (Walnut family)
INSERT INTO taxonomy_nodes (id, rank_id, name, common_name, slug, parent_id, notable_for_permaculture, display_order, description)
VALUES (
  'c0000000-0000-0000-0000-000000000003',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'family'),
  'Juglandaceae', 'Walnut Family', 'juglandaceae',
  'b0000000-0000-0000-0000-000000000001', TRUE, 3,
  'Walnuts, hickories, and pecans. Many produce juglone, which inhibits nearby plant growth — critical consideration for food forest design.'
) ON CONFLICT (slug) DO NOTHING;

-- Genus: Juglans (Walnuts)
INSERT INTO taxonomy_nodes (id, rank_id, name, common_name, slug, parent_id, notable_for_permaculture, display_order, description)
VALUES (
  'd0000000-0000-0000-0000-000000000005',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'genus'),
  'Juglans', 'Walnuts', 'genus-juglans',
  'c0000000-0000-0000-0000-000000000003', TRUE, 1,
  'High-value nut trees. English/Persian walnut (J. regia), black walnut (J. nigra), butternut (J. cinerea). All produce juglone.'
) ON CONFLICT (slug) DO NOTHING;

-- Genus: Carya (Hickories & Pecans)
INSERT INTO taxonomy_nodes (id, rank_id, name, common_name, slug, parent_id, notable_for_permaculture, display_order, description)
VALUES (
  'd0000000-0000-0000-0000-000000000006',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'genus'),
  'Carya', 'Hickories & Pecans', 'genus-carya',
  'c0000000-0000-0000-0000-000000000003', TRUE, 2,
  'Pecans (C. illinoinensis), shagbark hickory (C. ovata), shellbark hickory (C. laciniosa). Northern pecans and hicans expanding into colder zones.'
) ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- ORDER: ROSALES (Roses — apples, pears, stone fruit, mulberries, elms)
-- ============================================================================

INSERT INTO taxonomy_nodes (id, rank_id, name, common_name, slug, parent_id, notable_for_permaculture, display_order, description)
VALUES (
  'b0000000-0000-0000-0000-000000000002',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'order'),
  'Rosales', 'Rose Order', 'rosales',
  'a0000000-0000-0000-0000-000000000003', TRUE, 2,
  'Contains the vast majority of temperate fruit crops: apples, pears, plums, cherries, peaches, and mulberries.'
) ON CONFLICT (slug) DO NOTHING;

-- Family: Rosaceae (Rose family — the big one)
INSERT INTO taxonomy_nodes (id, rank_id, name, common_name, slug, parent_id, notable_for_permaculture, display_order, description)
VALUES (
  'c0000000-0000-0000-0000-000000000004',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'family'),
  'Rosaceae', 'Rose Family', 'rosaceae',
  'b0000000-0000-0000-0000-000000000002', TRUE, 1,
  'The most important fruit tree family. Apples, pears, plums, cherries, peaches, apricots, and many berries.'
) ON CONFLICT (slug) DO NOTHING;

-- Genus: Malus (Apples)
INSERT INTO taxonomy_nodes (id, rank_id, name, common_name, slug, parent_id, notable_for_permaculture, display_order, description)
VALUES (
  'd0000000-0000-0000-0000-000000000007',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'genus'),
  'Malus', 'Apples & Crabapples', 'genus-malus',
  'c0000000-0000-0000-0000-000000000004', TRUE, 1,
  'The world''s most cultivated tree fruit. Vast cultivar diversity from dessert to cider. Most require cross-pollination by bloom group.'
) ON CONFLICT (slug) DO NOTHING;

-- Genus: Pyrus (Pears)
INSERT INTO taxonomy_nodes (id, rank_id, name, common_name, slug, parent_id, notable_for_permaculture, display_order, description)
VALUES (
  'd0000000-0000-0000-0000-000000000008',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'genus'),
  'Pyrus', 'Pears', 'genus-pyrus',
  'c0000000-0000-0000-0000-000000000004', TRUE, 2,
  'European pears (P. communis) and Asian pears (P. pyrifolia). Long-lived, productive trees. Fire blight is the major challenge.'
) ON CONFLICT (slug) DO NOTHING;

-- Genus: Prunus (Stone fruit)
INSERT INTO taxonomy_nodes (id, rank_id, name, common_name, slug, parent_id, notable_for_permaculture, display_order, description)
VALUES (
  'd0000000-0000-0000-0000-000000000009',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'genus'),
  'Prunus', 'Stone Fruit', 'genus-prunus',
  'c0000000-0000-0000-0000-000000000004', TRUE, 3,
  'Plums, cherries, peaches, apricots, almonds, and nectarines. Huge genus with complex interspecific grafting compatibility.'
) ON CONFLICT (slug) DO NOTHING;

-- Family: Moraceae (Mulberry family)
INSERT INTO taxonomy_nodes (id, rank_id, name, common_name, slug, parent_id, notable_for_permaculture, display_order, description)
VALUES (
  'c0000000-0000-0000-0000-000000000005',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'family'),
  'Moraceae', 'Mulberry Family', 'moraceae',
  'b0000000-0000-0000-0000-000000000002', TRUE, 2,
  'Includes mulberries (Morus), figs (Ficus), and osage orange (Maclura). Fast-growing, productive fruit trees.'
) ON CONFLICT (slug) DO NOTHING;

-- Genus: Morus (Mulberries)
INSERT INTO taxonomy_nodes (id, rank_id, name, common_name, slug, parent_id, notable_for_permaculture, display_order, description)
VALUES (
  'd0000000-0000-0000-0000-000000000010',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'genus'),
  'Morus', 'Mulberries', 'genus-morus',
  'c0000000-0000-0000-0000-000000000005', TRUE, 1,
  'Fast-growing, heavy-bearing fruit trees. White mulberry (M. alba), red mulberry (M. rubra). Some cultivars are dioecious.'
) ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- ORDER: EBENALES / ERICALES (Persimmons, Blueberries)
-- ============================================================================

INSERT INTO taxonomy_nodes (id, rank_id, name, common_name, slug, parent_id, notable_for_permaculture, display_order, description)
VALUES (
  'b0000000-0000-0000-0000-000000000003',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'order'),
  'Ericales', 'Heath Order', 'ericales',
  'a0000000-0000-0000-0000-000000000003', TRUE, 3,
  'Includes persimmons and blueberries — both acid-loving. Also tea (Camellia) and kiwifruit (Actinidia).'
) ON CONFLICT (slug) DO NOTHING;

-- Family: Ebenaceae (Ebony family — persimmons)
INSERT INTO taxonomy_nodes (id, rank_id, name, common_name, slug, parent_id, notable_for_permaculture, display_order, description)
VALUES (
  'c0000000-0000-0000-0000-000000000006',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'family'),
  'Ebenaceae', 'Ebony Family', 'ebenaceae',
  'b0000000-0000-0000-0000-000000000003', TRUE, 1,
  'Home to persimmons. American persimmon (D. virginiana) is extremely cold-hardy; Asian persimmon (D. kaki) is the commercial standard.'
) ON CONFLICT (slug) DO NOTHING;

-- Genus: Diospyros (Persimmons)
INSERT INTO taxonomy_nodes (id, rank_id, name, common_name, slug, parent_id, notable_for_permaculture, display_order, description)
VALUES (
  'd0000000-0000-0000-0000-000000000011',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'genus'),
  'Diospyros', 'Persimmons', 'genus-diospyros',
  'c0000000-0000-0000-0000-000000000006', TRUE, 1,
  'American persimmon (D. virginiana) hardy to zone 4. Asian persimmon (D. kaki) zone 7+. Most are dioecious — need male and female trees.'
) ON CONFLICT (slug) DO NOTHING;

-- Family: Ericaceae (Heath family — blueberries)
INSERT INTO taxonomy_nodes (id, rank_id, name, common_name, slug, parent_id, notable_for_permaculture, display_order, description)
VALUES (
  'c0000000-0000-0000-0000-000000000007',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'family'),
  'Ericaceae', 'Heath Family', 'ericaceae',
  'b0000000-0000-0000-0000-000000000003', TRUE, 2,
  'Acid-loving shrubs. Blueberries, cranberries, huckleberries, lingonberries. Require low pH soil.'
) ON CONFLICT (slug) DO NOTHING;

-- Genus: Vaccinium (Blueberries)
INSERT INTO taxonomy_nodes (id, rank_id, name, common_name, slug, parent_id, notable_for_permaculture, display_order, description)
VALUES (
  'd0000000-0000-0000-0000-000000000012',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'genus'),
  'Vaccinium', 'Blueberries & Relatives', 'genus-vaccinium',
  'c0000000-0000-0000-0000-000000000007', TRUE, 1,
  'Highbush (V. corymbosum), lowbush (V. angustifolium), and rabbiteye (V. virgatum) blueberries. Also cranberries and huckleberries.'
) ON CONFLICT (slug) DO NOTHING;

-- Family: Actinidiaceae (Kiwifruit)
INSERT INTO taxonomy_nodes (id, rank_id, name, common_name, slug, parent_id, notable_for_permaculture, display_order, description)
VALUES (
  'c0000000-0000-0000-0000-000000000008',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'family'),
  'Actinidiaceae', 'Kiwifruit Family', 'actinidiaceae',
  'b0000000-0000-0000-0000-000000000003', TRUE, 3,
  'Home to kiwifruit. Hardy kiwi (A. arguta) is a vigorous vine hardy to zone 4. Dioecious — needs male pollinizer.'
) ON CONFLICT (slug) DO NOTHING;

-- Genus: Actinidia (Kiwifruit)
INSERT INTO taxonomy_nodes (id, rank_id, name, common_name, slug, parent_id, notable_for_permaculture, display_order, description)
VALUES (
  'd0000000-0000-0000-0000-000000000013',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'genus'),
  'Actinidia', 'Kiwifruit', 'genus-actinidia',
  'c0000000-0000-0000-0000-000000000008', TRUE, 1,
  'Hardy kiwi (A. arguta), fuzzy kiwi (A. deliciosa), arctic kiwi (A. kolomikta). Vigorous vines, most dioecious.'
) ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- ORDER: DIPSACALES (Elderberry, Viburnums)
-- ============================================================================

INSERT INTO taxonomy_nodes (id, rank_id, name, common_name, slug, parent_id, notable_for_permaculture, display_order, description)
VALUES (
  'b0000000-0000-0000-0000-000000000004',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'order'),
  'Dipsacales', 'Teasel Order', 'dipsacales',
  'a0000000-0000-0000-0000-000000000003', TRUE, 4,
  'Includes elderberries and viburnums — important permaculture shrubs.'
) ON CONFLICT (slug) DO NOTHING;

-- Family: Adoxaceae (Moschatel family — elderberry)
INSERT INTO taxonomy_nodes (id, rank_id, name, common_name, slug, parent_id, notable_for_permaculture, display_order, description)
VALUES (
  'c0000000-0000-0000-0000-000000000009',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'family'),
  'Adoxaceae', 'Moschatel Family', 'adoxaceae',
  'b0000000-0000-0000-0000-000000000004', TRUE, 1,
  'Elderberries and viburnums. Fast-growing, multi-use shrubs critical to permaculture edge plantings.'
) ON CONFLICT (slug) DO NOTHING;

-- Genus: Sambucus (Elderberry)
INSERT INTO taxonomy_nodes (id, rank_id, name, common_name, slug, parent_id, notable_for_permaculture, display_order, description)
VALUES (
  'd0000000-0000-0000-0000-000000000014',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'genus'),
  'Sambucus', 'Elderberries', 'genus-sambucus',
  'c0000000-0000-0000-0000-000000000009', TRUE, 1,
  'Fast-growing shrubs valued for berries (syrup, wine, medicine) and flowers. Cross-pollination improves yield. American elderberry (S. canadensis/nigra ssp. canadensis) is the primary food species.'
) ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- ORDER: MAGNOLIALES (Pawpaws)
-- ============================================================================

INSERT INTO taxonomy_nodes (id, rank_id, name, common_name, slug, parent_id, notable_for_permaculture, display_order, description)
VALUES (
  'b0000000-0000-0000-0000-000000000005',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'order'),
  'Magnoliales', 'Magnolia Order', 'magnoliales',
  'a0000000-0000-0000-0000-000000000003', TRUE, 5,
  'Ancient order of flowering plants. Includes pawpaws — the largest native fruit in North America.'
) ON CONFLICT (slug) DO NOTHING;

-- Family: Annonaceae (Custard apple family — pawpaws)
INSERT INTO taxonomy_nodes (id, rank_id, name, common_name, slug, parent_id, notable_for_permaculture, display_order, description)
VALUES (
  'c0000000-0000-0000-0000-000000000010',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'family'),
  'Annonaceae', 'Custard Apple Family', 'annonaceae',
  'b0000000-0000-0000-0000-000000000005', TRUE, 1,
  'Tropical family with one remarkable temperate member: the pawpaw (Asimina triloba).'
) ON CONFLICT (slug) DO NOTHING;

-- Genus: Asimina (Pawpaws)
INSERT INTO taxonomy_nodes (id, rank_id, name, common_name, slug, parent_id, notable_for_permaculture, display_order, description)
VALUES (
  'd0000000-0000-0000-0000-000000000015',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'genus'),
  'Asimina', 'Pawpaws', 'genus-asimina',
  'c0000000-0000-0000-0000-000000000010', TRUE, 1,
  'North America''s largest native fruit. Tropical flavor (banana-mango-custard). Hardy to zone 5. Cross-pollination required. Growing cultivar market.'
) ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- ORDER: VITALES (Grapes)
-- ============================================================================

INSERT INTO taxonomy_nodes (id, rank_id, name, common_name, slug, parent_id, notable_for_permaculture, display_order, description)
VALUES (
  'b0000000-0000-0000-0000-000000000006',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'order'),
  'Vitales', 'Grape Order', 'vitales',
  'a0000000-0000-0000-0000-000000000003', TRUE, 6,
  'Grapes and Virginia creeper. Vines critical for vertical food forest layering.'
) ON CONFLICT (slug) DO NOTHING;

-- Family: Vitaceae
INSERT INTO taxonomy_nodes (id, rank_id, name, common_name, slug, parent_id, notable_for_permaculture, display_order, description)
VALUES (
  'c0000000-0000-0000-0000-000000000011',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'family'),
  'Vitaceae', 'Grape Family', 'vitaceae',
  'b0000000-0000-0000-0000-000000000006', TRUE, 1,
  'Climbing vines. Grapes (Vitis) are among the most valuable permaculture crops — fresh eating, wine, raisins, juice.'
) ON CONFLICT (slug) DO NOTHING;

-- Genus: Vitis (Grapes)
INSERT INTO taxonomy_nodes (id, rank_id, name, common_name, slug, parent_id, notable_for_permaculture, display_order, description)
VALUES (
  'd0000000-0000-0000-0000-000000000016',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'genus'),
  'Vitis', 'Grapes', 'genus-vitis',
  'c0000000-0000-0000-0000-000000000011', TRUE, 1,
  'Wine grapes (V. vinifera), American grapes (V. labrusca), muscadine (V. rotundifolia). Enormous cultivar diversity. Most self-fertile.'
) ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- Link existing plant_entities to their taxonomy genus nodes
-- ============================================================================

UPDATE plant_entities 
SET taxonomy_node_id = 'd0000000-0000-0000-0000-000000000001'  -- Corylus
WHERE genus = 'Corylus' AND taxonomy_node_id IS NULL;

-- Gevuina is in Proteaceae (not yet in our tree, but we can add it)
-- For now, leave it unlinked — it's an edge case

COMMIT;
