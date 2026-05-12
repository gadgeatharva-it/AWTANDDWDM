<<<<<<< HEAD
# EventFlow

Full-stack Event Management & Analysis app.

## Stack
- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT, bcrypt
- **Frontend**: React, Context API, Axios, Recharts

## Folder Structure
```
eventflow/
├── backend/
│   ├── server.js              ← Express entry, security middleware
│   ├── .env.example
│   ├── package.json
│   ├── models/
│   │   ├── User.js            ← bcrypt pre-save hook, comparePassword()
│   │   ├── Event.js           ← organiser ref, indexed queries
│   │   └── Registration.js    ← attendee ref, eventId ref
│   ├── controllers/
│   │   ├── authController.js  ← register, login, getMe
│   │   ├── eventController.js ← CRUD + aggregation stats
│   │   └── registrationController.js ← register/cancel attendee
│   ├── routes/
│   │   ├── auth.js            ← POST /register, /login, GET /me
│   │   ├── events.js          ← GET/POST /events, PUT/DELETE /events/:id, GET /stats
│   │   └── registrations.js   ← POST /register, DELETE /cancel
│   └── middleware/
│       ├── auth.js            ← JWT protect middleware
│       └── validate.js        ← express-validator error handler
└── frontend/
    └── src/
        ├── context/
        │   ├── AuthContext.jsx      ← login/register/logout + localStorage
        │   ├── EventContext.jsx     ← all event state + actions
        │   ├── DarkModeContext.jsx  ← dark mode toggle, persisted
        │   └── ToastContext.jsx     ← success/error/info toasts
        ├── services/
        │   ├── api.js              ← Axios + token interceptor + 401 handler
        │   ├── authService.js
        │   └── eventService.js
        ├── components/
        │   ├── AppLayout.jsx        ← sidebar + navbar shell
        │   ├── Sidebar.jsx          ← nav links, user info, logout
        │   ├── Navbar.jsx           ← dark mode toggle, hamburger
        │   ├── EventCard.jsx        ← edit/delete, capacity badge, status
        │   ├── EventModal.jsx       ← create/edit form with validation
        │   ├── ProtectedRoute.jsx
        │   └── LoadingSpinner.jsx
        └── pages/
            ├── Login.jsx            ← with show/hide password
            ├── Register.jsx
            ├── Dashboard.jsx        ← stat cards + Pie + Bar + quote
            └── Events.jsx           ← filter/search/sort + full CRUD
```

## Setup

### Backend
```bash
cd backend
npm install
cp .env.example .env   # fill in MONGO_URI and JWT_SECRET
node server.js
```

### Frontend
```bash
cd frontend
npm install
npm start
```
=======
# AWTANDDWDM
>>>>>>> f249493c768a4d27f9e95ec1f4d65980869ab3bc
