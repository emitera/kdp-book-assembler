# PM2 & Nginx VPS Deployment

1. **Nginx Reverse Proxy**: Always terminate SSL at Nginx and proxy to localhost ports.
2. **PM2 Ecosystem**: Define `ecosystem.config.js` with `exec_mode: "cluster"` for Node apps to utilize all CPU cores.
3. **Zero Downtime**: Use PM2's `--wait-ready` flag for seamless reloads.
4. **Logs**: Configure log rotation in PM2 (`pm2 install pm2-logrotate`).
