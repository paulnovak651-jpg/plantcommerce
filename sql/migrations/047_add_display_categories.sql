BEGIN;

UPDATE plant_entities SET display_category = 'Currants & Gooseberries' WHERE genus = 'Ribes';
UPDATE plant_entities SET display_category = 'Berries' WHERE genus = 'Rubus';
UPDATE plant_entities SET display_category = 'Kiwi' WHERE genus = 'Actinidia';
UPDATE plant_entities SET display_category = 'Nitrogen Fixers' WHERE genus = 'Elaeagnus';
UPDATE plant_entities SET display_category = 'Berries' WHERE genus = 'Hippophae';
UPDATE plant_entities SET display_category = 'Shade Trees' WHERE genus = 'Celtis';

REFRESH MATERIALIZED VIEW material_search_index;

COMMIT;
