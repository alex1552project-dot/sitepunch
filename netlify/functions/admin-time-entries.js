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
    const params = event.queryStringParameters || {};

    // GET - List time entries or get single entry
    if (event.httpMethod === 'GET') {
      // Get single entry by ID
      if (params.entryId) {
        const entry = await db.collection('timeEntries').findOne({
          _id: new ObjectId(params.entryId),
          companyId: companyId
        });

        if (!entry) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ success: false, error: 'Entry not found' })
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, entry })
        };
      }

      // Build query for list
      const query = { companyId: companyId };

      // Filter by date
      if (params.date) {
        const startDate = new Date(params.date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(params.date);
        endDate.setHours(23, 59, 59, 999);
        query.clockIn = { $gte: startDate, $lte: endDate };
      }

      // Filter by employee
      if (params.employeeId) {
        query.employeeId = params.employeeId;
      }

      // Get time entries
      const entries = await db.collection('timeEntries')
        .find(query)
        .sort({ clockIn: -1 })
        .limit(100)
        .toArray();

      // Get employee names
      const employeeIds = [...new Set(entries.map(e => e.employeeId))];
      const employees = await db.collection('employees')
        .find({ _id: { $in: employeeIds.map(id => {
          try { return new ObjectId(id); } catch { return id; }
        }) } })
        .toArray();

      const employeeMap = {};
      employees.forEach(emp => {
        employeeMap[emp._id.toString()] = `${emp.firstName} ${emp.lastName}`;
      });

      // Add employee names and calculate hours
      const enrichedEntries = entries.map(entry => {
        let totalHours = null;
        if (entry.clockIn && entry.clockOut) {
          const diff = new Date(entry.clockOut) - new Date(entry.clockIn);
          totalHours = diff / (1000 * 60 * 60);
        }

        return {
          ...entry,
          employeeName: employeeMap[entry.employeeId] || 'Unknown',
          totalHours
        };
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, entries: enrichedEntries })
      };
    }

    // PUT - Update time entry
    if (event.httpMethod === 'PUT') {
      const entryId = params.id;

      if (!entryId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'Entry ID required' })
        };
      }

      const data = JSON.parse(event.body);
      const updateFields = {
        updatedAt: new Date(),
        updatedBy: adminId
      };

      if (data.clockIn) updateFields.clockIn = new Date(data.clockIn);
      if (data.clockOut) updateFields.clockOut = new Date(data.clockOut);
      if (data.clockOut === null) updateFields.clockOut = null;
      if (data.adminNotes !== undefined) updateFields.adminNotes = data.adminNotes;

      await db.collection('timeEntries').updateOne(
        { _id: new ObjectId(entryId), companyId: companyId },
        { $set: updateFields }
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Time entries error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: 'Server error' })
    };
  } finally {
    if (client) await client.close();
  }
};
