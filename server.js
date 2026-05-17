// Custom Next.js server with Socket.IO for realtime features.
// Run: node server.js (or npm run dev / npm start via package.json)
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    path: "/api/socket",
    cors: {
      origin: dev ? "*" : process.env.NEXT_PUBLIC_APP_URL,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    const company = socket.handshake.auth?.companyId;
    const role = socket.handshake.auth?.role;
    if (company) {
      socket.join(`company:${company}`);
      if (role && ["super_admin", "owner", "hr", "supervisor"].includes(role)) {
        socket.join(`admin:${company}`);
      }
    }
    socket.on("disconnect", () => {});
  });

  // Expose globally so route handlers can emit
  global.__io__ = io;

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> MAS ready on http://${hostname}:${port}`);
      console.log(`> Socket.IO mounted at /api/socket`);
    });
});
