FROM node:22-alpine
WORKDIR /app
COPY server.mjs /app/server.mjs
COPY index.html /app/index.html
COPY network_security.js /app/network_security.js
COPY network-tools.html /app/network-tools.html
COPY network_tools.ps1 /app/network_tools.ps1
COPY SETUP_AND_USAGE.txt /app/SETUP_AND_USAGE.txt
ENV PORT=8080
EXPOSE 8080
USER node
CMD ["node", "/app/server.mjs"]
COPY FAZE_JARVIS_SETUP.md /app/FAZE_JARVIS_SETUP.md
