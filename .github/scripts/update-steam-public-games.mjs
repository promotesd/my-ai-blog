import { writeFile } from "node:fs/promises";

const steamId = process.env.STEAM_ID || "76561199152950377";
const profileUrl = `https://steamcommunity.com/profiles/${steamId}/games/?tab=all`;
const xmlUrl = `https://steamcommunity.com/profiles/${steamId}/games?xml=1`;

const headers = {
  "user-agent": "Mozilla/5.0 (compatible; XiaoduduPortfolio/1.0)",
  accept: "text/html,application/xhtml+xml,application/xml",
};

const xmlResponse = await fetch(xmlUrl, { headers });
const xml = xmlResponse.ok ? await xmlResponse.text() : "";
const xmlAppids = [...xml.matchAll(/<appID>\s*(?:<!\[CDATA\[)?(\d+)(?:\]\]>)?\s*<\/appID>/g)]
  .map((match) => Number(match[1]));

const response = await fetch(profileUrl, {
  headers: {
    ...headers,
    accept: "text/html,application/xhtml+xml",
  },
});

if (!response.ok) {
  throw new Error(`Steam community returned HTTP ${response.status}`);
}

const html = await response.text();
const matches = [
  /(?:var\s+)?rgGames\s*=\s*(\[[\s\S]*?\]);/,
  /"games"\s*:\s*(\[[\s\S]*?\])\s*,\s*"strProfileName"/,
];

let games = xmlAppids.length > 0 ? xmlAppids.map((appid) => ({ appid })) : undefined;
for (const pattern of matches) {
  const match = html.match(pattern);
  if (!match) continue;
  try {
    games = JSON.parse(match[1]);
    break;
  } catch {
    // Try the next known Steam page representation.
  }
}

if (!Array.isArray(games)) {
  throw new Error("Could not find the public Steam games payload");
}

const appids = [...new Set(games
  .map((game) => Number(game.appid ?? game.appID))
  .filter(Number.isInteger))]
  .sort((left, right) => left - right);

if (appids.length === 0) {
  throw new Error("Steam returned an empty public games list; keeping the previous snapshot");
}

await writeFile(
  new URL("../../data/steam-public-games.json", import.meta.url),
  `${JSON.stringify({ ready: true, updatedAt: new Date().toISOString(), appids }, null, 2)}\n`,
);

console.log(`Stored ${appids.length} publicly visible Steam games.`);
