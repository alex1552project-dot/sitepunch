const { MongoClient, ObjectId } = require('mongodb');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    };
  }

  let client;
  try {
    const { email, password } = JSON.parse(event.body);

    if (!email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Email and password required' })
      };
    }

    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db('sitepunch');

    // Find admin by email
    const admin = await db.collection('admins').findOne({ 
      email: email.toLowerCase(),
      active: true
    });

    if (!admin) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, error: 'Invalid credentials' })
      };
    }

    // For now, simple password check (in production, use bcrypt)
    // The passwordHash field stores the plain password temporarily
    if (admin.passwordHash !== password) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, error: 'Invalid credentials' })
      };
    }

    // Generate simple token (in production, use JWT)
    const token = Buffer.from(`${admin._id}:${Date.now()}`).toString('base64');

    // Update last login
    await db.collection('admins').updateOne(
      { _id: admin._id },
      { $set: { lastLogin: new Date() } }
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        token,
        admin: {
          id: admin._id,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: admin.role,
          companyId: admin.companyId
        }
      })
    };

  } catch (error) {
    console.error('Admin login error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: 'Server error' })
    };
  } finally {
    if (client) await client.close();
  }
};
