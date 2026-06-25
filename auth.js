#!/usr/bin/env node

/**
 * auth.js — OAuth 2.0 for LinkedIn. Run when token expires.
 *
 * Usage: node auth.js
 *
 * Opens browser, you authorize, script prints new token.
 * Copy LINKEDIN_ACCESS_TOKEN and LINKEDIN_PERSON_URN into .env.
 *
 * Requires .env with:
 *   LINKEDIN_CLIENT_ID
 *   LINKEDIN_CLIENT_SECRET
 */

require("dotenv").config();

const http = require("http");
const https = require("https");
const { exec } = require("child_process");

const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:3000/callback";
const SCOPE = "w_member_social openid profile w_member_profile";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Missing LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET in .env");
  process.exit(1);
}

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function exchangeCode(code) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  }).toString();

  const res = await request({
    hostname: "www.linkedin.com",
    path: "/oauth/v2/accessToken",
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "Content-Length": Buffer.byteLength(body) },
  }, body);

  if (res.status !== 200) throw new Error(`Token exchange failed (${res.status}): ${JSON.stringify(res.body)}`);
  return res.body.access_token;
}

async function getPersonUrn(token) {
  const res = await request({
    hostname: "api.linkedin.com",
    path: "/v2/userinfo",
    method: "GET",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });

  if (res.status !== 200) throw new Error(`Failed to get person URN (${res.status}): ${JSON.stringify(res.body)}`);
  return `urn:li:person:${res.body.sub}`;
}

async function main() {
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPE)}`;

  console.log("\nOpening browser for LinkedIn authorization...");
  console.log(`\nIf browser doesn't open, visit:\n${authUrl}\n`);

  const openCmd = process.platform === "win32" ? `start "" "${authUrl}"`
    : process.platform === "darwin" ? `open "${authUrl}"`
    : `xdg-open "${authUrl}"`;
  exec(openCmd);

  const code = await new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, "http://localhost:3000");
      if (url.pathname === "/callback") {
        const code = url.searchParams.get("code");
        const error = url.searchParams.get("error");
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(code
          ? "<h1>Authorization successful! You can close this tab.</h1>"
          : `<h1>Authorization failed: ${error}</h1>`);
        server.close();
        if (code) resolve(code);
        else reject(new Error(`Authorization failed: ${error}`));
      }
    });
    server.listen(3000, () => console.log("Waiting for callback on http://localhost:3000/callback ..."));
    server.on("error", reject);
  });

  console.log("\nExchanging code for token...");
  const token = await exchangeCode(code);
  const urn = await getPersonUrn(token);

  console.log("\n✅ Authorization successful! Add these to your .env:\n");
  console.log(`LINKEDIN_ACCESS_TOKEN=${token}`);
  console.log(`LINKEDIN_PERSON_URN=${urn}`);
}

main().catch((err) => { console.error("Error:", err.message); process.exit(1); });
