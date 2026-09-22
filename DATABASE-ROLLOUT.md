# Database hardening rollout

These changes are implemented locally. They have NOT been applied to the hosted Supabase database.

## Configuration

Keep these values in `.env.local` and in the production host's secret settings; never use a `NEXT_PUBLIC_` prefix for them:

- `SUPABASE_SERVICE_ROLE_KEY`: Supabase server secret/service-role credential, used only by server modules for reviews and copy counts.
- `DIRECT_URL`: PostgreSQL connection string for applying migrations. The existing `DATABASE_URL` remains needed at runtime by `/sitemap.xml`.
- `TRUSTED_CLIENT_IP_HEADER`: optional header name that your trusted reverse proxy **overwrites** with the real client IP. Do not choose a header clients can supply unchanged. Without this setting, anonymous and member requests share a conservative site-wide bucket (20 copy records/minute and 10 review writes/minute). Configure it before a public rollout.

The rate bucket stores an HMAC, never a raw IP. Buckets expire after a minute and old entries are pruned on subsequent requests. Counts are shared between server instances.

## Apply

Use a staging database with the existing SQL migrations applied first. Run:

```sh
node scripts/apply-hardening.mjs --check
node scripts/apply-hardening.mjs
```

The script applies these three files in one transaction, with a 10-second lock timeout:

1. `prisma/sql/harden-reviews-and-copies.sql`
2. `prisma/sql/atomic-save-prompt.sql`
3. `prisma/sql/search-indexes.sql`

The search indexes use regular CREATE INDEX and may wait for/block writes on a populated database. Schedule the production upgrade for a maintenance window. Deploy the matching app immediately after the migration; old clients cannot write reviews/copy counts directly after this upgrade.

## Behavior changes

- Public review reads use a server RPC which omits author IDs, guest secrets and anonymous profiles. Direct table reads are restricted to administrators and a member's own reviews. Review moderation remains available to admins.
- Guest ownership is proven with a 256-bit random HttpOnly cookie; only its SHA-256 hash reaches the database. Losing the cookie loses guest management access. Legacy guest reviews are preserved but can only be moderated by admins because their public review IDs never proved ownership. Old localStorage IDs are not accepted as credentials.
- Guest copy identity also moves to this cookie. Existing copy rows/counts are preserved; returning guests can count once more after the transition because old browser IDs cannot safely establish identity.
- Copy rows and counts commit together. Direct writes and the old increment RPC are closed to browser roles. The clipboard still works when recording is unavailable.
- The prompt RPC derives its owner from the authenticated JWT, validates ownership and commits prompt/model/example changes together. Uploads happen first and are reused during retries. Storage is not part of the PostgreSQL transaction: abandoned uploads can remain and need a separate retention/cleanup policy. Do not delete files on an ambiguous network failure because the transaction may have committed.
- Failed pagination leaves existing results visible and supports retry. Model filters execute as a database join, with one extra result to determine the next page rather than an exact total count.

## Verification

```sh
npm test
npm run lint
npm run typecheck
npm run build
```

The database tests run PostgreSQL locally using PGlite, with permissive legacy policies to verify that the new restrictions hold. They cover anonymous author privacy, guest ownership, direct API bypass attempts, bans, profanity triggers, deduplication, failed transaction rollback, rate limits, private prompts and migration reapplication. They do not inspect the hosted database's additional functions, triggers or policies; review `--check` output and exercise member/guest/admin flows in staging before rollout.
