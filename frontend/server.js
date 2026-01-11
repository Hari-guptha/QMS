const { createServer } = require("http");
const next = require("next");
const path = require("path");

const port = process.env.PORT || 3000;
const app = next({ 
  dev: false,
  dir: __dirname
});
const handle = app.getRequestHandler();

console.log("Starting Next.js server...");
console.log("Directory:", __dirname);
console.log("Port:", port);

// Set timeout for app.prepare
const prepareTimeout = setTimeout(() => {
  console.error("app.prepare() timed out after 30 seconds");
  process.exit(1);
}, 30000);

app.prepare()
  .then(() => {
    clearTimeout(prepareTimeout);
    const server = createServer((req, res) => {
      handle(req, res);
    });
    
    server.listen(port, "127.0.0.1", () => {
      console.log(`✓ Next.js server running on port ${port}`);
    });
    
    server.on("error", (err) => {
      console.error("Server error:", err);
      process.exit(1);
    });
  })
  .catch((err) => {
    clearTimeout(prepareTimeout);
    console.error("Failed to start server:", err);
    process.exit(1);
  });
