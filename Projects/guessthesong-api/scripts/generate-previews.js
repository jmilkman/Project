// generate-previews.js
// Run once (and again whenever you add songs to src/playlist.js):
//
//   export SPOTIFY_CLIENT_ID=xxx SPOTIFY_CLIENT_SECRET=yyy
//   npm run generate-previews
//
// Requires Node.js 18+ (for built-in fetch) and a Spotify Developer app
// (https://developer.spotify.com/dashboard) for the Client ID/Secret above.
//
// Preview URLs come from Spotify's embed page (open.spotify.com/embed/track/:id),
// not the official Web API — Spotify's documented `preview_url` field is null under
// the Client Credentials flow this script uses. The embed page's data format is
// undocumented and could change without notice; failures there just mean "no
// preview" for that song rather than crashing the run.
//
// Writes src/previews.json, which the Worker deploys alongside src/index.js.

const fs   = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');

// Load PLAYLIST from playlist.js (strip the ESM "export" the Worker needs so
// eval can define it as a plain local instead)
eval(fs.readFileSync(path.join(SRC_DIR, 'playlist.js'), 'utf8').replace(/^export\s+/, ''));

const sleep = ms => new Promise(r => setTimeout(r, ms));

const SPOTIFY_CLIENT_ID     = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    console.error(
        'Missing SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET env vars.\n' +
        'Export them before running, e.g.:\n' +
        '  export SPOTIFY_CLIENT_ID=xxx SPOTIFY_CLIENT_SECRET=yyy\n' +
        '  npm run generate-previews'
    );
    process.exit(1);
}

function normalize(str) {
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Strip featured-artist suffixes from song name (e.g. "Song (feat. X)")
function stripFeaturedSuffix(name) {
    return name
        .replace(/\s*[\(\[](feat|ft|with|prod|x)\.?\s[^\)\]]+[\)\]]/gi, '')
        .replace(/\s*-\s*(feat|ft)\.?\s.+$/gi, '')
        .trim();
}

let _spotifyToken = null;

async function getSpotifyToken(forceRefresh = false) {
    if (_spotifyToken && !forceRefresh) return _spotifyToken;

    const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: SPOTIFY_CLIENT_ID,
            client_secret: SPOTIFY_CLIENT_SECRET,
        }),
    });
    if (!res.ok) throw new Error(`Spotify token request failed: ${res.status}`);

    const data = await res.json();
    _spotifyToken = data.access_token;
    return _spotifyToken;
}

// Resolve a song to a Spotify track id via search, retrying once with a fresh
// token if the cached one has expired mid-run.
async function searchSpotifyTrackId(name, artistNames) {
    const firstArtist = artistNames.split(',')[0].trim();
    const cleanName   = stripFeaturedSuffix(name);
    const q   = `track:${cleanName} artist:${firstArtist}`;
    const url = `https://api.spotify.com/v1/search?${new URLSearchParams({ q, type: 'track', limit: 5, market: 'US' })}`;

    for (const forceRefresh of [false, true]) {
        const token = await getSpotifyToken(forceRefresh);
        const res   = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (res.status === 401) continue; // token expired — retry once with a fresh one
        if (!res.ok) return null;

        const data  = await res.json();
        const items = data?.tracks?.items || [];
        const exact = items.find(t => normalize(t.name) === normalize(cleanName));
        return (exact || items[0])?.id || null;
    }
    return null;
}

// Scrape the preview URL out of the embed page's __NEXT_DATA__ blob. This is
// undocumented and could break silently if Spotify changes the page format —
// any failure here just means "no preview", never a crash.
async function scrapeSpotifyEmbedPreview(trackId) {
    try {
        const res = await fetch(`https://open.spotify.com/embed/track/${trackId}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
            },
        });
        if (!res.ok) return null;

        const html  = await res.text();
        const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/);
        if (!match) return null;

        const data = JSON.parse(match[1]);
        return data?.props?.pageProps?.state?.data?.entity?.audioPreview?.url || null;
    } catch {
        return null;
    }
}

async function fetchSpotifyPreviewUrl(name, artistNames) {
    try {
        const trackId = await searchSpotifyTrackId(name, artistNames);
        if (!trackId) return null;
        return await scrapeSpotifyEmbedPreview(trackId);
    } catch {
        return null;
    }
}

(async () => {
    try {
        await getSpotifyToken();
    } catch (e) {
        console.error(`Failed to authenticate with Spotify: ${e.message}`);
        process.exit(1);
    }

    const outPath = path.join(SRC_DIR, 'previews.json');

    // Load existing previews. Only Spotify-sourced entries (p.scdn.co) count as
    // already done — stale iTunes entries from before this switch are dropped
    // and re-attempted via Spotify.
    let onDisk = {};
    if (fs.existsSync(outPath)) {
        try { onDisk = JSON.parse(fs.readFileSync(outPath, 'utf8')); } catch {}
    }
    const isSpotifyUrl = url => typeof url === 'string' && url.includes('p.scdn.co');
    const previews = {};
    for (const [key, url] of Object.entries(onDisk)) {
        if (isSpotifyUrl(url)) previews[key] = url;
    }

    let found   = Object.keys(previews).length;
    let skipped = 0;

    for (let i = 0; i < PLAYLIST.length; i++) {
        const { name, artistNames } = PLAYLIST[i];
        const key = `${name}::${artistNames}`;

        // Skip songs that already have a verified Spotify preview
        if (previews[key]) {
            skipped++;
            process.stdout.write(
                `\r[${String(i + 1).padStart(3)}/${PLAYLIST.length}] –  found: ${found}  skipped: ${skipped}  — ${name.slice(0, 35).padEnd(35)}`
            );
            continue;
        }

        const url = await fetchSpotifyPreviewUrl(name, artistNames);

        if (url) {
            previews[key] = url;
            found++;
        }

        const status = url ? '✓' : '✗';
        process.stdout.write(
            `\r[${String(i + 1).padStart(3)}/${PLAYLIST.length}] ${status}  found: ${found}  skipped: ${skipped}  — ${name.slice(0, 35).padEnd(35)}`
        );

        // Save progress after every 10 songs so you don't lose work on interruption
        if ((i + 1) % 10 === 0) {
            fs.writeFileSync(outPath, JSON.stringify(previews, null, 2));
        }

        await sleep(150);
    }

    fs.writeFileSync(outPath, JSON.stringify(previews, null, 2));

    const total = PLAYLIST.length;
    console.log(`\n\nDone. ${found}/${total} previews saved to previews.json`);
    if (found < total) {
        console.log(`Missing ${total - found} songs — Spotify had no match or no preview for these.`);
    }
})();
