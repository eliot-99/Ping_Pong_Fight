// Vercel Serverless Function for Room Management
// Uses Postgres (NileDB) for storage

import postgres from 'postgres';

const sql = postgres(process.env.NILEDB_URL || process.env.POSTGRES_URL, {
  ssl: 'require'
});

// Initialize rooms table
async function initTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS rooms (
        code VARCHAR(6) PRIMARY KEY,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
  } catch (e) {
    console.error('Table init error:', e);
  }
}

// Initialize on cold start
initTable();

export default async function handler(request, response) {
  const { method, query, body } = request;
  const roomCode = query.code || body?.roomCode;

  // CORS headers
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    return response.status(200).end();
  }

  try {
    switch (method) {
      case 'GET': {
        // Get room by code
        if (!roomCode) {
          return response.status(400).json({ success: false, error: 'Room code required' });
        }
        const [room] = await sql`
          SELECT data FROM rooms WHERE code = ${roomCode}
        `;
        if (room) {
          return response.json({ success: true, room: room.data });
        }
        return response.json({ success: false, error: 'Room not found' });
      }

      case 'POST': {
        // Create new room
        if (!roomCode) {
          return response.status(400).json({ success: false, error: 'Room code required' });
        }
        const [existing] = await sql`
          SELECT code FROM rooms WHERE code = ${roomCode}
        `;
        if (existing) {
          return response.json({ success: false, error: 'Room already exists' });
        }
        await sql`
          INSERT INTO rooms (code, data)
          VALUES (${roomCode}, ${JSON.stringify({ ...body, createdAt: Date.now() })})
        `;
        return response.json({ success: true, roomCode });
      }

      case 'PUT': {
        // Update room
        if (!roomCode) {
          return response.status(400).json({ success: false, error: 'Room code required' });
        }
        const [roomExists] = await sql`
          SELECT code FROM rooms WHERE code = ${roomCode}
        `;
        if (!roomExists) {
          return response.json({ success: false, error: 'Room not found' });
        }
        await sql`
          UPDATE rooms SET data = data || ${JSON.stringify(body)}
          WHERE code = ${roomCode}
        `;
        return response.json({ success: true });
      }

      case 'DELETE': {
        // Delete room
        if (!roomCode) {
          return response.status(400).json({ success: false, error: 'Room code required' });
        }
        await sql`DELETE FROM rooms WHERE code = ${roomCode}`;
        return response.json({ success: true });
      }

      default:
        return response.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return response.status(500).json({ success: false, error: error.message });
  }
}
