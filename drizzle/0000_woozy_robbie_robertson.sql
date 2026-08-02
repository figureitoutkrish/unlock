CREATE TYPE "public"."event_type" AS ENUM('click', 'unlock', 'redirect', 'iab_detected', 'iab_escaped');--> statement-breakpoint
CREATE TYPE "public"."unlock_mode" AS ENUM('instant', 'email_gate', 'community_gate');--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" text PRIMARY KEY NOT NULL,
	"link_id" text NOT NULL,
	"event_type" "event_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"meta" jsonb
);
--> statement-breakpoint
CREATE TABLE "captured_emails" (
	"id" text PRIMARY KEY NOT NULL,
	"link_id" text NOT NULL,
	"user_id" text NOT NULL,
	"email" text NOT NULL,
	"captured_at" timestamp DEFAULT now() NOT NULL,
	"visitor_ip" text,
	"country" text,
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "links" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"destination" text NOT NULL,
	"unlock_mode" "unlock_mode" DEFAULT 'instant' NOT NULL,
	"label" text,
	"email_gate_headline" text,
	"email_gate_cta" text,
	"community_type" text,
	"community_url" text,
	"community_label" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"plan" text DEFAULT 'free' NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_link_id_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "captured_emails" ADD CONSTRAINT "captured_emails_link_id_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "captured_emails" ADD CONSTRAINT "captured_emails_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "links" ADD CONSTRAINT "links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;