import PREVIEWS from './previews.json';
import { PLAYLIST } from './playlist.js';

const DURATIONS = [1, 3, 8, 17, 30]; // seconds unlocked per attempt index (0–4)
const PREVIEW_SECONDS = 30;          // length of a full preview clip
const CLIP_SLACK_SECONDS = 0.75;     // extra audio sent so the client can cut cleanly
const SESSION_TTL = 7200;

const CORS = {
    'Access-Control-Allow-Origin': 'https://jmilkman.github.io',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Range',
    'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
};

function json(data, status = 200) {
    return Response.json(data, { status, headers: CORS });
}

// Lowercase, strip accents and punctuation so "Hey Ya!" == "hey ya" and "Beyoncé" == "beyonce".
function normalize(str) {
    return String(str || '')
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

// A guess is correct when its title part matches the song title exactly
// (with or without a trailing parenthetical like "(Remix)").
// The autocomplete fills "Title - Artist", so only the text before the last " - " counts.
function isCorrectGuess(guess, songName) {
    const raw = String(guess || '');
    const dash = raw.lastIndexOf(' - ');
    const titlePart = normalize(dash > 0 ? raw.slice(0, dash) : raw);
    if (!titlePart) return false;
    const accepted = new Set([
        normalize(songName),
        normalize(songName.replace(/\s*\([^)]*\)\s*/g, ' ')),
    ]);
    return accepted.has(titlePart) || accepted.has(normalize(raw));
}

function computeScore(attempts, timeMs) {
    return Math.max(0, 1000 - (attempts - 1) * 150 - Math.floor(timeMs / 1000) * 5);
}

async function loadSession(env, id) {
    const raw = await env.SESSIONS.get(`game:${id}`);
    return raw ? JSON.parse(raw) : null;
}

function saveSession(env, id, session) {
    return env.SESSIONS.put(`game:${id}`, JSON.stringify(session), { expirationTtl: SESSION_TTL });
}

function reveal(session) {
    return { songName: session.songName, artistName: session.artistName };
}

export default {
    async fetch(request, env, ctx) {
        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: CORS });
        }

        const url = new URL(request.url);
        const path = url.pathname;

        // GET /playlist — full song list, for the frontend's guess autocomplete
        if (path === '/playlist' && request.method === 'GET') {
            return json(PLAYLIST);
        }

        // POST /game/start — pick a random song, store session in KV
        if (path === '/game/start' && request.method === 'POST') {
            const available = PLAYLIST.filter(s => PREVIEWS[`${s.name}::${s.artistNames}`]);
            const song = available[Math.floor(Math.random() * available.length)];
            const gameId = crypto.randomUUID();

            await saveSession(env, gameId, {
                songKey: `${song.name}::${song.artistNames}`,
                songName: song.name,
                artistName: song.artistNames,
                attempt: 0,
                won: false,
                over: false,
                submitted: false,
                createdAt: Date.now(),
                startedAt: null, // set on first audio request, so score time starts at first play
            });

            return json({ gameId, durations: DURATIONS });
        }

        // GET /game/:id/audio — serve only the bytes unlocked for the current attempt
        const audioMatch = path.match(/^\/game\/([^/]+)\/audio$/);
        if (audioMatch && request.method === 'GET') {
            const id = audioMatch[1];
            const session = await loadSession(env, id);
            if (!session) return json({ error: 'Session expired or not found' }, 404);

            const previewUrl = PREVIEWS[session.songKey];
            if (!previewUrl) return json({ error: 'No preview available for this song' }, 404);

            if (!session.startedAt) {
                session.startedAt = Date.now();
                ctx.waitUntil(saveSession(env, id, session));
            }

            const upstream = await fetch(previewUrl, { cf: { cacheEverything: true, cacheTtl: 86400 } });
            if (!upstream.ok) return json({ error: 'Upstream audio unavailable' }, 502);
            const full = new Uint8Array(await upstream.arrayBuffer());

            // MP3 is constant bitrate, so bytes map linearly to time.
            // Once the game is over the whole clip is unlocked.
            const seconds = session.over
                ? PREVIEW_SECONDS
                : DURATIONS[Math.min(session.attempt, DURATIONS.length - 1)] + CLIP_SLACK_SECONDS;
            const allowed = Math.min(full.length, Math.ceil(full.length * seconds / PREVIEW_SECONDS));
            const body = full.subarray(0, allowed);

            const headers = {
                ...CORS,
                'Content-Type': upstream.headers.get('Content-Type') || 'audio/mpeg',
                'Accept-Ranges': 'bytes',
                'Cache-Control': 'no-store',
            };

            // Range support is required by iOS Safari for <audio> playback.
            const range = (request.headers.get('Range') || '').match(/^bytes=(\d*)-(\d*)$/);
            if (range && (range[1] || range[2])) {
                let start, end;
                if (range[1]) {
                    start = parseInt(range[1], 10);
                    end = range[2] ? Math.min(parseInt(range[2], 10), allowed - 1) : allowed - 1;
                } else {
                    start = Math.max(0, allowed - parseInt(range[2], 10));
                    end = allowed - 1;
                }
                if (start >= allowed || start > end) {
                    return new Response(null, {
                        status: 416,
                        headers: { ...headers, 'Content-Range': `bytes */${allowed}` },
                    });
                }
                return new Response(body.slice(start, end + 1), {
                    status: 206,
                    headers: {
                        ...headers,
                        'Content-Range': `bytes ${start}-${end}/${allowed}`,
                        'Content-Length': String(end - start + 1),
                    },
                });
            }

            return new Response(body, {
                status: 200,
                headers: { ...headers, 'Content-Length': String(allowed) },
            });
        }

        // POST /game/:id/skip — advance attempt counter
        const skipMatch = path.match(/^\/game\/([^/]+)\/skip$/);
        if (skipMatch && request.method === 'POST') {
            const id = skipMatch[1];
            const session = await loadSession(env, id);
            if (!session) return json({ error: 'Session expired or not found' }, 404);

            if (session.over) {
                return json({ attempt: session.attempt, over: true, won: session.won, ...reveal(session) });
            }

            // Skipping the final attempt ends the game and reveals the answer
            if (session.attempt >= DURATIONS.length - 1) {
                session.over = true;
                await saveSession(env, id, session);
                return json({ attempt: session.attempt, over: true, won: false, ...reveal(session) });
            }

            session.attempt++;
            await saveSession(env, id, session);
            return json({ attempt: session.attempt });
        }

        // POST /game/:id/guess — validate a guess
        const guessMatch = path.match(/^\/game\/([^/]+)\/guess$/);
        if (guessMatch && request.method === 'POST') {
            const id = guessMatch[1];
            const session = await loadSession(env, id);
            if (!session) return json({ error: 'Session expired or not found' }, 404);

            if (session.over) {
                return json({ correct: session.won, over: true, ...reveal(session), score: session.score });
            }

            let guess = '';
            try { ({ guess } = await request.json()); } catch { /* empty body */ }
            if (typeof guess !== 'string' || guess.length > 200) {
                return json({ error: 'Invalid guess' }, 400);
            }

            if (isCorrectGuess(guess, session.songName)) {
                const attempts = session.attempt + 1;
                const timeMs = Date.now() - (session.startedAt || session.createdAt || Date.now());
                session.won = true;
                session.over = true;
                session.score = computeScore(attempts, timeMs);
                session.attempts = attempts;
                session.timeMs = timeMs;
                await saveSession(env, id, session);
                return json({ correct: true, over: true, ...reveal(session), score: session.score, attempts, timeMs });
            }

            if (session.attempt >= DURATIONS.length - 1) {
                session.over = true;
                await saveSession(env, id, session);
                return json({ correct: false, over: true, ...reveal(session) });
            }

            session.attempt++;
            await saveSession(env, id, session);
            return json({ correct: false, attempt: session.attempt });
        }

        // GET /leaderboard — top 10 scores
        if (path === '/leaderboard' && request.method === 'GET') {
            try {
                const result = await env.DB.prepare(
                    'SELECT username, score, song_name, artist_name, attempts, time_ms FROM leaderboard ORDER BY score DESC, created_at ASC LIMIT 10'
                ).all();
                return json({ entries: result.results });
            } catch (e) {
                return json({ error: String(e), entries: [] }, 500);
            }
        }

        // POST /leaderboard — submit the score of a won game (score is computed server-side)
        if (path === '/leaderboard' && request.method === 'POST') {
            let body = {};
            try { body = await request.json(); } catch { /* fall through to validation */ }
            const name = String(body.username || '').trim().slice(0, 24);
            if (!name) return json({ error: 'Username required' }, 400);
            if (typeof body.gameId !== 'string') return json({ error: 'Missing game' }, 400);

            const id = body.gameId;
            const session = await loadSession(env, id);
            if (!session) return json({ error: 'Game expired — scores must be submitted within 2 hours' }, 404);
            if (!session.won) return json({ error: 'Only won games can be submitted' }, 400);
            if (session.submitted) return json({ error: 'Score already submitted' }, 409);

            try {
                await env.DB.prepare(
                    'INSERT INTO leaderboard (username, score, song_name, artist_name, attempts, time_ms) VALUES (?, ?, ?, ?, ?, ?)'
                ).bind(name, session.score, session.songName, session.artistName, session.attempts, session.timeMs).run();
            } catch (e) {
                return json({ error: 'Could not save score' }, 500);
            }

            session.submitted = true;
            await saveSession(env, id, session);
            return json({ ok: true, score: session.score });
        }

        return new Response('Not found', { status: 404, headers: CORS });
    },
};
