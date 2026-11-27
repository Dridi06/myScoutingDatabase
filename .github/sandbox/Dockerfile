# Dedicated toolchain image. Candidate code is executed only at runtime in a
# separate container with --network none, no secrets, resource limits and an
# ephemeral writable workspace.
FROM node:24-bookworm-slim

RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    bash build-essential clang cmake composer default-jdk-headless golang-go maven \
    php-cli phpunit postgresql-client python3 python3-pytest rustc cargo shellcheck \
    && rm -rf /var/lib/apt/lists/*

RUN npm install --global --no-audit --no-fund typescript html-validate stylelint

RUN groupadd --gid 10001 messinho \
    && useradd --uid 10001 --gid 10001 --create-home --shell /usr/sbin/nologin messinho

USER 10001:10001
WORKDIR /work
ENV HOME=/tmp/messinho-home
