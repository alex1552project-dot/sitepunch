const { MongoClient, ObjectId } = require('mongodb');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

    // GET - List policies
    if (event.httpMethod === 'GET') {
      const policies = await db.collection('policies')
        .find({ companyId: companyId })
        .sort({ createdAt: -1 })
        .toArray();

      const totalEmployees = await db.collection('employees').countDocuments({
        companyId: companyId,
        active: true
      });

      const enrichedPolicies = await Promise.all(policies.map(async (policy) => {
        const acknowledgmentCount = await db.collection('acknowledgments').countDocuments({
          policyId: policy._id
        });
        return { ...policy, acknowledgmentCount, totalEmployees };
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, policies: enrichedPolicies })
      };
    }

    // POST - Create policy
    if (event.httpMethod === 'POST') {
      const data = JSON.parse(event.body);

      if (!data.title || !data.content) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'Title and content required' })
        };
      }

      const newPolicy = {
        companyId: companyId,
        title: data.title,
        description: data.description || '',
        content: data.content,
        attachments: data.attachments || [],
        required: data.required !== false,
        active: true,
        effectiveDate: new Date(),
        createdAt: new Date(),
        createdBy: adminId
      };

      const result = await db.collection('policies').insertOne(newPolicy);

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ success: true, policy: { ...newPolicy, _id: result.insertedId } })
      };
    }

    // PUT - Update policy
    if (event.httpMethod === 'PUT') {
      const params = event.queryStringParameters || {};
      const policyId = params.id;

      if (!policyId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'Policy ID required' })
        };
      }

      const data = JSON.parse(event.body);
      const updateFields = { updatedAt: new Date() };

      if (data.title) updateFields.title = data.title;
      if (data.description !== undefined) updateFields.description = data.description;
      if (data.content) updateFields.content = data.content;
      if (data.required !== undefined) updateFields.required = data.required;
      if (data.active !== undefined) updateFields.active = data.active;
      if (data.attachments !== undefined) updateFields.attachments = data.attachments;

      await db.collection('policies').updateOne(
        { _id: new ObjectId(policyId), companyId: companyId },
        { $set: updateFields }
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };
    }

    // DELETE - Delete policy
    if (event.httpMethod === 'DELETE') {
      const params = event.queryStringParameters || {};
      const policyId = params.id;

      if (!policyId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'Policy ID required' })
        };
      }

      await db.collection('policies').updateOne(
        { _id: new ObjectId(policyId), companyId: companyId },
        { $set: { active: false, deletedAt: new Date() } }
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
    console.error('Policies error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: 'Server error' })
    };
  } finally {
    if (client) await client.close();
  }
};
