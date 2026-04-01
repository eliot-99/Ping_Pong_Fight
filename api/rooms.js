// Vercel Serverless Function for Room Management
// Uses Vercel KV (Redis) for storage

// In production, import from @vercel/kv
// import { kv } from '@vercel/kv';

let kv = null;

// Initialize KV only in production (Vercel environment)
if (process.env.VERCEL) {
    try {
        // Dynamic import for Vercel KV
        const { kv: kvModule } = await import('@vercel/kv');
        kv = kvModule;
    } catch (e) {
        console.error('KV import failed:', e);
    }
}

// For local development, use in-memory storage
const localRooms = new Map();

function getRooms() {
    if (kv) {
        return kv;
    }
    return {
        get: async (key) => localRooms.get(key),
        set: async (key, value) => localRooms.set(key, value),
        del: async (key) => localRooms.delete(key),
        hgetall: async (key) => {
            const data = localRooms.get(key);
            return data || null;
        },
        hset: async (key, field, value) => {
            const room = localRooms.get(key) || {};
            room[field] = value;
            localRooms.set(key, room);
        },
        hmset: async (key, obj) => {
            const room = localRooms.get(key) || {};
            Object.assign(room, obj);
            localRooms.set(key, room);
        }
    };
}

export default async function handler(request, response) {
    const { method, query, body } = request;
    const roomCode = query.code || body?.roomCode;

    const storage = getRooms();

    // Set CORS headers
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (method === 'OPTIONS') {
        return response.status(200).end();
    }

    try {
        switch (method) {
            case 'GET':
                // Get room by code
                if (!roomCode) {
                    return response.status(400).json({ success: false, error: 'Room code required' });
                }
                const room = await storage.hgetall(`room:${roomCode}`);
                if (room) {
                    return response.json({ success: true, room });
                }
                return response.json({ success: false, error: 'Room not found' });

            case 'POST':
                // Create new room
                if (!roomCode) {
                    return response.status(400).json({ success: false, error: 'Room code required' });
                }
                const existing = await storage.hgetall(`room:${roomCode}`);
                if (existing) {
                    return response.json({ success: false, error: 'Room already exists' });
                }
                await storage.hmset(`room:${roomCode}`, {
                    ...body,
                    createdAt: Date.now()
                });
                return response.json({ success: true, roomCode });

            case 'PUT':
                // Update room
                if (!roomCode) {
                    return response.status(400).json({ success: false, error: 'Room code required' });
                }
                const roomExists = await storage.hgetall(`room:${roomCode}`);
                if (!roomExists) {
                    return response.json({ success: false, error: 'Room not found' });
                }
                await storage.hmset(`room:${roomCode}`, body);
                return response.json({ success: true });

            case 'DELETE':
                // Delete room
                if (!roomCode) {
                    return response.status(400).json({ success: false, error: 'Room code required' });
                }
                await storage.del(`room:${roomCode}`);
                return response.json({ success: true });

            default:
                return response.status(405).json({ success: false, error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('API Error:', error);
        return response.status(500).json({ success: false, error: error.message });
    }
}