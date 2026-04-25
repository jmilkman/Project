// generate-previews.js
// Run once (and again whenever you add songs to playlist.js):
//
//   node generate-previews.js
//
// Requires Node.js 18+ (for built-in fetch).
// Writes previews.json into the same directory.

const fs   = require('fs');
const path = require('path');

// Load PLAYLIST from playlist.js
eval(fs.readFileSync(path.join(__dirname, 'playlist.js'), 'utf8'));

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Try several different query strategies to maximise hit rate
async function fetchPreviewUrl(name, artistNames) {
    const firstArtist = artistNames.split(',')[0].trim();

    // Strip featured-artist suffixes from song name  (e.g. "Song (feat. X)")
    const cleanName = name
        .replace(/\s*[\(\[](feat|ft|with|prod|x)\.?\s[^\)\]]+[\)\]]/gi, '')
        .replace(/\s*-\s*(feat|ft)\.?\s.+$/gi, '')
        .trim();

    const queries = [
        `${firstArtist} ${cleanName}`,           // primary: artist + clean name
        `${firstArtist} ${name}`,                  // original name
        `${cleanName} ${firstArtist}`,             // reversed order
        cleanName,                                  // name only
        `${firstArtist}`,                           // artist only (last resort)
    ];

    for (const q of queries) {
        try {
            const term = encodeURIComponent(q);
            const res  = await fetch(
                `https://itunes.apple.com/search?term=${term}&media=music&entity=song&limit=10`
            );
            const data = await res.json();

            if (!data.results) continue;

            // Prefer an exact title match first
            const exactHit = data.results.find(r =>
                r.previewUrl &&
                r.trackName &&
                r.trackName.toLowerCase().replace(/[^a-z0-9]/g, '') ===
                cleanName.toLowerCase().replace(/[^a-z0-9]/g, '')
            );
            if (exactHit) return exactHit.previewUrl;

            // Otherwise take the first result with a preview
            const anyHit = data.results.find(r => r.previewUrl);
            if (anyHit) return anyHit.previewUrl;

            await sleep(80);
        } catch {
            // network hiccup — try next query
        }
    }
    return null;
}

(async () => {
    // Load existing previews so we can resume / skip already-found songs
    let previews = {};
    const outPath = path.join(__dirname, 'previews.json');
    if (fs.existsSync(outPath)) {
        try { previews = JSON.parse(fs.readFileSync(outPath, 'utf8')); } catch {}
    }

    let found   = Object.keys(previews).length;
    let skipped = 0;

    for (let i = 0; i < PLAYLIST.length; i++) {
        const { name, artistNames } = PLAYLIST[i];
        const key = `${name}::${artistNames}`;

        // Skip songs already in the file
        if (previews[key]) {
            skipped++;
            process.stdout.write(
                `\r[${String(i + 1).padStart(3)}/${PLAYLIST.length}] –  found: ${found}  skipped: ${skipped}  — ${name.slice(0, 35).padEnd(35)}`
            );
            continue;
        }

        const url = await fetchPreviewUrl(name, artistNames);

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

        await sleep(120); // ~8 req/sec — comfortably within iTunes rate limits
    }

    fs.writeFileSync(outPath, JSON.stringify(previews, null, 2));

    const total = PLAYLIST.length;
    console.log(`\n\nDone. ${found}/${total} previews saved to previews.json`);
    if (found < total) {
        console.log(`Missing ${total - found} songs — these may not be on iTunes or couldn't be matched.`);
    }
})();
