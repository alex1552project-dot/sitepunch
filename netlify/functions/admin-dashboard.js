const { MongoClient, ObjectId } = require('mongodb');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
};

// Simple auth check
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

    // Get admin's company
    const admin = await db.collection('admins').findOne({ _id: new ObjectId(adminId) });
    if (!admin) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, error: 'Admin not found' })
      };
    }

    const companyId = admin.companyId;

    // Get stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Count employees
    const totalEmployees = await db.collection('employees').countDocuments({
      companyId: companyId,
      active: true
    });

    // Count currently clocked in
    const clockedIn = await db.collection('timeEntries').countDocuments({
      companyId: companyId,
      clockOut: null
    });

    // Count pending time off requests
    const pendingTimeOff = await db.collection('timeOffRequests').countDocuments({
      companyId: companyId,
      status: 'pending'
    });

    // Count open incidents
    const openIncidents = await db.collection('incidents').countDocuments({
      companyId: companyId,
      status: { $ne: 'resolved' }
    });

    // Get recent activity (last 10 time entries)
    const recentEntries = await db.collection('timeEntries')
      .find({ companyId: companyId })
      .sort({ clockIn: -1 })
      .limit(10)
      .toArray();

    // Get employee names for activity
    const employeeIds = [...new Set(recentEntries.map(e => e.employeeId))];
    const employees = await db.collection('employees')
      .find({ _id: { $in: employeeIds.map(id => new ObjectId(id)) } })
      .toArray();
    
    const employeeMap = {};
    employees.forEach(emp => {
      employeeMap[emp._id.toString()] = `${emp.firstName} ${emp.lastName}`;
    });

    const recentActivity = recentEntries.map(entry => ({
      type: entry.clockOut ? 'clock-out' : 'clock-in',
      description: `${employeeMap[entry.employeeId] || 'Unknown'} ${entry.clockOut ? 'clocked out' : 'clocked in'}`,
      timestamp: entry.clockOut || entry.clockIn
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        stats: {
          totalEmployees,
          clockedIn,
          pendingTimeOff,
          openIncidents
        },
        recentActivity
      })
    };

  } catch (error) {
    console.error('Dashboard error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: 'Server error' })
    };
  } finally {
    if (client) await client.close();
  }
};
