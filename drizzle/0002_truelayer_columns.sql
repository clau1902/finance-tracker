-- Rename Yapily columns to TrueLayer (safe: only if old names still exist)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'accounts' AND column_name = 'yapily_account_id'
  ) THEN
    ALTER TABLE accounts RENAME COLUMN yapily_account_id TO truelayer_account_id;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'accounts' AND column_name = 'yapily_consent_token'
  ) THEN
    ALTER TABLE accounts RENAME COLUMN yapily_consent_token TO truelayer_access_token;
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "currency" text NOT NULL DEFAULT 'USD';
--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "retired" boolean NOT NULL DEFAULT false;
