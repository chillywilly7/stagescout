#!/bin/bash

# FastAPI Server Startup Script
# This script starts the FastAPI backend server on http://localhost:8000

cd "$(dirname "$0")"

echo "Starting FastAPI server..."
echo "API will be available at http://localhost:8000"
echo "API docs available at http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Install dependencies if needed
if ! command -v uvicorn &> /dev/null; then
    echo "Installing dependencies..."
    pip install -r requirements.txt
fi

# Run the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
