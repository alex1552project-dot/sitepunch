# SitePunch - Time Tracking App

A mobile time tracking app for construction workers with GPS verification, incident reporting, and policy acknowledgment.

## Project Structure

```
sitepunch-clean/
├── mobile/                    # React Native Expo app
│   ├── App.js                 # Main app entry
│   ├── app.json               # Expo config
│   ├── package.json           # Dependencies
│   └── src/
│       ├── screens/           # All app screens
│       ├── context/           # Auth context
│       └── services/          # API service
│
├── netlify/
│   └── functions/             # Backend API functions
│
├── shared/                    # Shared utilities
│   ├── db.js                  # MongoDB connection
│   └── auth.js                # JWT auth helpers
│
├── netlify.toml               # Netlify config
└── package.json               # Backend dependencies
```

## Setup Instructions

### 1. MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a new database called `sitepunch`
3. Create these collections:
   - `companies`
   - `employees`
   - `timeEntries`
   - `incidents`
   - `policies`
   - `acknowledgments`

4. Add a test company:
```javascript
// In MongoDB Compass or Atlas, insert into 'companies':
{
  "code": "demo",
  "name": "Demo Company",
  "createdAt": new Date()
}
```

5. Add a test employee (use the company's _id):
```javascript
// Insert into 'employees':
{
  "companyId": ObjectId("YOUR_COMPANY_ID"),
  "employeeId": "1",
  "pin": "1234",
  "firstName": "Alex",
  "lastName": "Test",
  "email": "alex@demo.com",
  "role": "employee",
  "active": true,
  "createdAt": new Date()
}
```

### 2. Netlify Setup

1. Create a new site on [Netlify](https://netlify.com)
2. Connect your GitHub repo
3. Set build settings:
   - Build command: `npm install`
   - Publish directory: `public`
   - Functions directory: `netlify/functions`

4. Add environment variables in Netlify dashboard:
   - `MONGODB_URI` = Your MongoDB connection string
   - `JWT_SECRET` = A random secret string (e.g., `sitepunch-secret-12345`)

5. Deploy!

### 3. Mobile App Setup

1. Navigate to the mobile folder:
```bash
cd mobile
```

2. Install dependencies:
```bash
npm install
```

3. Update the API URL in `src/services/api.js`:
```javascript
const API_BASE_URL = 'https://YOUR-SITE-NAME.netlify.app/api';
```

4. Start the app:
```bash
npx expo start --tunnel
```

5. Scan QR code with Expo Go app on your phone

### 4. Test Login

- Company Code: `demo`
- Employee ID: `1`
- PIN: `1234`

## Features

- ✅ Clock In/Out with GPS tracking
- ✅ Time history view
- ✅ Incident reporting with camera
- ✅ Policy acknowledgment
- ✅ Team messaging
- ✅ Time off requests
- ✅ Profile management

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/auth/login | POST | Employee login |
| /api/time/clock-in | POST | Clock in with GPS |
| /api/time/clock-out | POST | Clock out with GPS |
| /api/time/status | GET | Current clock status |
| /api/time/summary | GET | Pay period summary |
| /api/time/entries | GET | Time history |
| /api/incidents | POST/GET | Report/list incidents |
| /api/policies | GET | List policies |
| /api/policies/pending | GET | Pending acknowledgments |
