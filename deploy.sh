#!/bin/bash
# Deploy script for Render

echo "🚀 Deploying SolarPal Backend to Render..."

# Make sure we're in the right directory
cd "$(dirname "$0")"

# Push to GitHub (triggers auto-deploy if enabled)
echo "📤 Pushing to GitHub..."
git add .
git commit -m "Deploy: Update backend for Render deployment"
git push origin master

echo "✅ Pushed to GitHub. Render will auto-deploy if configured."
echo "🌐 Check your Render dashboard for deployment status."
echo "📱 Your API will be available at: https://your-service-name.onrender.com"