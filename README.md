# GenAI Content Labeling System

A comprehensive system for labeling web content as AI-generated or human-created, featuring role-based access control, analytics dashboard, and AI-powered content analysis.

## Features

### Core Functionality
- **Role-Based Access Control:** Admin, Labeler, and Viewer roles with specific permissions
- **Content Analysis:** AI-powered content detection using Google's Gemini API
- **Analytics Dashboard:** Comprehensive statistics and visualizations
- **User Management:** Self-registration with role selection
- **Secure Authentication:** JWT-based authentication with session management

### Technical Features
- **Backend:** FastAPI with Python, SQLAlchemy ORM, SQLite database
- **Frontend:** Next.js with TypeScript, Tailwind CSS, modern React patterns
- **Security:** Frontend-only API key storage, secure password hashing
- **Docker Support:** Full containerization with Docker Compose
- **Environment Configuration:** Flexible environment variable support

## Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js 18+](https://nodejs.org/) (for local development)
- [Python 3.12+](https://www.python.org/) (for local development)
- [Poetry](https://python-poetry.org/) (for Python dependency management)

## Quick Start

### 1. Clone and Setup
```bash
git clone <your-repo-url>
cd genai-content-labeling-system
```

### 2. Environment Configuration
Copy the example environment files and configure them:

```bash
# Copy root-level environment file
cp .env.example .env

# Copy backend environment file
cp backend/.env.example backend/.env

# Copy frontend environment file  
cp frontend/.env.example frontend/.env
```

### 3. Configure Environment Variables

Edit the `.env` files with your specific configuration:

**Root `.env`:**
```bash
# Backend Configuration
DATABASE_URL=sqlite:///./data/genai_labeling.db
SECRET_KEY=your-secret-key-here-change-in-production-minimum-32-characters
ALLOWED_ORIGINS=http://localhost:3001,https://your-frontend-domain.onrender.com

# Frontend Configuration  
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# Production Settings
NODE_ENV=production
PYTHONPATH=/app/src
```

**Important:** Change the `SECRET_KEY` to a secure random string for production!

### 4. Start the Application
```bash
docker-compose up --build
```

The application will be available at:
- **Frontend:** http://localhost:3001
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs

### 5. Create Your First Account
1. Navigate to http://localhost:3001/signup
2. Create an admin account
3. Start using the system!

## Deployment

### Render Deployment

This application is configured for easy deployment on Render:

1. **Prepare Environment Variables:**
   - Copy `.env.example` to `.env` and configure all variables
   - Set `NEXT_PUBLIC_API_BASE_URL` to your backend URL
   - Set `ALLOWED_ORIGINS` to include your frontend domain
   - Generate a secure `SECRET_KEY`

2. **Backend Deployment:**
   - Deploy the `backend/` directory as a Web Service
   - Set environment variables from your `.env` file
   - The database will be automatically initialized on startup

3. **Frontend Deployment:**
   - Deploy the `frontend/` directory as a Static Site
   - Set `NEXT_PUBLIC_API_BASE_URL` to your backend URL
   - The build process will use environment variables

### Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | Database connection string | `sqlite:///./data/genai_labeling.db` | No |
| `SECRET_KEY` | JWT signing key | `dev-secret-key-change-in-production` | Yes (Production) |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | `http://localhost:3001,http://frontend:3001` | No |
| `NEXT_PUBLIC_API_BASE_URL` | Frontend API endpoint | `http://localhost:8000` | Yes |
| `NODE_ENV` | Environment mode | `production` | No |

## Development

### Local Development Setup

1. **Backend Development:**
```bash
cd backend
poetry install
poetry shell
cd src
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

2. **Frontend Development:**
```bash
cd frontend
npm install
npm run dev
```

### API Key Configuration

The system requires users to provide their own Google Gemini API keys:

1. Get an API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. In the application, go to Settings → API Key Manager
3. Enter your API key (stored securely in browser only)
4. Start analyzing content!

### Testing

**Backend Tests:**
```bash
cd backend
poetry run pytest
```

**Frontend Tests:**
```bash
cd frontend
npm test
```

## Architecture

### Backend (FastAPI)
- **Authentication:** JWT tokens with role-based access control
- **Database:** SQLAlchemy ORM with SQLite (easily configurable for PostgreSQL)
- **AI Integration:** Google Gemini API for content analysis
- **Security:** Password hashing, CORS protection, input validation

### Frontend (Next.js)
- **Framework:** Next.js 14 with TypeScript
- **Styling:** Tailwind CSS with custom components
- **State Management:** React Context for global state
- **Security:** Frontend-only API key storage, secure authentication

### Database Schema
- **Users:** Role-based user management
- **Content Items:** URLs and metadata for analysis
- **Labels:** User-generated labels and classifications
- **Analytics:** Comprehensive tracking and statistics

## API Documentation

Full API documentation is available at `/docs` when running the backend:
- **Local:** http://localhost:8000/docs
- **Production:** https://your-backend-domain.onrender.com/docs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
1. Check the [API documentation](http://localhost:8000/docs)
2. Review the environment configuration
3. Check Docker container logs: `docker-compose logs`
4. Open an issue on GitHub
