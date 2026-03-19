CREATE TABLE IF NOT EXISTS "asset_types" (
	"code" varchar(10) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"useful_life_months" integer NOT NULL,
	"depreciation_method" "depreciation_method" DEFAULT 'SLM' NOT NULL
);

ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "asset_type_code" varchar(10);
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "specification" text;
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "description" text;

DO $$ BEGIN
 ALTER TABLE "assets" ADD CONSTRAINT "assets_asset_type_code_asset_types_code_fk" FOREIGN KEY ("asset_type_code") REFERENCES "public"."asset_types"("code") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
