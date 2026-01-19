-- Add version tracking fields to project table
ALTER TABLE "project" ADD COLUMN "version_count" integer DEFAULT 0;
ALTER TABLE "project" ADD COLUMN "current_version_number" integer;
ALTER TABLE "project" ADD COLUMN "current_version_id" uuid;

-- Create project_version table
CREATE TABLE IF NOT EXISTS "project_version" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"created_by" uuid,
	"change_summary" text,
	"commit_sha" varchar(40),
	"vercel_deployment_id" varchar(128),
	"vercel_deployment_url" text,
	"metadata" json DEFAULT '{}',
	"files_manifest" json DEFAULT '{}',
	CONSTRAINT "project_version_project_id_version_number_unique" UNIQUE("project_id","version_number")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_project_version_project_id" ON "project_version" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_project_version_created_at" ON "project_version" USING btree ("created_at");--> statement-breakpoint

-- Create project_chat_origin table
CREATE TABLE IF NOT EXISTS "project_chat_origin" (
	"project_id" uuid PRIMARY KEY NOT NULL,
	"chat_thread_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"generation_prompt" text
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_project_chat_origin_thread_id" ON "project_chat_origin" USING btree ("chat_thread_id");--> statement-breakpoint

-- Add foreign key constraints
DO $$ BEGIN
ALTER TABLE "project" ADD CONSTRAINT "project_current_version_id_project_version_id_fk" FOREIGN KEY ("current_version_id") REFERENCES "public"."project_version"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "project_version" ADD CONSTRAINT "project_version_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "project_version" ADD CONSTRAINT "project_version_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "project_chat_origin" ADD CONSTRAINT "project_chat_origin_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "project_chat_origin" ADD CONSTRAINT "project_chat_origin_chat_thread_id_chat_thread_id_fk" FOREIGN KEY ("chat_thread_id") REFERENCES "public"."chat_thread"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
