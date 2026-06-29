#!/usr/bin/env bash
set -euo pipefail

API_URL="https://s4f5vebr.us-east.insforge.app"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "→ InsForge login required (browser or INSFORGE_EMAIL + INSFORGE_PASSWORD)"
npx @insforge/cli@latest login --email 2>/dev/null || npx @insforge/cli@latest login
npx @insforge/cli@latest link --api-url "$API_URL" --yes

patch_dates() {
  local file="$1"
  sed 's/2026-06-21/2026-07-10/g; s/2026-06-26/2026-07-31/g' "$file"
}

echo "→ Pulling live functions, patching July 10–31 window, deploying…"
npx @insforge/cli@latest functions code availability > /tmp/availability.ts
patch_dates /tmp/availability.ts > /tmp/availability-patched.ts
npx @insforge/cli@latest functions deploy availability --file /tmp/availability-patched.ts -y

npx @insforge/cli@latest functions code book > /tmp/book.ts
patch_dates /tmp/book.ts > /tmp/book-patched.ts
npx @insforge/cli@latest functions deploy book --file /tmp/book-patched.ts -y

echo "✓ Deployed. Open https://book.insforge.site"
