/**
 * Pay Period Summary Endpoint
 * GET /api/time/summary
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

    // Get current pay period (last 14 days for now)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 14);
    startDate.setHours(0, 0, 0, 0);

    const entries = await db.collection('timeEntries').find({
      employeeId: new ObjectId(decoded.employeeId),
      clockIn: { $gte: startDate },
    }).toArray();

    let totalMinutes = 0;
    for (const entry of entries) {
      if (entry.duration) {
        totalMinutes += entry.duration;
      } else if (entry.clockIn && !entry.clockOut) {
        // Active entry
        totalMinutes += Math.round((new Date() - entry.clockIn) / 1000 / 60);
      }
    }

    const totalHours = totalMinutes / 60;
    const overtimeThreshold = 40;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          totalHours: Math.round(totalHours * 10) / 10,
          totalMinutes,
          overtimeThreshold,
          approachingOvertime: totalHours >= overtimeThreshold - 5,
        },
      }),
    };
  } catch (error) {
    console.error('Summary error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: 'Server error' }) };
  }
};
