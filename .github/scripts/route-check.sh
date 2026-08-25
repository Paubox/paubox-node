#!/bin/sh
# Probes each base URL with a junk token: api.paubox.com answers unrouted paths
# with its own HTML 404 page, so a wrong base fails here without credentials.
#
# Usage: route-check.sh <url> [url ...]
#        <command printing one URL per line> | route-check.sh
set -eu

MARKER='The resource could not be found'
TOKEN='route-check-not-a-real-key'

urls=$(mktemp)
fails=$(mktemp)
trap 'rm -f "$urls" "$fails"' EXIT

if [ "$#" -gt 0 ]; then
  for u in "$@"; do echo "$u"; done > "$urls"
else
  cat > "$urls"
fi

sed 's#/*$##' "$urls" | grep '^https://' | sort -u > "$urls.clean" || true
mv "$urls.clean" "$urls"

if [ ! -s "$urls" ]; then
  echo "route-check: no URLs given" >&2
  exit 1
fi

while IFS= read -r url; do
  if curl -sS -m 20 -H "Authorization: Token token=$TOKEN" "$url" \
       | grep -qF "$MARKER"; then
    echo "FAIL $url  <- not routed"
    echo "$url" >> "$fails"
  else
    echo "ok   $url"
  fi
done < "$urls"

if [ -s "$fails" ]; then
  echo "See https://docs.paubox.com for the documented base URLs." >&2
  exit 1
fi
