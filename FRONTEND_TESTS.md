# Frontend Enhancement Tests
# Urban Intelligence Platform - Login System Integration

## Test 1: Citizen Login Page (/login)
### Visual Verification
- [ ] Red icon logo (not orange)
- [ ] "Urban Intelligence" title in red
- [ ] "Early risk prediction for urban systems" subtitle
- [ ] Email and Password fields with gray background
- [ ] Red "Sign In" button
- [ ] Green clickable demo credentials box
- [ ] Info message at bottom with warning icon

### Functionality Tests
**Test 1.1: Manual Login**
```
1. Navigate to http://localhost:3000/login
2. Enter: citizen@example.com / citizen123
3. Click "Sign In"
Expected: Redirects to /citizen/dashboard
```

**Test 1.2: Demo Credentials Click**
```
1. Navigate to http://localhost:3000/login
2. Click the green "Citizen Account" box
Expected: Auto-login and redirect to /citizen/dashboard
```

**Test 1.3: Admin Rejection**
```
1. Navigate to http://localhost:3000/login
2. Enter: admin@city.gov / admin123
3. Click "Sign In"
Expected: Error message "Admin accounts must use the admin login page."
```

**Test 1.4: Invalid Credentials**
```
1. Navigate to http://localhost:3000/login
2. Enter: wrong@email.com / wrongpass
3. Click "Sign In"
Expected: Error message displayed
```

---

## Test 2: Admin Login Page (/admin/login)
### Visual Verification
- [ ] Dark background (gray-900 to gray-800)
- [ ] Orange shield icon
- [ ] "Admin Portal" title in white
- [ ] "Municipal Operations Dashboard" subtitle
- [ ] Lock icon next to "Administrator Access"
- [ ] Blue clickable demo credentials box
- [ ] Security warning in amber color

### Functionality Tests
**Test 2.1: Manual Admin Login**
```
1. Navigate to http://localhost:3000/admin/login
2. Enter: admin@city.gov / admin123
3. Click "Sign In as Admin"
Expected: Redirects to /municipal/dashboard
```

**Test 2.2: Demo Admin Click**
```
1. Navigate to http://localhost:3000/admin/login
2. Click the blue "Admin Account" box
Expected: Auto-login and redirect to /municipal/dashboard
```

**Test 2.3: Citizen Rejection**
```
1. Navigate to http://localhost:3000/admin/login
2. Enter: citizen@example.com / citizen123
3. Click "Sign In as Admin"
Expected: Error message "This login is for administrators only..."
```

---

## Test 3: Homepage (/)
### Visual Verification
- [ ] Orange icon at top
- [ ] "Urban Intelligence Platform" title
- [ ] "Access Portals" heading
- [ ] Two cards: "Citizen Portal" (orange border) and "Citizen Login" (gray border)
- [ ] Citizen Portal says "No login required"
- [ ] Citizen Login says "Optional"

### Functionality Tests
**Test 3.1: Citizen Portal Link**
```
1. Navigate to http://localhost:3000/
2. Click "Citizen Portal" card
Expected: Redirects to /citizen/dashboard (public access)
```

**Test 3.2: Citizen Login Link**
```
1. Navigate to http://localhost:3000/
2. Click "Citizen Login" card
Expected: Redirects to /login page
```

---

## Test 4: Backend Integration Verification
### API Endpoint Tests

**Test 4.1: Citizen Login API**
```bash
curl -X POST http://127.0.0.1:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"citizen@example.com","password":"citizen123"}'
```
Expected Response:
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```

**Test 4.2: Admin Login API**
```bash
curl -X POST http://127.0.0.1:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@city.gov","password":"admin123"}'
```
Expected Response:
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```

**Test 4.3: Get Current User (Citizen)**
```bash
# Use token from Test 4.1
curl http://127.0.0.1:8001/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_CITIZEN_TOKEN"
```
Expected Response:
```json
{
  "email": "citizen@example.com",
  "role": "citizen",
  ...
}
```

**Test 4.4: Get Current User (Admin)**
```bash
# Use token from Test 4.2
curl http://127.0.0.1:8001/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```
Expected Response:
```json
{
  "email": "admin@city.gov",
  "role": "admin",
  ...
}
```

---

## Test 5: Existing Component Integrity
### Verify No Breaking Changes

**Test 5.1: Municipal Dashboard**
```
1. Login as admin via /admin/login
2. Navigate to /municipal/dashboard
Expected: Dashboard loads with all existing components
- [ ] Metrics cards display
- [ ] Charts render
- [ ] WebSocket connection works
- [ ] No console errors
```

**Test 5.2: Municipal Alerts**
```
1. As admin, navigate to /municipal/alerts
Expected: 
- [ ] Alerts list loads
- [ ] Generate alerts button works
- [ ] ML badge displays
- [ ] No ID conflicts
```

**Test 5.3: Scenario Builder**
```
1. As admin, navigate to /municipal/scenario
Expected:
- [ ] All input fields work (zone, time, traffic, heavy vehicle)
- [ ] Simulation runs successfully
- [ ] Results display with new impact format
- [ ] No component ID errors
```

**Test 5.4: Citizen Dashboard**
```
1. Navigate to /citizen/dashboard (no login)
2. Or login as citizen and navigate
Expected:
- [ ] Public alerts display
- [ ] City metrics shown
- [ ] WebSocket updates work
- [ ] No authentication errors
```

---

## Test 6: Authentication Flow Integrity
### Session Management

**Test 6.1: Token Storage**
```
1. Login as citizen at /login
2. Open DevTools > Application > Local Storage
Expected: 
- [ ] Token stored with key 'auth_token'
- [ ] Token is valid JWT format
```

**Test 6.2: Protected Route Access**
```
1. Without login, navigate to /municipal/dashboard
Expected: Redirects to /unauthorized or /login
```

**Test 6.3: Logout Flow**
```
1. Login as citizen
2. Click logout (if available) or clear token
3. Try accessing protected routes
Expected: Access denied, redirected to login
```

**Test 6.4: Role-Based Access**
```
1. Login as citizen
2. Try accessing /municipal/scenario
Expected: Blocked or redirected (role check)
```

---

## Test 7: Cross-Browser Testing
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)

---

## Test 8: Responsive Design
**Test 8.1: Mobile View**
```
1. Open /login in mobile view (375px width)
Expected: Layout adjusts, buttons remain clickable
```

**Test 8.2: Tablet View**
```
1. Open /admin/login in tablet view (768px width)
Expected: Proper spacing, no overflow
```

---

## Quick Smoke Test Checklist
Run these in order to verify everything works:

1. ✅ Backend running: `http://127.0.0.1:8001/health`
2. ✅ Frontend running: `http://localhost:3000`
3. ✅ Homepage loads: `/`
4. ✅ Citizen login works: `/login` → click demo → dashboard loads
5. ✅ Admin login works: `/admin/login` → click demo → municipal dashboard loads
6. ✅ Public access works: `/citizen/dashboard` (no login)
7. ✅ Scenario simulation works: `/municipal/scenario` (as admin)
8. ✅ WebSocket updates work: Check dashboard for real-time alerts

---

## Expected API Responses (Reference)

### Login Response Structure:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### User Info Structure:
```json
{
  "id": "uuid-here",
  "email": "user@example.com",
  "full_name": "User Name",
  "role": "citizen" | "admin",
  "is_active": true,
  "created_at": "2026-01-18T..."
}
```

---

## Issue Reporting Template
If any test fails, report using this format:

```
Test ID: [e.g., Test 1.2]
Description: [What failed]
Steps to Reproduce:
1. 
2. 
3. 

Expected Result: [What should happen]
Actual Result: [What actually happened]
Error Message: [If any]
Screenshot: [If applicable]
```

---

## Success Criteria
All tests pass with:
- ✅ No console errors
- ✅ Correct redirects based on roles
- ✅ Demo credentials auto-login works
- ✅ Existing components still function
- ✅ Backend API responses match expected structure
- ✅ No component ID conflicts
