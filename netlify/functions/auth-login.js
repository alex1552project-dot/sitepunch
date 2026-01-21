/**
 * Auth Login Endpoint
 * POST /api/auth/login
 */

const { connectToDatabase } = require('../../shared/db');
const { generateToken } = require('../../shared/auth');

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ success: false, error: 'Method not allowed' }) };
  }

  try {
    const { companyCode, employeeId, pin } = JSON.parse(event.body);

    if (!companyCode || !pin || !employeeId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Company code, employee ID, and PIN are required' }),
      };
    }

    const { db } = await connectToDatabase();

    // Find company
    const company = await db.collection('companies').findOne({ 
      code: companyCode.toLowerCase() 
    });

    if (!company) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, error: 'Invalid company code' }),
      };
    }

    // Find employee
    const employee = await db.collection('employees').findOne({
      companyId: company._id,
      employeeId: employeeId,
      pin: pin,
      active: true,
    });

    if (!employee) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, error: 'Invalid employee ID or PIN' }),
      };
    }

    // Generate token
    const token = generateToken(employee);

    // Update last login
    await db.collection('employees').updateOne(
      { _id: employee._id },
      { $set: { lastLogin: new Date() } }
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          token,
          employee: {
            _id: employee._id,
            firstName: employee.firstName,
            lastName: employee.lastName,
            employeeId: employee.employeeId,
            email: employee.email,
            phone: employee.phone,
            role: employee.role,
            department: employee.department,
          },
        },
      }),
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: 'Server error' }),
    };
  }
};
