# SolarPal Production Deployment Guide

## Environment Variables Setup

### Backend Configuration

1. **For Render Deployment**: Update the `ALLOWED_ORIGINS` environment variable in your Render dashboard to include your frontend domain:
   ```
   ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend-domain.vercel.app,https://your-frontend-domain.netlify.app
   ```

2. **Local Development**: Copy `backend/.env.example` to `backend/.env` and update the values.

### Frontend Configuration

1. **For Production**: Update `frontend/.env.local` with your deployed backend URL:
   ```
   NEXT_PUBLIC_API_BASE_URL=https://solarpal.onrender.com
   ```

2. **For Vercel/Netlify**: Add the environment variables in your deployment platform's settings:
   - `NEXT_PUBLIC_API_BASE_URL=https://solarpal.onrender.com`

## Deployment Steps

### Backend (Already Deployed)
Your backend is already deployed at: https://solarpal.onrender.com

To update CORS settings:
1. Go to your Render dashboard
2. Navigate to your solarpal-backend service
3. Go to Environment tab
4. Update `ALLOWED_ORIGINS` to include your frontend domain

### Frontend Deployment Options

#### Option 1: Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_API_BASE_URL=https://solarpal.onrender.com`
3. Deploy

#### Option 2: Netlify
1. Connect your GitHub repository to Netlify
2. Set environment variables in Netlify dashboard:
   - `NEXT_PUBLIC_API_BASE_URL=https://solarpal.onrender.com`
3. Deploy

#### Option 3: Build and Deploy Manually
```bash
cd frontend
npm run build
npm start
```

## Post-Deployment

1. Update the `ALLOWED_ORIGINS` in your Render backend to include your frontend domain
2. Test the API connection from your frontend
3. Verify CORS is working correctly

## Files Created/Updated

### Frontend:
- ✅ `frontend/.env.local` - Production environment variables
- ✅ `frontend/.env.example` - Environment template
- ✅ `frontend/.gitignore` - Git ignore file

### Backend:
- ✅ `backend/.env` - Production environment variables
- ✅ `backend/.env.example` - Updated environment template
- ✅ `backend/main.py` - Updated CORS configuration
- ✅ `backend/requirements.txt` - Added python-dotenv

### Deployment:
- ✅ `render.yaml` - Updated with environment variables
- ✅ `DEPLOYMENT.md` - This guide

## Environment Variables Reference

### Frontend (NEXT_PUBLIC_*)
- `NEXT_PUBLIC_API_BASE_URL` - Backend API URL
- `NEXT_PUBLIC_MAP_CENTER_LAT` - Map center latitude (optional)
- `NEXT_PUBLIC_MAP_CENTER_LNG` - Map center longitude (optional)
- `NEXT_PUBLIC_MAP_ZOOM_LEVEL` - Default zoom level (optional)
- Map bounds (optional): `NEXT_PUBLIC_MAP_MAX_LAT`, `NEXT_PUBLIC_MAP_MIN_LAT`, etc.

### Backend
- `ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins
- `API_HOST` - Server host (optional)
- `API_PORT` - Server port (optional)