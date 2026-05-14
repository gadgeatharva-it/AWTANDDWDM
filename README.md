# EventFlow

Full-stack Event Management & Analysis app.

## Stack
- Backend: Node.js, Express, MongoDB (Mongoose), JWT, bcrypt
- Frontend: React (CRA), Context API, Axios, Recharts

## Local setup

### Backend
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Render deployment (recommended split)

Deploy backend and frontend as two separate services.

### 1) Backend (Render Web Service)
- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Environment variables:
  - `NODE_ENV=production`
  - `MONGO_URI=<Atlas mongodb+srv connection string>`
  - `JWT_SECRET=<strong secret>`
  - `JWT_EXPIRES_IN=7d`
  - `CLIENT_URL=<your frontend URL>`

### 2) Frontend (Render Static Site)
- Root directory: `frontend`
- Build command: `npm install && npm run build`
- Publish directory: `build`
- Environment variables:
  - `REACT_APP_API_BASE_URL=https://<your-backend>.onrender.com/api`

Notes:
- For Atlas, ensure Network Access allows your Render service to connect.
- Never commit secrets: keep `.env` files local only.

## Netlify (frontend) + Render (backend)

If you host the frontend on Netlify and the backend on Render, you must point the React app at the Render API.

### Netlify site settings
- Build command: `npm install && npm run build`
- Publish directory: `frontend/build`
- Environment variables:
  - `REACT_APP_API_BASE_URL=https://<your-backend>.onrender.com` (no trailing slash)

The frontend will call `https://<your-backend>.onrender.com/api/...` automatically.

### Render backend env
- Set `CLIENT_URL` to your Netlify site URL (e.g. `https://<your-site>.netlify.app`) if you want strict CORS.
