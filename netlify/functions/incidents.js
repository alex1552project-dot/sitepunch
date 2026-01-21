/**
 * Incidents Endpoint
 * POST /api/incidents - Create incident
 * GET /api/incidents - List incidents
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
    if (event.httpMethod === 'POST') {
      const data = JSON.parse(event.body);

      const incident = {
        employeeId: new ObjectId(decoded.employeeId),
        companyId: new ObjectId(decoded.companyId),
        incidentType: data.incidentType,
        severity: data.severity,
        description: data.description,
        location: data.location,
        gpsLocation: data.gpsLocation,
        photos: data.photos || [],
        status: 'reported',
        reportedAt: new Date(data.reportedAt) || new Date(),
        createdAt: new Date(),
      };

      const result = await db.collection('incidents').insertOne(incident);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, data: { incidentId: result.insertedId } }),
      };
    }

    if (event.httpMethod === 'GET') {
      const incidents = await db.collection('incidents')
        .find({ employeeId: new ObjectId(decoded.employeeId) })
        .sort({ reportedAt: -1 })
        .limit(20)
        .toArray();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, data: { incidents } }),
      };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ success: false, error: 'Method not allowed' }) };
  } catch (error) {
    console.error('Incidents error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: 'Server error' }) };
  }
};
