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

    // GET - List employees
    if (event.httpMethod === 'GET') {
      const employees = await db.collection('employees')
        .find({ companyId: companyId })
        .sort({ lastName: 1, firstName: 1 })
        .toArray();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, employees })
      };
    }

    // POST - Add employee
    if (event.httpMethod === 'POST') {
      const data = JSON.parse(event.body);
      
      if (!data.firstName || !data.lastName || !data.employeeId || !data.pin) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'Missing required fields' })
        };
      }

      // Check for duplicate employee ID
      const existing = await db.collection('employees').findOne({
        companyId: companyId,
        employeeId: data.employeeId
      });

      if (existing) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'Employee ID already exists' })
        };
      }

      const newEmployee = {
        companyId: companyId,
        employeeId: data.employeeId,
        pin: data.pin,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || null,
        phone: data.phone || null,
        department: data.department || 'Field',
        role: 'employee',
        active: true,
        createdAt: new Date()
      };

      const result = await db.collection('employees').insertOne(newEmployee);

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ 
          success: true, 
          employee: { ...newEmployee, _id: result.insertedId }
        })
      };
    }

    // PUT - Update employee
    if (event.httpMethod === 'PUT') {
      const params = event.queryStringParameters || {};
      const employeeId = params.id;
      
      if (!employeeId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'Employee ID required' })
        };
      }

      const data = JSON.parse(event.body);
      const updateFields = {};
      
      if (data.firstName) updateFields.firstName = data.firstName;
      if (data.lastName) updateFields.lastName = data.lastName;
      if (data.email !== undefined) updateFields.email = data.email;
      if (data.phone !== undefined) updateFields.phone = data.phone;
      if (data.department) updateFields.department = data.department;
      if (data.pin) updateFields.pin = data.pin;
      if (data.active !== undefined) updateFields.active = data.active;
      
      updateFields.updatedAt = new Date();

      await db.collection('employees').updateOne(
        { _id: new ObjectId(employeeId), companyId: companyId },
        { $set: updateFields }
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };
    }

    // DELETE - Deactivate employee
    if (event.httpMethod === 'DELETE') {
      const params = event.queryStringParameters || {};
      const employeeId = params.id;
      
      if (!employeeId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'Employee ID required' })
        };
      }

      await db.collection('employees').updateOne(
        { _id: new ObjectId(employeeId), companyId: companyId },
        { $set: { active: false, deactivatedAt: new Date() } }
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
    console.error('Employees error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: 'Server error' })
    };
  } finally {
    if (client) await client.close();
  }
};
