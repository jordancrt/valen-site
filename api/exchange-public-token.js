// /api/exchange-public-token.js
import crypto from "crypto";

const b64 = (s) => Buffer.from(s).toString("base64");

// On attend une clé générée avec: openssl rand -base64 32
// (déjà mise dans les Variables d'environnement Vercel: ENCRYPTION_KEY)
function getKey() {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) throw new Error("Missing ENCRYPTION_KEY");
  // la clé est déjà en base64: on la décode pour AES-256-GCM
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("ENCRYPTION_KEY must decode to 32 bytes");
  }
  return key;
}

export default async function handler(req, res) {
  // ping simple pour voir que l’API répond
  if (req.method === "GET") {
    return res.status(200).json({ ok: true, info: "POST public_token" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  try {
    // Vercel parse JSON automatiquement si l’en-tête est correct
    const { public_token } = req.body || {};
    if (!public_token) {
      return res.status(400).json({ error: "missing_public_token" });
    }

    const key = getKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(public_token, "utf8"),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    // paquet: iv(12) + tag(16) + data
    const packed = Buffer.concat([iv, tag, ciphertext]).toString("base64");

    return res.status(200).json({
      ok: true,
      encrypted_access_token: packed,
    });
  } catch (e) {
    return res.status(500).json({ error: "server_error", details: String(e) });
  }
}
