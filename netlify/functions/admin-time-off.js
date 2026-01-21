const { MongoClient, ObjectId } = require('mongodb');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Content-Type': 'application/json'
};

function getAdminId(event) {
  const auth = event.headers.authorization || event.headers.Authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  try {
    const token = auth.replace('Bearer ', '');
    const decoded = Buffer.from(token, 'base64').toString();
    return decoded.split(':')[0];
  } catch {
    return null;
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const adminId = getAdminId(event);
  if (!adminId) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ success: false, error: 'Unauthorized' })
    };
  }

  let client;
  try {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db('sitepunch');

    const admin = await db.collection('admins').findOne({ _id: new ObjectId(adminId) });
    if (!admin) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, error: 'Admin not found' })
      };
    }

    const companyId = admin.companyId;

    // GET - List time off requests
    if (event.httpMethod === 'GET') {
      const requests = await db.collection('timeOffRequests')
        .find({ companyId: companyId })
        .sort({ createdAt: -1 })
        .toArray();

      // Get employee names
      const employeeIds = [...new Set(requests.map(r => r.employeeId))];
      const employees = await db.collection('employees')
        .find({ _id: { $in: employeeIds.map(id => {
          try { return new ObjectId(id); } catch { return id; }
        }) } })
        .toArray();

      const employeeMap = {};
      employees.forEach(emp => {
        employeeMap[emp._id.toString()] = `${emp.firstName} ${emp.lastName}`;
      });

      const enrichedRequests = requests.map(req => ({
        ...req,
        employeeName: employeeMap[req.employeeId] || 'Unknown'
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, requests: enrichedRequests })
      };
    }

    // PUT - Approve or deny request
    if (event.httpMethod === 'PUT') {
      const params = event.queryStringParameters || {};
      const requestId = params.id;
      const action = params.action; // 'approve' or 'deny'

      if (!requestId || !action) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'Request ID and action required' })
        };
      }

      const status = action === 'approve' ? 'approved' : 'denied';

      await db.collection('timeOffRequests').updateOne(
        { _id: new ObjectId(requestId), companyId: companyId },
        { 
          $set: { 
            status,
            reviewedBy: adminId,
            reviewedAt: new Date()
          }
        }
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, status })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Time off error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: 'Server error' })
    };
  } finally {
    if (client) await client.close();
  }
};
