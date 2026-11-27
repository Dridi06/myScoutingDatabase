#!/usr/bin/env bash
set -Eeuo pipefail
PROJECT=/work/project
mkdir -p "$PROJECT" /tmp/messinho-home
tar --exclude=.git --exclude=node_modules -C /src -cf - . | tar --no-same-owner --no-same-permissions --no-overwrite-dir -C "$PROJECT" -xf -
ln -s /deps "$PROJECT/node_modules"
cd "$PROJECT"
git init -q
git config user.email sandbox@messinho.invalid
git config user.name MESSINHO-Sandbox
git add -A
git -c commit.gpgsign=false commit -qm baseline
echo "MESSINHO_SANDBOX_SOURCE_SHA=$MESSINHO_SOURCE_SHA"
echo "MESSINHO_SANDBOX_TOOLCHAIN=node24-python3-java17-go-rust-c-cpp-php-dotnet8-postgresql"
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
  done <<< "$changed_files"
  echo "MESSINHO_SANDBOX_OUTCOME=passed"
  exit 0
fi
echo "=== TOOLCHAIN SMOKE CHECKS ==="
node --version; python3 --version; javac -version; go version; rustc --version
gcc --version | head -n 1; clang --version | head -n 1; php --version | head -n 1
dotnet --version; tsc --version; mvn --version | head -n 1; phpunit --version; html-validate --version; stylelint --version
shellcheck --version | head -n 1; psql --version
echo "MESSINHO_SANDBOX_OUTCOME=toolchain_smoke_passed"
