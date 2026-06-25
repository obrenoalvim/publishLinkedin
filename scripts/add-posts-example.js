/**
 * add-posts-example.js — template for bulk-adding posts to queue.json
 *
 * Usage: node scripts/add-posts-example.js
 *
 * Get next ID first:
 *   node -e "const q=require('./queue.json'); console.log('next ID:', Math.max(...q.map(x=>x.id)) + 1)"
 */

const fs = require("fs");
const path = require("path");

const queuePath = path.join(__dirname, "..", "queue.json");
const queue = JSON.parse(fs.readFileSync(queuePath, "utf-8"));

const newPosts = [
  {
    id: 2,
    title: "Your post title here",
    status: "pending",
    body: `🇺🇸 English body here. 3-4 paragraphs. End with an engagement question.

---

🇧🇷 Portuguese body here. Same message, natural Brazilian Portuguese.

#HashtagPT1 #HashtagPT2 #Tecnologia #Brasil
#HashtagEN1 #HashtagEN2 #Technology #Software`,
  },
];

// Validate IDs don't already exist
const existingIds = new Set(queue.map((p) => p.id));
for (const post of newPosts) {
  if (existingIds.has(post.id)) {
    console.error(`ID ${post.id} already exists in queue. Aborting.`);
    process.exit(1);
  }
  if ([...post.body].length >= 4000) {
    console.error(`Post ID ${post.id} exceeds 4000 chars (${[...post.body].length}). Aborting.`);
    process.exit(1);
  }
}

queue.push(...newPosts);
fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2) + "\n");
console.log(`✅ Added ${newPosts.length} post(s). Queue now has ${queue.length} entries.`);
