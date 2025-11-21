#!/bin/bash
echo "Waiting for ngrok to start..."
for i in {1..10}; do
    URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"https://[^"]*' | grep -o 'https://[^"]*' | head -1)
    if [ -n "$URL" ]; then
        echo ""
        echo "✅ SUCCESS! Your shareable link is ready:"
        echo ""
        echo "  🔗 $URL"
        echo ""
        echo "Share this link with your friend!"
        exit 0
    fi
    echo "Attempt $i/10..."
    sleep 1
done
echo "❌ Timeout waiting for ngrok. Please check if ngrok is running."
