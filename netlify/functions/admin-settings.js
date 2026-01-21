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

    // GET - Get company settings
    if (event.httpMethod === 'GET') {
      const company = await db.collection('companies').findOne({ _id: companyId });

      if (!company) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ success: false, error: 'Company not found' })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          settings: {
            name: company.name,
            timezone: company.settings?.timezone || 'America/Chicago',
            overtimeThreshold: company.settings?.overtimeThreshold || 40,
            payPeriodType: company.settings?.payPeriodType || 'biweekly'
          }
        })
      };
    }

    // PUT - Update company settings
    if (event.httpMethod === 'PUT') {
      const data = JSON.parse(event.body);

      const updateFields = { updatedAt: new Date() };

      if (data.name) updateFields.name = data.name;
      if (data.timezone) updateFields['settings.timezone'] = data.timezone;
      if (data.overtimeThreshold) updateFields['settings.overtimeThreshold'] = data.overtimeThreshold;
      if (data.payPeriodType) updateFields['settings.payPeriodType'] = data.payPeriodType;

      await db.collection('companies').updateOne(
        { _id: companyId },
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
    console.error('Settings error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: 'Server error' })
    };
  } finally {
    if (client) await client.close();
  }
};
