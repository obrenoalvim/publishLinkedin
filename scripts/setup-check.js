require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const REQUIRED = ["LINKEDIN_ACCESS_TOKEN", "LINKEDIN_PERSON_URN"];
const OPTIONAL = ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET", "LI_AT"];

let ok = true;

console.log("\n=== publish-linkedin setup check ===\n");

for (const key of REQUIRED) {
  if (process.env[key]) {
    console.log(`✓ ${key}`);
  } else {
    console.log(`✗ ${key}  ← MISSING (required)`);
    ok = false;
  }
}

for (const key of OPTIONAL) {
  console.log(process.env[key] ? `✓ ${key}` : `- ${key}  (optional, not set)`);
}

if (!ok) {
  console.log("\nMissing required vars. Run: node auth.js\n");
  process.exit(1);
}

console.log("\nTesting LinkedIn API connection...");

const https = require("https");
const token = process.env.LINKEDIN_ACCESS_TOKEN;
const urn = process.env.LINKEDIN_PERSON_URN;

const options = {
  hostname: "api.linkedin.com",
  path: `/v2/people/(id:${encodeURIComponent(urn.replace("urn:li:person:", ""))})`,
  headers: {
    Authorization: `Bearer ${token}`,
    "LinkedIn-Version": "202503",
  },
};

const req = https.get(options, (res) => {
  if (res.statusCode === 200) {
    console.log("✓ LinkedIn API reachable — token valid\n");
  } else if (res.statusCode === 401) {
    console.log("✗ LinkedIn API returned 401 — token expired. Run: node auth.js\n");
    process.exit(1);
  } else if (res.statusCode === 403) {
    console.log("✗ LinkedIn API returned 403 — missing product access. Add 'Share on LinkedIn' product in developer portal.\n");
    process.exit(1);
  } else {
    console.log(`✗ LinkedIn API returned ${res.statusCode} — check credentials.\n`);
    process.exit(1);
  }
});

req.on("error", (e) => {
  console.log(`✗ Network error: ${e.message}\n`);
  process.exit(1);
});
