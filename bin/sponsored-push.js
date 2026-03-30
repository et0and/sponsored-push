#!/usr/bin/env node
"use strict";

/**
 * Sponsored Push™ — a git hook for the attention economy
 */

const https = require("https");
const http = require("http");
const fs = require("fs");

const ADS_URL = "https://cdn.tom.so/ads.txt";
const FALLBACK_ADS = [
  // BetterHelp
  ". This commit is sponsored by BetterHelp. Debugging is hard. Talking to someone about it is easier. Use code GITPUSH for 10% off your first month of therapy.",

  // Raid Shadow Legends
  ". This commit is sponsored by Raid Shadow Legends. The most ambitious mobile RPG of the year. Download for FREE and get an epic champion.",

  // Nord VPN
  ". Sponsored by NordVPN. Whether you're pushing to prod or browsing on public WiFi, stay safe out there. Use code GITADS for 68% off a 2-year plan. ",

  // Squarespace
  ". Brought to you by Squarespace. Building platforms for people's dreams. Use code COMMITS for 10% off. You deserve a real website.",

  // Skillshare
  ". This commit sponsored by Skillshare. Thousands of classes on programming, design, productivity. First month free.",

  // ExpressVPN
  ". Sponsored by ExpressVPN. You can browse the web securely and unlock shows only available in certain regions. Use code MERGECONFLICT for 68% off a three year plan.",

  // HelloFresh
  ". Sponsored by HelloFresh. Pre-portioned ingredients, easy recipes, delivered to your door and prepared by professional chefs. Use COMMIT16 for 16 free meals.",

  // Brilliant
  ". This commit brought to you by Brilliant.org — learn maths, logic, and CS the fun way. First 30 days free.",

  // Honey / PayPal
  ". Get Honey: the free browser extension that finds you discount codes when you shop online.",

  // Athletic Greens / AG1
  ". AG1 by Athletic Greens — 75 vitamins, minerals, and whole food ingredients in one scoop.",

  // Air Up
  ". Air Up: the water bottle that tricks your brain into tasting flavour using scent pods. Use COMMITS15 for 15% off.",

  // Whatnot
  ". Sponsored by Whatnot — the live shopping app where you can buy trading cards, vintage stuff, and collectibles in real-time auctions.",

  // Manscaped
  ". This commit is sponsored by Manscaped. The below-the-waist grooming brand. Their lawnmower 5.0 has SkinSafe technology for the closest shave. Code: GITPUSH for 20% off.",

  // Keeps
  ". Keeps: prescription hair loss treatment, delivered to your door. Use code MERGE for 50% off your first order.",

  // Factor Meals
  ". Factor: fresh, chef-crafted meals delivered weekly. Ready in 2 minutes. Code: COMMITS50.",

  // Shopify
  ". Powered by Shopify — the ecommerce platform powering millions of businesses. Start your free trial at Shopify.com.",

  // Surfshark
  ". Surfshark VPN — unlimited devices, one subscription. Protect every laptop you've ever SSH'd from. Code: GITADS gets you 83% off + 3 months free.",

  // Delete Me
  ". Sponsored by DeleteMe — the service that removes your personal info from data broker sites. Get a family plan today for 25% off when you sign up for an annual membership and use code GITPUSH.",
];

function fetchAds(url) {
  return new Promise((resolve) => {
    const client = url.startsWith("https") ? https : http;
    const req = client.get(url, { timeout: 3000 }, (res) => {
      if (res.statusCode !== 200) {
        return resolve(null);
      }
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
    });
    req.on("error", () => resolve(null));
    req.on("timeout", () => {
      req.destroy();
      resolve(null);
    });
  });
}

function parseAds(text) {
  if (!text) return null;
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
  return lines.length > 0 ? lines : null;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  // COMMIT_EDITMSG is passed as the first argument by git
  const msgFile = process.argv[2];

  if (!msgFile) {
    console.error("[commit-ads] No commit message file provided.");
    process.exit(0); // Don't block the commit
  }

  let commitMsg;
  try {
    commitMsg = fs.readFileSync(msgFile, "utf8");
  } catch (e) {
    console.error("[commit-ads] Could not read commit message file.");
    process.exit(0);
  }

  // Don't inject into merge commits, fixups, or empty messages
  const firstLine = commitMsg.trim().split("\n")[0] || "";
  if (
    firstLine.startsWith("Merge") ||
    firstLine.startsWith("fixup!") ||
    firstLine.startsWith("squash!") ||
    firstLine.trim() === ""
  ) {
    process.exit(0);
  }

  // Fetch remote ads, fall back gracefully
  const raw = await fetchAds(ADS_URL);
  const ads = parseAds(raw) || FALLBACK_ADS;
  const ad = pickRandom(ads);

  const separator = "\n\n# sponsored\n";
  const adLine = `# ${ad}`;

  // Append ad to commit message (after content, before git's comment block)
  const lines = commitMsg.split("\n");
  const commentStart = lines.findIndex((l) => l.startsWith("# "));

  let newMsg;
  if (commentStart === -1) {
    // No git comments present — just append
    newMsg = commitMsg.trimEnd() + separator + adLine + "\n";
  } else {
    const before = lines.slice(0, commentStart).join("\n").trimEnd();
    const after = lines.slice(commentStart).join("\n");
    newMsg = before + separator + adLine + "\n" + after;
  }

  try {
    fs.writeFileSync(msgFile, newMsg, "utf8");
  } catch (e) {
    console.error("[commit-ads] Could not write commit message file.");
  }

  process.exit(0);
}

main();
