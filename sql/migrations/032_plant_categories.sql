BEGIN;

-- Add a display_category column for homepage grouping.
ALTER TABLE plant_entities
  ADD COLUMN IF NOT EXISTS display_category TEXT;

-- Assign categories by genus.
UPDATE plant_entities SET display_category = 'Nut Trees' WHERE genus IN ('Castanea', 'Juglans', 'Carya', 'Corylus');
UPDATE plant_entities SET display_category = 'Apples & Crabapples' WHERE genus = 'Malus';
UPDATE plant_entities SET display_category = 'Stone Fruit' WHERE genus = 'Prunus';
UPDATE plant_entities SET display_category = 'Pears' WHERE genus = 'Pyrus';
UPDATE plant_entities SET display_category = 'Berries' WHERE genus = 'Vaccinium';
UPDATE plant_entities SET display_category = 'Grapes' WHERE genus = 'Vitis';
UPDATE plant_entities SET display_category = 'Persimmons' WHERE genus = 'Diospyros';
UPDATE plant_entities SET display_category = 'Mulberries' WHERE genus = 'Morus';
UPDATE plant_entities SET display_category = 'Elderberries' WHERE genus = 'Sambucus';
UPDATE plant_entities SET display_category = 'Pawpaw' WHERE genus = 'Asimina';
UPDATE plant_entities SET display_category = 'Oaks' WHERE genus = 'Quercus';
UPDATE plant_entities SET display_category = 'Figs' WHERE genus = 'Ficus';
UPDATE plant_entities SET display_category = 'Other' WHERE display_category IS NULL;

COMMIT;
