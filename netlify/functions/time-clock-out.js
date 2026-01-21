/**
 * Clock Out Endpoint
 * POST /api/time/clock-out
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

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ success: false, error: 'Method not allowed' }) };
  }

  try {
    const token = getTokenFromHeader(event.headers);
    const decoded = verifyToken(token);
    if (!decoded) {
      return { statusCode: 401, headers, body: JSON.stringify({ success: false, error: 'Unauthorized' }) };
    }

    const { location } = JSON.parse(event.body || '{}');
    const { db } = await connectToDatabase();

    // Find active entry
    const activeEntry = await db.collection('timeEntries').findOne({
      employeeId: new ObjectId(decoded.employeeId),
      clockOut: null,
    });

    if (!activeEntry) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Not clocked in' }),
      };
    }

    const clockOut = new Date();
    const duration = (clockOut - activeEntry.clockIn) / 1000 / 60; // minutes

    await db.collection('timeEntries').updateOne(
      { _id: activeEntry._id },
      {
        $set: {
          clockOut,
          clockOutLocation: location || null,
          duration: Math.round(duration),
        },
      }
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: { clockOut, duration: Math.round(duration) },
      }),
    };
  } catch (error) {
    console.error('Clock out error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: 'Server error' }) };
  }
};
