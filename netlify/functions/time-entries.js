/**
 * Time Entries Endpoint
 * GET /api/time/entries
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

    const entries = await db.collection('timeEntries')
      .find({ employeeId: new ObjectId(decoded.employeeId) })
      .sort({ clockIn: -1 })
      .limit(50)
      .toArray();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, data: { entries } }),
    };
  } catch (error) {
    console.error('Entries error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: 'Server error' }) };
  }
};
