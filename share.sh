#!/bin/bash

# Fort Knox Exchange - Share Script
# This script helps you get a shareable URL for testing

echo "🚀 Fort Knox Exchange - Getting Shareable URL"
echo "=============================================="
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok is not installed"
    echo ""
    echo "Install ngrok:"
    echo "  brew install ngrok"
    echo "  OR download from: https://ngrok.com/download"
    exit 1
fi

# Check if dev server is running
if ! lsof -i:9002 &> /dev/null; then
    echo "⚠️  Dev server not running on port 9002"
    echo ""
    echo "Start your dev server first:"
    echo "  npm run dev"
    echo ""
    exit 1
fi

# Check if ngrok is already running
if curl -s http://localhost:4040/api/tunnels &> /dev/null; then
    echo "✅ ngrok is already running!"
    echo ""
    PUBLIC_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*' | grep -o 'https://[^"]*' | head -1)
    
    if [ -n "$PUBLIC_URL" ]; then
        echo "📱 Your shareable URL:"
        echo "   $PUBLIC_URL"
        echo ""
        echo "🔗 Share this link with your friend!"
        echo ""
        echo "📊 View ngrok dashboard: http://localhost:4040"
    else
        echo "Could not find public URL. Check http://localhost:4040"
    fi
else
    echo "Starting ngrok tunnel..."
    echo ""
    echo "Run this command in a new terminal:"
    echo "  ngrok http 9002"
    echo ""
    echo "Then run this script again to get your URL!"
fi

echo ""
echo "=============================================="
