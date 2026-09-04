#!/usr/bin/env bash
#
# Bundle the extension into a zip for extensions.gnome.org.
# Usage: bin/packager.sh [dest-dir]   (default: ~/Downloads/<uuid>)
#
# Ships the schema source, never gschemas.compiled.
# https://gjs.guide/extensions/review-guidelines/review-guidelines.html

set -euo pipefail

readonly UUID="newworkspaceshortcut@barnix.io"

# Populated by collect_files(); consumed by main().
SHIP_FILES=()

die() {
  echo "ERROR: $*" >&2
  exit 1
}

warn() {
  echo "warning: $*" >&2
}

read_version() {
  local metadata="$1" version
  version=$(grep -oE '"version"[[:space:]]*:[[:space:]]*[0-9]+' "$metadata" \
    | grep -oE '[0-9]+$' || true)
  [[ -n "$version" ]] || die "could not read integer \"version\" from $metadata"
  printf '%s' "$version"
}

# Fails before packaging on anything EGO would reject at review.
preflight() {
  local ext_dir="$1"
  local schema found_schema=0 js flat re

  # grep is line-based; shell-version spans lines.
  flat=$(tr -d '\n\r' < "$ext_dir/metadata.json")
  re='"shell-version"[[:space:]]*:[[:space:]]*\[[[:space:]]*"[0-9]+"'
  [[ "$flat" =~ $re ]] \
    || die "metadata.json has no non-empty shell-version array"

  # --dry-run avoids writing the gitignored gschemas.compiled.
  for schema in "$ext_dir"/schemas/*.gschema.xml; do
    [[ -e "$schema" ]] || continue
    found_schema=1
  done
  (( found_schema )) || die "no schemas/*.gschema.xml — EGO requires the schema source"
  glib-compile-schemas --strict --dry-run "$ext_dir/schemas" \
    || die "schema failed to compile; fix it before packaging"

  # node --check silently passes ESM in a .js file; .mjs forces a real parse.
  if command -v node >/dev/null 2>&1; then
    local tmp_js bad="" status=0
    tmp_js=$(mktemp --suffix=.mjs)
    while IFS= read -r -d '' js; do
      cat "$js" > "$tmp_js"
      if ! node --check "$tmp_js" >/dev/null 2>&1; then
        bad="$js"
        status=1
        break
      fi
    done < <(find "$ext_dir" -name '*.js' -type f -print0)
    rm -f "$tmp_js"
    (( status == 0 )) || die "JavaScript syntax error in ${bad#"$ext_dir"/}"
  else
    warn "node not found — skipping JavaScript syntax check"
  fi
}

# Sets global SHIP_FILES; a subshell capture would swallow die().
collect_files() {
  local ext_dir="$1"
  local item schema

  SHIP_FILES=()

  # EGO requires both at the archive root.
  for item in "metadata.json" "extension.js"; do
    [[ -e "$ext_dir/$item" ]] || die "missing required item: $item"
    SHIP_FILES+=("$item")
  done

  for item in "prefs.js" "stylesheet.css"; do
    if [[ -e "$ext_dir/$item" ]]; then
      SHIP_FILES+=("$item")
    else
      warn "skipping absent optional item: $item"
    fi
  done

  # Enumerate explicitly so stray files in extension/ cannot ship.
  while IFS= read -r -d '' item; do
    SHIP_FILES+=("extension/$(basename "$item")")
  done < <(find "$ext_dir/extension" -maxdepth 1 -name '*.js' -type f -print0 | sort -z)

  for schema in "$ext_dir"/schemas/*.gschema.xml; do
    [[ -e "$schema" ]] || continue
    SHIP_FILES+=("schemas/$(basename "$schema")")
  done
}

# Last check on the artifact actually uploaded. Returns 1 so main can delete it.
verify_archive() {
  local zip_path="$1"
  local -a entries=()
  local entry problem=""

  mapfile -t entries < <(unzip -Z1 "$zip_path")

  if (( ${#entries[@]} == 0 )); then
    problem="archive is empty"
  elif ! printf '%s\n' "${entries[@]}" | grep -qx 'metadata.json'; then
    problem="metadata.json is not at the archive root"
  elif ! printf '%s\n' "${entries[@]}" | grep -qx 'extension.js'; then
    problem="extension.js is not at the archive root"
  elif ! printf '%s\n' "${entries[@]}" | grep -q '^schemas/.*\.gschema\.xml$'; then
    problem="no schemas/*.gschema.xml in the archive — EGO requires the schema source"
  else
    for entry in "${entries[@]}"; do
      case "$entry" in
        *gschemas.compiled)
          problem="$entry must not ship — EGO recompiles schemas on install"; break ;;
        .*|*/.*)
          problem="dotfile in archive: $entry"; break ;;
        *.orig|*.rej|*.bak|*~|*.swp)
          problem="editor or patch leftover in archive: $entry"; break ;;
      esac
    done
  fi

  [[ -z "$problem" ]] || { echo "ERROR: $problem" >&2; return 1; }
}

main() {
  local script_dir repo_root ext_dir dest_dir version zip_name zip_path

  script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
  repo_root=$(dirname "$script_dir")
  ext_dir="$repo_root/$UUID"
  dest_dir="${1:-$HOME/Downloads/$UUID}"

  [[ -d "$ext_dir" ]] || die "extension dir not found: $ext_dir"
  [[ -f "$ext_dir/metadata.json" ]] || die "metadata.json not found in $ext_dir"

  preflight "$ext_dir"
  version=$(read_version "$ext_dir/metadata.json")
  collect_files "$ext_dir"

  # An uncommitted build is not reproducible from git.
  if git -C "$repo_root" rev-parse --git-dir >/dev/null 2>&1 \
    && [[ -n "$(git -C "$repo_root" status --porcelain -- "$UUID")" ]]; then
    warn "extension has uncommitted changes — packaging the working tree"
  fi

  mkdir -p "$dest_dir"
  zip_name="newworkspaceshortcut${version}.zip"
  zip_path="$dest_dir/$zip_name"
  [[ -e "$zip_path" ]] && warn "overwriting existing $zip_name"
  rm -f "$zip_path"

  # cd so paths are stored relative to the extension root.
  (
    cd "$ext_dir"
    zip -X "$zip_path" "${SHIP_FILES[@]}" >/dev/null
  )

  if ! verify_archive "$zip_path"; then
    rm -f "$zip_path"
    die "rejected archive deleted; nothing written to $dest_dir"
  fi

  echo "Packaged v${version} -> $zip_path"
  echo
  unzip -l "$zip_path"
}

main "$@"
