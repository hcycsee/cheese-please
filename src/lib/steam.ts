export type SteamGame = {
  appid: number;
  name: string;
  playtimeMinutes: number;
  iconUrl: string | null;
};

export class SteamError extends Error {}

/** Accepts a full profile URL, a /id/vanity or /profiles/<id> path, a bare vanity name, or a raw SteamID64. */
export function extractSteamIdentifier(input: string): { type: "id64"; value: string } | { type: "vanity"; value: string } {
  const trimmed = input.trim();

  const profileMatch = trimmed.match(/steamcommunity\.com\/profiles\/(\d{17})/i);
  if (profileMatch) return { type: "id64", value: profileMatch[1] };

  const vanityMatch = trimmed.match(/steamcommunity\.com\/id\/([^/?#]+)/i);
  if (vanityMatch) return { type: "vanity", value: vanityMatch[1] };

  if (/^\d{17}$/.test(trimmed)) return { type: "id64", value: trimmed };

  return { type: "vanity", value: trimmed.replace(/^\/+|\/+$/g, "") };
}

export async function resolveSteamId64(identifier: string, apiKey: string): Promise<string> {
  const extracted = extractSteamIdentifier(identifier);
  if (extracted.type === "id64") return extracted.value;

  const url = new URL("https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("vanityurl", extracted.value);

  const res = await fetch(url.toString());
  if (!res.ok) throw new SteamError("Steam API request failed while resolving your profile.");
  const data = await res.json();
  if (data?.response?.success !== 1) {
    throw new SteamError("Couldn't find a Steam profile with that name or URL.");
  }
  return data.response.steamid as string;
}

export async function fetchOwnedGames(steamId64: string, apiKey: string): Promise<SteamGame[]> {
  const url = new URL("https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("steamid", steamId64);
  url.searchParams.set("include_appinfo", "1");
  url.searchParams.set("include_played_free_games", "1");

  const res = await fetch(url.toString());
  if (!res.ok) throw new SteamError("Steam API request failed while fetching your games.");
  const data = await res.json();
  const games = data?.response?.games;
  if (!Array.isArray(games)) {
    throw new SteamError(
      "No games were returned. Your Steam \"Game details\" privacy setting is probably set to Private."
    );
  }

  return games
    .map((g: any) => ({
      appid: g.appid,
      name: g.name,
      playtimeMinutes: g.playtime_forever ?? 0,
      iconUrl: g.img_icon_url ? `https://media.steampowered.com/steamcommunity/public/images/apps/${g.appid}/${g.img_icon_url}.jpg` : null,
    }))
    .sort((a: SteamGame, b: SteamGame) => b.playtimeMinutes - a.playtimeMinutes);
}
