/**
 * Auth Utility
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'sitepunch-secret-key-change-in-production';

function generateToken(employee) {
  return jwt.sign(
    { 
      employeeId: employee._id.toString(),
      companyId: employee.companyId,
      role: employee.role 
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

function getTokenFromHeader(headers) {
  const auth = headers.authorization || headers.Authorization;
  if (auth && auth.startsWith('Bearer ')) {
    return auth.slice(7);
  }
  return null;
}

module.exports = { generateToken, verifyToken, getTokenFromHeader };
