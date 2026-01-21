/**
 * Clock In Endpoint
 * POST /api/time/clock-in
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
    // Verify auth
    const token = getTokenFromHeader(event.headers);
    const decoded = verifyToken(token);
    if (!decoded) {
      return { statusCode: 401, headers, body: JSON.stringify({ success: false, error: 'Unauthorized' }) };
    }

    const { location } = JSON.parse(event.body || '{}');
    const { db } = await connectToDatabase();

    // Check if already clocked in
    const activeEntry = await db.collection('timeEntries').findOne({
      employeeId: new ObjectId(decoded.employeeId),
      clockOut: null,
    });

    if (activeEntry) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Already clocked in' }),
      };
    }

    // Create time entry
    const entry = {
      employeeId: new ObjectId(decoded.employeeId),
      companyId: new ObjectId(decoded.companyId),
      clockIn: new Date(),
      clockInLocation: location || null,
      clockOut: null,
      clockOutLocation: null,
      duration: null,
      createdAt: new Date(),
    };

    const result = await db.collection('timeEntries').insertOne(entry);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: { entryId: result.insertedId, clockIn: entry.clockIn },
      }),
    };
  } catch (error) {
    console.error('Clock in error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: 'Server error' }) };
  }
};
