/**
 * Policies Endpoint
 * GET /api/policies - List policies
 * POST /api/policies/:id/acknowledge - Acknowledge policy
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

  const token = getTokenFromHeader(event.headers);
  const decoded = verifyToken(token);
  if (!decoded) {
    return { statusCode: 401, headers, body: JSON.stringify({ success: false, error: 'Unauthorized' }) };
  }

  const { db } = await connectToDatabase();

  try {
    // GET /api/policies
    if (event.httpMethod === 'GET') {
      const policies = await db.collection('policies')
        .find({ companyId: new ObjectId(decoded.companyId), active: true })
        .toArray();

      // Get acknowledgments for this user
      const acks = await db.collection('acknowledgments')
        .find({ employeeId: new ObjectId(decoded.employeeId) })
        .toArray();

      const ackMap = new Map(acks.map(a => [a.policyId.toString(), a]));

      const policiesWithStatus = policies.map(p => ({
        ...p,
        acknowledged: ackMap.has(p._id.toString()),
        acknowledgedAt: ackMap.get(p._id.toString())?.acknowledgedAt || null,
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, data: { policies: policiesWithStatus } }),
      };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ success: false, error: 'Method not allowed' }) };
  } catch (error) {
    console.error('Policies error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: 'Server error' }) };
  }
};
