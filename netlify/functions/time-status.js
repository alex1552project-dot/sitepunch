/**
 * Time Status Endpoint
 * GET /api/time/status
 */

const { ObjectId } = require('mongodb');
const { connectToDatabase } = require('../../shared/db');
const { verifyToken, getTokenFromHeader } = require('../../shared/auth');

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const token = getTokenFromHeader(event.headers);
    const decoded = verifyToken(token);
    if (!decoded) {
      return { statusCode: 401, headers, body: JSON.stringify({ success: false, error: 'Unauthorized' }) };
    }

    const { db } = await connectToDatabase();

    const activeEntry = await db.collection('timeEntries').findOne({
      employeeId: new ObjectId(decoded.employeeId),
      clockOut: null,
    });

    if (activeEntry) {
      const now = new Date();
      const minutes = Math.round((now - activeEntry.clockIn) / 1000 / 60);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: {
            isClockedIn: true,
            currentEntry: activeEntry,
            currentDuration: { minutes },
          },
        }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: { isClockedIn: false, currentEntry: null, currentDuration: null },
      }),
    };
  } catch (error) {
    console.error('Status error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: 'Server error' }) };
  }
};
