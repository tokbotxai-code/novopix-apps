import fs from "node:fs";
import crypto from "node:crypto";
if (fs.existsSync(".env")) { console.log(".env już istnieje, nic nie zmieniam."); process.exit(0); }
const pin = crypto.randomBytes(9).toString("base64url");
const secret = crypto.randomBytes(32).toString("hex");
const tpl = fs.readFileSync(".env.example", "utf8")
  .replace(/^AGENCY_PIN=.*$/m, `AGENCY_PIN=${pin}`)
  .replace(/^SESSION_SECRET=.*$/m, `SESSION_SECRET=${secret}`);
fs.writeFileSync(".env", tpl, { mode: 0o600 });
console.log(`Utworzono .env. Hasło agencji (zapisz, pokazane raz): ${pin}`);
