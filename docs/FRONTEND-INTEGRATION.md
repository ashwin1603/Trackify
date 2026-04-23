# Frontend Integration Guide - OWASP Alert System

## Overview

This guide shows how to integrate the security alert UI components into your frontend application.

## Frontend Components

### 1. SecurityAlertBadge Component

Location: `src/components/common/SecurityAlertBadge.jsx`

**Features:**

- Shows red badge with critical alert count
- Updates every 30 seconds
- Admin/Security Team only
- Linked to alert management page

**Usage:**

```jsx
// In Navbar or header component
import SecurityAlertBadge from "../components/common/SecurityAlertBadge";

function Navbar() {
  return (
    <nav className="navbar">
      {/* Other nav items */}
      <SecurityAlertBadge />
    </nav>
  );
}
```

### 2. SecurityAlertList Component

Location: `src/components/common/SecurityAlertList.jsx`

**Features:**

- Lists all alerts (Admin) or assigned alerts (Security Team)
- Filter by status: OPEN, ASSIGNED, RESOLVED
- Click alert to view details in modal
- Admin: Assign alerts to team members
- Security Team: Resolve alerts with notes
- Shows AI analysis, risk scores, recommendations

**Usage:**

```jsx
// Create a new page for alerts
import SecurityAlertList from "../components/common/SecurityAlertList";

function SecurityAlertsPage() {
  return (
    <div className="container mx-auto p-6">
      <SecurityAlertList />
    </div>
  );
}
```

## Integration Steps

### Step 1: Create Security Alerts Page

Create `frontend/src/pages/SecurityAlertsPage.jsx`:

```jsx
import React from "react";
import SecurityAlertList from "../components/common/SecurityAlertList";
import ProtectedRoute from "../components/ProtectedRoute";
import { useAuth } from "../hooks/useAuth";

export function SecurityAlertsPage() {
  const { user } = useAuth();

  // Only allow ADMIN and SECURITY_TEAM
  if (user?.role.name !== "ADMIN" && user?.role.name !== "SECURITY_TEAM") {
    return (
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="text-gray-600 mt-2">
          You don't have permission to view security alerts.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <SecurityAlertList />
      </div>
    </div>
  );
}

export default SecurityAlertsPage;
```

### Step 2: Update Routing

Add to `App.jsx` or your routing configuration:

```jsx
import SecurityAlertsPage from "./pages/SecurityAlertsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import SecurityTeamRoute from "./components/SecurityTeamRoute";

function App() {
  return (
    <Routes>
      {/* Existing routes */}

      {/* Security alerts (Admin + Security Team) */}
      <Route
        path="/security/alerts"
        element={
          <ProtectedRoute>
            <SecurityAlertsPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
```

### Step 3: Update Navbar

Integrate the alert badge into your navbar:

```jsx
import SecurityAlertBadge from "./SecurityAlertBadge";

function Navbar() {
  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Bug Tracker</h1>

        <div className="flex items-center gap-6">
          {/* Other nav items */}

          {/* Security Alert Badge - shows CRITICAL count */}
          <SecurityAlertBadge />

          {/* User menu */}
        </div>
      </div>
    </nav>
  );
}
```

### Step 4: Configure API Key Storage

The components use `localStorage.getItem("apiKey")` for the X-API-Key header.

**On login, store the API key:**

```jsx
// In your login service or auth context
async function login(email, password) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  // Store JWT token
  localStorage.setItem("token", data.token);

  // Store API key (should be fetched from backend during login)
  // For now, use development key
  localStorage.setItem("apiKey", "dev-api-key-secure-bug-tracker-2026");
}
```

**Better approach: Get API key from environment or backend:**

```jsx
// src/config.js
export const API_KEY =
  import.meta.env.VITE_API_KEY || "dev-api-key-secure-bug-tracker-2026";
```

Update `.env`:

```
VITE_API_KEY=dev-api-key-secure-bug-tracker-2026
```

### Step 5: Update Auth Context/Hook

Ensure X-API-Key header is included in all API calls:

```jsx
// In your useAuth hook or API service
const API_KEY =
  localStorage.getItem("apiKey") ||
  import.meta.env.VITE_API_KEY ||
  "dev-api-key-secure-bug-tracker-2026";

export async function apiCall(url, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY,
    ...options.headers,
  };

  // Add JWT if user is authenticated
  const token = localStorage.getItem("token");
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
```

## Component Features

### SecurityAlertBadge

- **Auto-refresh**: Updates every 30 seconds
- **Smart display**: Only shows if CRITICAL alerts exist
- **Role-based**: Only visible to ADMIN/SECURITY_TEAM
- **Click action**: Links to `/security/alerts` page

### SecurityAlertList

- **Dual mode**: Different UI for Admin vs Security Team
- **Filtering**: Filter by OPEN, ASSIGNED, RESOLVED status
- **Sorting**: Latest alerts first
- **Modals**: Click alert to see full details
- **Admin actions**: Assign alerts to team members
- **Team actions**: Resolve alerts with investigation notes
- **AI insights**: Shows risk score, explanation, recommendations

## Styling

Both components use **Tailwind CSS** classes. Ensure Tailwind is installed:

```bash
npm install tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Color Scheme

- **CRITICAL**: Red (`bg-red-100`, `text-red-800`)
- **HIGH**: Orange (`bg-orange-100`, `text-orange-800`)
- **MEDIUM**: Yellow (`bg-yellow-100`, `text-yellow-800`)
- **LOW**: Blue (`bg-blue-100`, `text-blue-800`)

## API Endpoints Used

### SecurityAlertBadge

- `GET /api/security/stats` - Get critical alert count

### SecurityAlertList

- **Admin:**
  - `GET /api/security/alerts` - List all alerts
  - `GET /api/users` - Get security team members
  - `POST /api/security/assign-alert` - Assign alert
- **Security Team:**
  - `GET /api/security/my-alerts` - Get assigned alerts
  - `PUT /api/security/resolve-alert` - Resolve alert

All endpoints require:

```json
{
  "Authorization": "Bearer {JWT_TOKEN}",
  "X-API-Key": "{API_KEY}"
}
```

## Error Handling

Components include:

- Network error handling
- Loading states
- User feedback (alerts/toasts)
- API response validation

## Accessibility

- Semantic HTML
- ARIA labels (can be added)
- Keyboard navigation support
- Color-blind friendly severity indicators

## Future Enhancements

1. **Real-time updates** using WebSockets
2. **Export alerts** as CSV/PDF
3. **Alert history** and trends
4. **Bulk actions** for multiple alerts
5. **Custom alert rules** configuration
6. **Email notifications** for critical alerts
7. **Department-based** alert routing
8. **Dashboard** with charts and metrics

## Testing

Manual test checklist:

- [ ] Badge appears for CRITICAL alerts only
- [ ] Badge count updates correctly
- [ ] Can click badge to navigate
- [ ] Alert list loads with filters
- [ ] Can select alert to open modal
- [ ] Admin can assign alerts
- [ ] Security team can resolve alerts
- [ ] No errors in browser console
- [ ] API key sent in all requests
- [ ] Authorization errors handled

## Troubleshooting

**Alert badge not showing:**

1. Check browser console for errors
2. Verify API key is in localStorage
3. Check /api/security/stats endpoint

**Can't assign alerts (Admin):**

1. Verify user has ADMIN role
2. Check security team members exist
3. Review browser network tab for API errors

**Can't resolve alerts (Team):**

1. Verify user has SECURITY_TEAM role
2. Check alert is ASSIGNED status
3. Verify JWT token is valid

**Styling issues:**

1. Ensure Tailwind CSS is installed
2. Check TailwindCSS config includes component files
3. Run build process: `npm run build`

## Support

For questions or issues:

1. Check browser console for JavaScript errors
2. Check browser Network tab for failed API calls
3. Review backend logs for API errors
4. Test endpoints manually with curl or Postman
