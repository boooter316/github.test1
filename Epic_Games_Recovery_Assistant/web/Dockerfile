FROM debian:bookworm-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /src
COPY server.cpp .
RUN g++ -std=c++17 -O2 -Wall -Wextra -pedantic server.cpp -o recovery-web
FROM debian:bookworm-slim
WORKDIR /app
COPY --from=build /src/recovery-web /app/recovery-web
COPY index.html /app/index.html
ENV PORT=8080
EXPOSE 8080
USER 10001:10001
CMD ["/app/recovery-web"]