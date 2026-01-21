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

    // GET - List incidents or get single incident
    if (event.httpMethod === 'GET') {
      // Get single incident
      if (params.id) {
        const incident = await db.collection('incidents').findOne({
          _id: new ObjectId(params.id),
          companyId: companyId
        });

        if (!incident) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ success: false, error: 'Incident not found' })
          };
        }

        // Get employee name
        let employeeName = 'Unknown';
        if (incident.employeeId) {
          try {
            const employee = await db.collection('employees').findOne({
              _id: new ObjectId(incident.employeeId)
            });
            if (employee) {
              employeeName = `${employee.firstName} ${employee.lastName}`;
            }
          } catch {}
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            success: true, 
            incident: { ...incident, employeeName }
          })
        };
      }

      // List all incidents
      const incidents = await db.collection('incidents')
        .find({ companyId: companyId })
        .sort({ createdAt: -1 })
        .toArray();

      // Get employee names
      const employeeIds = [...new Set(incidents.map(i => i.employeeId).filter(Boolean))];
      const employees = await db.collection('employees')
        .find({ _id: { $in: employeeIds.map(id => {
          try { return new ObjectId(id); } catch { return id; }
        }) } })
        .toArray();

      const employeeMap = {};
      employees.forEach(emp => {
        employeeMap[emp._id.toString()] = `${emp.firstName} ${emp.lastName}`;
      });

      const enrichedIncidents = incidents.map(inc => ({
        ...inc,
        employeeName: employeeMap[inc.employeeId] || 'Unknown'
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, incidents: enrichedIncidents })
      };
    }

    // PUT - Update incident (resolve)
    if (event.httpMethod === 'PUT') {
      const incidentId = params.id;
      const action = params.action;

      if (!incidentId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'Incident ID required' })
        };
      }

      const updateData = {
        updatedAt: new Date(),
        updatedBy: adminId
      };

      if (action === 'resolve') {
        updateData.status = 'resolved';
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = adminId;
      }

      // Allow adding notes via body
      if (event.body) {
        const body = JSON.parse(event.body);
        if (body.notes) {
          updateData.adminNotes = body.notes;
        }
        if (body.status) {
          updateData.status = body.status;
        }
      }

      await db.collection('incidents').updateOne(
        { _id: new ObjectId(incidentId), companyId: companyId },
        { $set: updateData }
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
    console.error('Incidents error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: 'Server error' })
    };
  } finally {
    if (client) await client.close();
  }
};
