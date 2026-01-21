/**
 * Pending Policies Endpoint
 * GET /api/policies/pending
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

    // Get all required policies
    const policies = await db.collection('policies')
      .find({ companyId: new ObjectId(decoded.companyId), active: true, required: true })
      .toArray();

    // Get acknowledgments
    const acks = await db.collection('acknowledgments')
      .find({ employeeId: new ObjectId(decoded.employeeId) })
      .toArray();

    const ackIds = new Set(acks.map(a => a.policyId.toString()));

    // Filter to pending
    const pending = policies.filter(p => !ackIds.has(p._id.toString()));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, data: { pending } }),
    };
  } catch (error) {
    console.error('Pending policies error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: 'Server error' }) };
  }
};
