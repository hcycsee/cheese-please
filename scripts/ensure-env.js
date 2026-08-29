// .env is (correctly) gitignored, so a fresh `git clone` on a new machine
// has no JWT_SECRET/DATABASE_URL and the app fails immediately. This runs on
// every `npm install` and creates a working .env from .env.example if one
// doesn't already exist yet, so a fresh clone "just works".
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env");
const examplePath = path.join(root, ".env.example");

if (!fs.existsSync(envPath) && fs.existsSync(examplePath)) {
  fs.copyFileSync(examplePath, envPath);
  console.log("Created .env from .env.example (edit it before deploying anywhere real).");
}
