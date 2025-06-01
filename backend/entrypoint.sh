#!/bin/sh
set -e

echo "🚀 Starting GenAI Content Labeling System Backend..."

# Set default environment variables if not provided
export PYTHONPATH="${PYTHONPATH:-/app/src}"
export HOST="${HOST:-0.0.0.0}"
export PORT="${PORT:-8000}"
export APP_MODULE="${APP_MODULE:-main:app}"

echo "🔧 Environment Configuration:"
echo "  - PYTHONPATH: $PYTHONPATH"
echo "  - HOST: $HOST"
echo "  - PORT: $PORT"
echo "  - APP_MODULE: $APP_MODULE"
echo "  - DATABASE_URL: ${DATABASE_URL:-Not set}"

# Ensure data directory exists
echo "📁 Ensuring data directory exists..."
mkdir -p /app/data

# Initialize database at startup
echo "💾 Initializing database..."
if python /app/scripts/init_db.py; then
    echo "✅ Database initialization completed successfully!"
else
    echo "❌ Database initialization failed!"
    exit 1
fi

# Start the application directly with Python (Poetry configured to use system Python)
echo "🌟 Starting FastAPI application..."
exec python -m uvicorn $APP_MODULE --host $HOST --port $PORT 