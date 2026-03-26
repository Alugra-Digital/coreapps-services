-- Make asset_id nullable in asset_acquisition_journals (asset may not exist yet when auto-generating)
ALTER TABLE asset_acquisition_journals ALTER COLUMN asset_id DROP NOT NULL;
