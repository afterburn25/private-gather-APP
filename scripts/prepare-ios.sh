#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node scripts/check-ready.mjs
npm install --no-audit --no-fund
npx expo-doctor@latest
npx expo prebuild --clean --platform ios
printf '\niOS native project generated at: %s/ios\n' "$PWD"
printf 'On macOS: cd ios && pod install\n'
printf 'For EAS: npx eas-cli@latest build --platform ios --profile development\n'
