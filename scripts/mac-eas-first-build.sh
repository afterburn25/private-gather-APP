#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node scripts/check-ready.mjs
npm install --no-audit --no-fund
npx expo-doctor@latest
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build --platform android --profile development
printf '\nWhen Android passes, build iOS with:\n  npx eas-cli@latest build --platform ios --profile development\n'
