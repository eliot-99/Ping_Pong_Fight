#!/bin/bash
echo "Starting local server on http://localhost:8000"
echo ""
echo "Open your browser and go to: http://localhost:8000"
echo ""
cd "$(dirname "$0")"
python3 -m http.server 8000