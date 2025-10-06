#!/bin/bash
# Keep-alive script for SolarPal backend on Render
# This script pings the backend every 10 minutes to prevent it from sleeping

SERVICE_URL="https://solarpal.onrender.com"
PING_INTERVAL=600  # 10 minutes in seconds

echo "🚀 Starting keep-alive service for $SERVICE_URL"
echo "⏰ Ping interval: $PING_INTERVAL seconds ($(($PING_INTERVAL / 60)) minutes)"

while true; do
    # Get current timestamp
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Ping the service
    echo "[$TIMESTAMP] 📡 Pinging $SERVICE_URL/keep-alive..."
    
    RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null "$SERVICE_URL/keep-alive" --max-time 30)
    
    if [ "$RESPONSE" = "200" ]; then
        echo "[$TIMESTAMP] ✅ Keep-alive successful (HTTP $RESPONSE)"
    else
        echo "[$TIMESTAMP] ❌ Keep-alive failed (HTTP $RESPONSE)"
    fi
    
    # Wait before next ping
    echo "[$TIMESTAMP] 💤 Sleeping for $PING_INTERVAL seconds..."
    sleep $PING_INTERVAL
done