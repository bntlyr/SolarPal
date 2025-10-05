# SolarPal Frontend - Next.js App Router + TypeScript + shadcn/ui

A modern, responsive web application for finding optimal solar panel locations in the Philippines using NASA POWER data.

## 🚀 Features

- **Modern UI**: Built with Next.js 15, TypeScript, and shadcn/ui components
- **Interactive Map**: Philippines-focused map with Leaflet.js integration
- **Real-time Data**: Connects to FastAPI backend for NASA POWER solar irradiance data
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Performance Optimized**: App Router, dynamic imports, and Philippines-bounded map tiles
- **Accessibility**: WCAG compliant with proper focus management and screen reader support

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Map**: Leaflet.js + react-leaflet
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Notifications**: Sonner (toast notifications)

## 📦 Project Structure

```
src/
├── app/                 # App Router pages and layouts
│   ├── globals.css     # Global styles and Tailwind configuration
│   ├── layout.tsx      # Root layout with metadata and providers
│   └── page.tsx        # Main application page
├── components/         # Reusable UI components
│   ├── ui/            # shadcn/ui base components
│   └── MapComponent.tsx # Interactive Philippines map
└── lib/               # Utility functions and API services
    ├── api.ts         # API service layer for backend communication
    ├── map-utils.ts   # Map utilities and Philippines configuration
    └── utils.ts       # General utility functions
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Running FastAPI backend on port 8000

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 🗺 Map Features

- **Philippines Focus**: Map is bounded to Philippines coordinates (4.5°-21.5°N, 116°-127°E)
- **Interactive Markers**: Click anywhere to analyze solar potential
- **Custom Styling**: Dark/light mode compatible with shadcn/ui theme
- **Performance Optimized**: Tile loading optimization and lazy loading
- **Mobile Responsive**: Touch-friendly controls and responsive layout

## 🎨 UI Components

All UI components are built with shadcn/ui for consistency:

- **Header**: Sticky navigation with logo and demo button
- **Sidebar**: Collapsible panel showing solar analysis results
- **Cards**: Display solar data with gradient score indicators
- **Alerts**: Error handling and status notifications
- **Loading States**: Skeleton components and spinners
- **Responsive**: Mobile-first design with proper breakpoints
