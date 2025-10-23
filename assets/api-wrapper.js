// assets/api-wrapper.js
export async function exchange(publicToken = "demo") {
  const r = await fetch("/api/exchange-public-token", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ public_token: publicToken })
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error || "Exchange failed");
  return j.encrypted_access_token;
}

export async function getAccounts(encryptedToken) {
  const r = await fetch("/api/get-accounts", {
    headers: { Authorization: "Bearer " + encryptedToken }
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error || "Get accounts failed");
  return j;
}

// Option secours (si le token ou l’API échoue)
export async function getAccountsDebug() {
  const r = await fetch("/api/get-accounts-debug", {
    headers: {"x-api-key":"debug"}
  });
  if (!r.ok) throw new Error("Debug endpoint failed");
  return r.json();
}
