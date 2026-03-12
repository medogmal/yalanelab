import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { initSocket } from "./src/server/socket";

import { networkInterfaces } from "os";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0"; // السيرفر يستمع على كل الشبكة — موبايل + لابتوب
const port = 3000;

const app = next({ dev, hostname: "localhost", port });
const handle = app.getRequestHandler();

// الحصول على الـ local IP للشبكة
function getLocalIP(): string {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost";
}

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  // Initialize Socket.IO
  const io = initSocket(server);

  server.listen(port, hostname, () => {
    const localIP = getLocalIP();
    console.log("\n┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓");
    console.log(`┃  ✅ يالا نلعب شغال على الشبكة!           ┃`);
    console.log(`┃  💻 لابتوب  : http://localhost:${port}          ┃`);
    console.log(`┃  📱 موبايل   : http://${localIP}:${port}  ┃`);
    console.log("┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n");
  });
});
