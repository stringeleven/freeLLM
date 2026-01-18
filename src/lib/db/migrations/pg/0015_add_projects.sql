CREATE TABLE IF NOT EXISTS "project" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"external_project_id" varchar(128) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" varchar(32) DEFAULT 'draft',
	"template_used" varchar(64),
	"vercel_preview_url" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"last_activity_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "project_user_id_external_project_id_unique" UNIQUE("user_id","external_project_id"),
	CONSTRAINT "project_user_id_name_unique" UNIQUE("user_id","name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "project_file" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"version_id" uuid,
	"path" text NOT NULL,
	"mime_type" varchar(128) DEFAULT 'text/plain',
	"size_bytes" varchar(32),
	"content_hash" varchar(64),
	"blob_path" text NOT NULL,
	"last_modified_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"is_binary" boolean DEFAULT false
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_project_user_id" ON "project" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_project_last_activity_at" ON "project" USING btree ("last_activity_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_project_file_project_id" ON "project_file" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_project_file_project_path" ON "project_file" USING btree ("project_id","path");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_project_file_unique_working" ON "project_file" ("project_id", "path") WHERE "version_id" IS NULL;--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "project" ADD CONSTRAINT "project_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "project_file" ADD CONSTRAINT "project_file_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
