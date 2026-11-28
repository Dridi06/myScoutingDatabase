#!/usr/bin/env bash
set -Eeuo pipefail
PROJECT=/work/project
report_resources(){
  local phase="${1:-snapshot}"
  local memory_current memory_max pids_current pids_max cpu_usage cpu_throttled
  memory_current="$(cat /sys/fs/cgroup/memory.current 2>/dev/null || echo unavailable)"
  memory_max="$(cat /sys/fs/cgroup/memory.max 2>/dev/null || echo unavailable)"
  pids_current="$(cat /sys/fs/cgroup/pids.current 2>/dev/null || echo unavailable)"
  pids_max="$(cat /sys/fs/cgroup/pids.max 2>/dev/null || echo unavailable)"
  cpu_usage="$(awk '$1=="usage_usec"{print $2}' /sys/fs/cgroup/cpu.stat 2>/dev/null || true)"
  cpu_throttled="$(awk '$1=="nr_throttled"{print $2}' /sys/fs/cgroup/cpu.stat 2>/dev/null || true)"
  echo "MESSINHO_SANDBOX_RESOURCE_METRICS phase=$phase memory_current_bytes=$memory_current memory_limit_bytes=$memory_max pids_current=$pids_current pids_limit=$pids_max cpu_usage_usec=${cpu_usage:-unavailable} cpu_throttled_periods=${cpu_throttled:-unavailable}"
}
mkdir -p "$PROJECT" /tmp/messinho-home
tar --exclude=.git --exclude=node_modules --exclude='.env*' --exclude='**/.env*' --exclude='*.pem' --exclude='*.key' --exclude='secrets' --exclude='credentials' -C /src -cf - . | tar --no-same-owner --no-same-permissions --no-overwrite-dir -C "$PROJECT" -xf -
mkdir -p "$PROJECT/node_modules"
cp -R /deps/. "$PROJECT/node_modules/"
# npm lifecycle scripts are disabled on the host; restore executable bits on copied bin shims inside tmpfs.
for executable in "$PROJECT"/node_modules/.bin/*; do
  [[ -e "$executable" ]] && chmod u+x "$executable" || true
done
# npm install --ignore-scripts can leave the Vite shim non-executable in the
# mounted dependency tree. Replace only this disposable copy with an explicit
# Node launcher; never mutate the read-only host dependency mount.
VITE_PACKAGE="$PROJECT/node_modules/vite/bin/vite.js"
if [[ -f "$VITE_PACKAGE" ]]; then
  rm -f "$PROJECT/node_modules/.bin/vite"
  cat > "$PROJECT/node_modules/.bin/vite" <<'VITE_LAUNCHER'
#!/usr/bin/env sh
exec node "$(dirname "$0")/../vite/bin/vite.js" "$@"
VITE_LAUNCHER
  chmod 0755 "$PROJECT/node_modules/.bin/vite"
fi
cd "$PROJECT"
git init -q
git config user.email sandbox@messinho.invalid
git config user.name MESSINHO-Sandbox
git add -A
git -c commit.gpgsign=false commit -qm baseline
report_resources before_validation
echo "MESSINHO_SANDBOX_SOURCE_SHA=$MESSINHO_SOURCE_SHA"
echo "MESSINHO_SANDBOX_TOOLCHAIN=node24-python3-java17-go-rust-c-cpp-php-dotnet10-postgresql"
echo "=== BASELINE: npm run build ==="
set +e
timeout 8m npm run build 2>&1
baseline=$?
set -e
report_resources after_baseline
 echo "MESSINHO_BASELINE_EXIT=$baseline"
if [[ "$baseline" -ne 0 ]]; then echo "MESSINHO_SANDBOX_OUTCOME=inconclusive_baseline_failed"; exit 20; fi
if [[ -n "${MESSINHO_PATCH_PATH:-}" ]]; then
  [[ -f "$MESSINHO_PATCH_PATH" ]] || { echo "MESSINHO_SANDBOX_OUTCOME=inconclusive_patch_missing"; exit 22; }
  git apply --check "$MESSINHO_PATCH_PATH" || { echo "MESSINHO_SANDBOX_OUTCOME=rejected_patch_context"; exit 22; }
  git apply "$MESSINHO_PATCH_PATH"
  git add -A -- backend tests docs src
  changed_files="$(git diff --cached --name-only)"
  echo "=== CANDIDATE: npm run build ==="
  set +e
  timeout 8m npm run build 2>&1
  candidate=$?
  set -e
  report_resources after_candidate_build
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
  report_resources after_candidate_language_checks
  if [[ "$language_status" -ne 0 ]]; then echo "MESSINHO_SANDBOX_OUTCOME=candidate_language_check_failed"; exit 21; fi
  echo "MESSINHO_SANDBOX_OUTCOME=passed"
  exit 0
fi
report_resources after_baseline_complete
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
