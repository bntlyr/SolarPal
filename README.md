# SolarPal 🌞

A web application to help Filipinos find optimal solar panel locations using NASA POWER solar irradiance data.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (for frontend)
- Python 3.8+ (for backend)
- Git

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd NASA-SPACE-APPS
```

### 2. Backend Setup (FastAPI)
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
copy .env.example .env

# Run the backend server
uvicorn main:app --reload
```

The backend API will be available at `http://localhost:8000`

### 3. Frontend Setup (Next.js)
```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Copy environment file
copy .env.example .env.local

# Run the development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 🏗️ Project Structure

```
NASA-SPACE-APPS/
├── backend/                 # FastAPI backend
│   ├── main.py             # Main API application
│   ├── requirements.txt    # Python dependencies
│   └── .env.example       # Environment variables template
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── pages/         # Next.js pages
│   │   ├── components/    # React components
│   │   └── styles/        # CSS styles
│   ├── package.json       # Node.js dependencies
│   ├── tailwind.config.js # Tailwind CSS configuration
│   └── .env.example      # Environment variables template
└── README.md              # This file
```

## 🌟 Features

- **📍 Location Detection**: Use browser geolocation or search for specific coordinates
- **🛰️ NASA Data Integration**: Real-time solar irradiance data from NASA POWER API
- **📊 Solar Scoring**: Instant solar potential scores (0-100) with ratings
- **🗺️ Interactive Maps**: Visual location mapping with solar score indicators
- **🇵🇭 Philippines Optimized**: Tailored for Philippine climate and geography
- **📱 Responsive Design**: Works on desktop, tablet, and mobile devices

## 🔧 API Endpoints

### Backend (FastAPI)
- `GET /` - Health check
- `GET /api/solar?lat={lat}&lon={lon}` - Get solar data for coordinates

### Example Response
```json
{
  "location": "Metro Manila",
  "coordinates": {"latitude": 14.6042, "longitude": 121.0348},
  "avg_irradiance": 5.6,
  "solar_score": 88,
  "rating": "Excellent",
  "data_points": 30,
  "period": "20241004 to 20241103"
}
```

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Leaflet** - Interactive maps
- **Axios** - HTTP requests

### Backend
- **FastAPI** - Python web framework
- **HTTPX** - Async HTTP client
- **Uvicorn** - ASGI server

### External APIs
- **NASA POWER API** - Solar irradiance data

## 🌍 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variable: `NEXT_PUBLIC_API_URL=https://your-backend-url.com`
3. Deploy automatically from main branch

### Backend (Render)
1. Connect your GitHub repository to Render
2. Create a new web service
3. Set build command: `pip install -r backend/requirements.txt`
4. Set start command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`

## 🔧 Development

### Adding New Features
1. Backend changes: Edit `backend/main.py`
2. Frontend changes: Add components in `frontend/src/components/`
3. Styling: Use Tailwind CSS classes

### Environment Variables
- Copy `.env.example` files to `.env` (backend) and `.env.local` (frontend)
- Customize API URLs and configuration as needed

### Running Tests
```bash
# Backend tests (if implemented)
cd backend
python -m pytest

# Frontend tests (if implemented)
cd frontend
npm test
```

## 📊 Solar Scoring Algorithm

The solar score (0-100) is calculated based on:
- **Average daily irradiance** (kWh/m²/day)
- **Philippine climate conditions**
- **Typical solar panel efficiency**

### Rating Scale
- **90-100**: Excellent (≥5.5 kWh/m²/day)
- **70-89**: Good (4.5-5.4 kWh/m²/day)
- **50-69**: Fair (3.5-4.4 kWh/m²/day)
- **0-49**: Low (<3.5 kWh/m²/day)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **NASA POWER Project** for providing free solar irradiance data
- **OpenStreetMap** for map tiles
- **Philippines Department of Energy** for renewable energy guidelines

## 📞 Support

For questions or issues:
1. Check the [GitHub Issues](link-to-issues)
2. Create a new issue if needed
3. Contact the development team

---

**Built with ❤️ for the Philippines' renewable energy future** 🇵🇭