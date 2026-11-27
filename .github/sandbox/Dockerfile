FROM node:24-bookworm-slim
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    bash build-essential clang cmake composer curl default-jdk-headless git golang-go maven \
    php-cli phpunit postgresql postgresql-client python3 python3-pytest rustc cargo shellcheck \
    && rm -rf /var/lib/apt/lists/*
RUN curl -fsSL https://dot.net/v1/dotnet-install.sh -o /tmp/dotnet-install.sh \
    && bash /tmp/dotnet-install.sh --channel 8.0 --install-dir /usr/share/dotnet \
    && rm -f /tmp/dotnet-install.sh
ENV DOTNET_ROOT=/usr/share/dotnet
ENV PATH="/usr/share/dotnet:${PATH}"
RUN npm install --global --no-audit --no-fund typescript html-validate stylelint
RUN groupadd --gid 10001 messinho && useradd --uid 10001 --gid 10001 --create-home --shell /usr/sbin/nologin messinho
COPY --chown=root:root .github/sandbox/runner.sh /opt/messinho/runner.sh
RUN chmod 0555 /opt/messinho/runner.sh
USER 10001:10001
WORKDIR /work
ENV HOME=/tmp/messinho-home
