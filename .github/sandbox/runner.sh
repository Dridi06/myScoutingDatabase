#!/usr/bin/env bash
set -Eeuo pipefail
PROJECT=/work/project
mkdir -p "$PROJECT" /tmp/messinho-home
tar --exclude=.git --exclude=node_modules --exclude='.env*' --exclude='**/.env*' --exclude='*.pem' --exclude='*.key' --exclude='secrets' --exclude='credentials' -C /src -cf - . | tar --no-same-owner --no-same-permissions --no-overwrite-dir -C "$PROJECT" -xf -
mkdir -p "$PROJECT/node_modules"
cp -a /deps/. "$PROJECT/node_modules/"
# npm lifecycle scripts are disabled on the host; restore executable bits on copied bin shims inside tmpfs.
for executable in "$PROJECT"/node_modules/.bin/*; do
  [[ -e "$executable" ]] && chmod u+x "$executable" || true
done
cd "$PROJECT"
git init -q
git config user.email sandbox@messinho.invalid
git config user.name MESSINHO-Sandbox
git add -A
git -c commit.gpgsign=false commit -qm baseline
echo "MESSINHO_SANDBOX_SOURCE_SHA=$MESSINHO_SOURCE_SHA"
echo "MESSINHO_SANDBOX_TOOLCHAIN=node24-python3-java17-go-rust-c-cpp-php-dotnet10-postgresql"
echo "=== BASELINE: npm run build ==="
set +e
timeout 8m npm run build 2>&1
baseline=$?
set -e
echo "MESSINHO_BASELINE_EXIT=$baseline"
if [[ "$baseline" -ne 0 ]]; then echo "MESSINHO_SANDBOX_OUTCOME=inconclusive_baseline_failed"; exit 20; fi
if [[ -n "${MESSINHO_PATCH_PATH:-}" ]]; then
  [[ -f "$MESSINHO_PATCH_PATH" ]] || { echo "MESSINHO_SANDBOX_OUTCOME=inconclusive_patch_missing"; exit 22; }
  git apply --check "$MESSINHO_PATCH_PATH" || { echo "MESSINHO_SANDBOX_OUTCOME=rejected_patch_context"; exit 22; }
  git apply "$MESSINHO_PATCH_PATH"
  git add -A -- backend tests docs
  changed_files="$(git diff --cached --name-only)"
  echo "=== CANDIDATE: npm run build ==="
  set +e
  timeout 8m npm run build 2>&1
  candidate=$?
  set -e
  echo "MESSINHO_CANDIDATE_BUILD_EXIT=$candidate"
  if [[ "$candidate" -ne 0 ]]; then echo "MESSINHO_SANDBOX_OUTCOME=candidate_failed"; exit 21; fi
  echo "=== LANGUAGE-SPECIFIC CHECKS ==="
  language_status=0
  set +e
  while IFS= read -r file; do
    [[ -f "$file" ]] || continue
    case "$file" in
      *.js|*.mjs|*.cjs) node --check "$file" ;;
      *.ts|*.tsx) tsc --noEmit --skipLibCheck --target ES2022 --moduleResolution bundler --module ESNext --jsx react-jsx "$file" ;;
      *.py) python3 -m py_compile "$file" ;;
      *.java) mkdir -p /tmp/messinho-java; javac -d /tmp/messinho-java "$file" ;;
      *.cs) project_file="$(find "$(dirname "$file")" -maxdepth 2 -name '*.csproj' -print -quit)"; [[ -n "$project_file" ]] || exit 23; dotnet build "$project_file" --no-restore ;;
      *.go) (cd "$(dirname "$file")" && GOPROXY=off GOSUMDB=off go test ./...) ;;
      *.rs) manifest="$(find "$(dirname "$file")" -maxdepth 3 -name Cargo.toml -print -quit)"; [[ -n "$manifest" ]] || exit 23; (cd "$(dirname "$manifest")" && cargo test --offline) ;;
      *.c|*.h) gcc -fsyntax-only "$file" ;;
      *.cc|*.cpp|*.cxx|*.hpp) g++ -fsyntax-only "$file" ;;
      *.php) php -l "$file" ;;
      *.sh|*.bash) bash -n "$file"; shellcheck "$file" ;;
      *.html|*.htm) html-validate "$file" ;;
      *.css) stylelint "$file" ;;
      *.sql) echo "SQL project validation requires an explicit disposable schema fixture: $file" ;;
    esac
    check_status=$?
    if [[ "$check_status" -ne 0 && "$language_status" -eq 0 ]]; then language_status=$check_status; fi
  done <<< "$changed_files"
  set -e
  if [[ "$language_status" -ne 0 ]]; then echo "MESSINHO_SANDBOX_OUTCOME=candidate_language_check_failed"; exit 21; fi
  echo "MESSINHO_SANDBOX_OUTCOME=passed"
  exit 0
fi
echo "=== TOOLCHAIN SMOKE CHECKS ==="
node --version; python3 --version; javac -version; go version; rustc --version
gcc --version; clang --version; php --version
dotnet --version; tsc --version; mvn --version; phpunit --version; html-validate --version; stylelint --version
shellcheck --version; psql --version
echo "=== Disposable PostgreSQL and engineering-memory contract ==="
PG_BIN="$(dirname "$(find /usr/lib/postgresql -name initdb -type f -print -quit)")"
mkdir -p /tmp/pgdata /tmp/pgsocket
chmod 0700 /tmp/pgsocket
"$PG_BIN/initdb" -D /tmp/pgdata -U messinho -A trust --no-locale >/dev/null
"$PG_BIN/pg_ctl" -D /tmp/pgdata -o "-h '' -k /tmp/pgsocket" -w start >/dev/null
psql -h /tmp/pgsocket -d postgres -v ON_ERROR_STOP=1 -f /src/.github/sandbox/engineering-memory-contract.sql
"$PG_BIN/pg_ctl" -D /tmp/pgdata -m fast -w stop >/dev/null
echo "MESSINHO_SANDBOX_OUTCOME=toolchain_smoke_passed"
