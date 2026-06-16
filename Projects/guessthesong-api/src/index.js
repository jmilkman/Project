import PREVIEWS from './previews.json';
import { PLAYLIST } from './playlist.js';

const DURATIONS = [1, 3, 8, 17, 30]; // seconds per attempt index (0–4)

const CORS = {
    'Access-Control-Allow-Origin': 'https://jmilkman.github.io',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
    return Response.json(data, { status, headers: CORS });
}

export default {
    async fetch(request, env) {
        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: CORS });
        }

        const url = new URL(request.url);
        const path = url.pathname;

        // POST /game/start — pick a random song, store session in KV
        if (path === '/game/start' && request.method === 'POST') {
            const available = PLAYLIST.filter(s => PREVIEWS[`${s.name}::${s.artistNames}`]);
            const song = available[Math.floor(Math.random() * available.length)];
            const gameId = crypto.randomUUID();

            await env.SESSIONS.put(`game:${gameId}`, JSON.stringify({
                songKey: `${song.name}::${song.artistNames}`,
                songName: song.name,
                artistName: song.artistNames,
                attempt: 0,
                won: false,
            }), { expirationTtl: 7200 });

            return json({ gameId });
        }

        // GET /game/:id/audio — stream only the allowed duration for the current attempt
        const audioMatch = path.match(/^\/game\/([^/]+)\/audio$/);
        if (audioMatch && request.method === 'GET') {
            const session = JSON.parse(await env.SESSIONS.get(`game:${audioMatch[1]}`));
            if (!session) return json({ error: 'Session expired or not found' }, 404);

            const itunesUrl = PREVIEWS[session.songKey];
            if (!itunesUrl) return json({ error: 'No preview available for this song' }, 404);

            // Forward Range header so the browser can seek within the clip
            const rangeHeader = request.headers.get('Range');
            const upstream = await fetch(itunesUrl, {
                headers: rangeHeader ? { 'Range': rangeHeader } : {},
            });
            if (!upstream.ok && upstream.status !== 206) {
                return json({ error: 'Upstream audio unavailable' }, 502);
            }

            return new Response(upstream.body, {
                status: upstream.status,
                headers: {
                    ...CORS,
                    'Content-Type': upstream.headers.get('Content-Type') || 'audio/mp4',
                    'Content-Length': upstream.headers.get('Content-Length') || '',
                    'Content-Range': upstream.headers.get('Content-Range') || '',
                    'Accept-Ranges': 'bytes',
                    'Cache-Control': 'no-store',
                },
            });
        }

        // POST /game/:id/skip — advance attempt counter
        const skipMatch = path.match(/^\/game\/([^/]+)\/skip$/);
        if (skipMatch && request.method === 'POST') {
            const key = `game:${skipMatch[1]}`;
            const session = JSON.parse(await env.SESSIONS.get(key));
            if (!session) return json({ error: 'Session expired or not found' }, 404);

            // If already at max attempt, this is the final skip — reveal the answer
            if (session.attempt >= DURATIONS.length - 1) {
                return json({
                    attempt: session.attempt,
                    songName: session.songName,
                    artistName: session.artistName,
                });
            }

            session.attempt++;
            await env.SESSIONS.put(key, JSON.stringify(session), { expirationTtl: 7200 });
            return json({ attempt: session.attempt });
        }

        // POST /game/:id/guess — validate a guess
        const guessMatch = path.match(/^\/game\/([^/]+)\/guess$/);
        if (guessMatch && request.method === 'POST') {
            const key = `game:${guessMatch[1]}`;
            const session = JSON.parse(await env.SESSIONS.get(key));
            if (!session) return json({ error: 'Session expired or not found' }, 404);

            const { guess } = await request.json();
            const normalized = (guess || '').trim().toLowerCase();
            const songName = session.songName.trim().toLowerCase();

            // Accept if the guess contains the song name (forgiving of "Song - Artist" format)
            const correct = normalized === songName || normalized.includes(songName);
            const isFinal = session.attempt >= DURATIONS.length - 1;

            if (correct) {
                session.won = true;
                await env.SESSIONS.put(key, JSON.stringify(session), { expirationTtl: 7200 });
                return json({ correct: true, songName: session.songName, artistName: session.artistName });
            }

            if (isFinal) {
                return json({ correct: false, songName: session.songName, artistName: session.artistName });
            }

            session.attempt++;
            await env.SESSIONS.put(key, JSON.stringify(session), { expirationTtl: 7200 });
            return json({ correct: false });
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

        // POST /leaderboard — submit a score
        if (path === '/leaderboard' && request.method === 'POST') {
            const { username, score, songName, artistName, attempts, timeMs } = await request.json();
            const name = (username || '').trim().slice(0, 24);
            const safeScore = parseInt(score, 10);

            if (!name || isNaN(safeScore) || safeScore < 0 || safeScore > 1000) {
                return json({ error: 'Invalid submission' }, 400);
            }

            await env.DB.prepare(
                'INSERT INTO leaderboard (username, score, song_name, artist_name, attempts, time_ms) VALUES (?, ?, ?, ?, ?, ?)'
            ).bind(name, safeScore, songName, artistName, attempts, timeMs).run();

            return json({ ok: true });
        }

        return new Response('Not found', { status: 404, headers: CORS });
    },
};
