# Tech Context: GenAI Content Detection Assistant

## 1. Technologies Used

*   **Backend:**
    *   Programming Language: Python (version 3.9+ recommended)
    *   Framework: FastAPI with enhanced analytics endpoints
    *   Core Application Code Location: `backend/src/` (contains `main.py`, `models.py`, etc.)
    *   Database ORM: SQLAlchemy with optimized queries for analytics
    *   Data Validation: Pydantic (integrated with FastAPI) with analytics response models
    *   AI Integration: Google Gemini AI via `google-genai` package (v1.16.1)
    *   Testing: Pytest
    *   Dependency Management: Poetry (production-ready configuration)
    *   Analytics: Custom SQL-based performance tracking and CSV export functionality
*   **Frontend:**
    *   Programming Language: TypeScript
    *   Framework/Library: Next.js (React) with production-ready builds
    *   Styling: Tailwind CSS with modern component patterns
    *   Package Management: npm with optimized production builds
    *   UI Components: Tag-based selection, collapsible sections, real-time search
    *   Analytics Dashboard: Real-time performance tracking and data visualization
*   **Database:**
    *   SQLite (file-based) with proper persistence across container restarts
    *   Enhanced with analytics queries and performance tracking
*   **Containerization & Orchestration:**
    *   Docker with production-grade multi-stage builds
    *   Docker Compose with optimized service communication
    *   Security hardening with non-root users
*   **Version Control:**
    *   Git with comprehensive project structure

## 2. Development Setup

*   **Production Cloud Environment:** Successfully deployed on Render.com with Docker containers
*   **Production URLs:**
    *   Frontend: https://genai-content-labeling-system-frontend.onrender.com
    *   Backend: https://genai-content-labeling-system.onrender.com
*   **Local Development Environment:** Docker and Docker Compose with optimized builds
*   **Code Editor:** Any modern code editor (e.g., VS Code with relevant extensions for Python, TypeScript, Docker)
*   **Terminal/Shell:** Standard shell (bash, zsh, etc.) for running Docker commands and Git
*   **Cloud Deployment Requirements:**
    1. Render.com account for hosting
    2. PostgreSQL database service on Render
    3. Environment variables configured for production
    4. Docker deployment with proper build context
*   **Getting Started (Enhanced):** 
    1. **Production**: Access live system at production URLs above
    2. **Local Development**: Clone repository → Run `docker-compose up --build` → Frontend at http://localhost:3001, Backend at http://localhost:8000
    3. **Database**: Automatic initialization in both environments
*   **Backend Code Structure:** Main Python modules in `backend/src/` with proper Docker PYTHONPATH configuration for both environments
*   **Frontend Structure:** Production-ready Next.js build with optimized assets and security hardening

## 3. Technical Constraints

*   **Production Environment Enhanced:** System deployed and operational in cloud infrastructure (Render.com)
*   **Database Flexibility:** PostgreSQL for production, SQLite for development with seamless switching
*   **CORS Configuration:** Proper cross-origin setup for production frontend-backend communication
*   **Analytics Performance:** Optimized SQL queries for real-time performance tracking in production
*   **Docker Production:** Multi-stage builds with security hardening and cloud deployment optimization
*   **Environment Management:** Separate configuration for development and production environments

## 4. Dependencies

*   **Backend (Enhanced Dependencies - confirmed via pyproject.toml):**
    *   `fastapi` - Core web framework (production-ready)
    *   `uvicorn[standard]` - Production ASGI server for cloud deployment
    *   `sqlalchemy` - Database ORM with PostgreSQL and SQLite support
    *   `pydantic` - Data validation with analytics models
    *   `google-genai = "^1.16.1"` - Gemini AI integration working in production
    *   `requests` - Web scraping for AI service
    *   `beautifulsoup4` - HTML parsing for content analysis
    *   `psycopg2-binary` - PostgreSQL adapter for production database (added for cloud deployment)
    *   `bcrypt` - Password hashing for authentication
    *   `python-jose[cryptography]` - JWT token management
    *   `python-multipart` - Form data handling
    *   `jinja2` - Template rendering (minimal usage)
    *   `pytest` - Testing framework

*   **Frontend (Production Dependencies - from `package.json`):**
    *   `next` - React framework with production optimization and cloud deployment
    *   `react`, `react-dom` - UI library optimized for production
    *   `typescript` - Type safety maintained in production builds
    *   `tailwindcss` - Utility-first CSS framework with production optimization
    *   `js-yaml` and `@types/js-yaml` - Configuration parsing
    *   Associated `@types/*` packages for TypeScript safety in production

*   **Production Infrastructure:**
    *   **Render.com**: Cloud hosting platform for both frontend and backend services
    *   **PostgreSQL**: Production database with automated backups and scaling
    *   **Docker**: Containerization for consistent deployment across environments
    *   **Environment Variables**: Secure configuration management for production secrets

## 5. Tool Usage Patterns

*   **Docker:** Production-grade multi-stage builds with security hardening and optimization
*   **Docker Compose:** Multi-service orchestration with proper networking and volume management
*   **Git:** Version control with comprehensive project history
*   **npm:** Frontend dependency management with production build optimization
*   **Poetry (Backend):** Python dependency management with lock file for reproducible builds
*   **Pytest (Backend):** Unit and integration testing framework
*   **API Testing Tools:** curl, Postman for endpoint validation
*   **Analytics Tools:** Built-in CSV export and dashboard analytics

## 6. Configuration Management

*   **Global Configuration (Enhanced):** 
    *   **Status:** Fully implemented with `config.yaml` at project root
    *   **Content:** API base URLs, feature flags, UI text/labels, checklist definitions, analytics settings
    *   **Backend Integration:** `backend/src/config.py` utility for configuration access
    *   **Frontend Integration:** `frontend/src/lib/config.ts` for TypeScript configuration

*   **Environment Variables (Production Ready):**
    *   `GEMINI_API_KEY`: Google Gemini AI service authentication
    *   `NEXT_PUBLIC_API_BASE_URL`: Frontend API base URL with Docker service communication
    *   Production environment variables properly configured in docker-compose.yml

*   **API Key Management (Enhanced):**
    *   Three storage methods all fully functional:
        1. Database storage via authenticated API endpoint (recommended)
        2. Environment variable `GEMINI_API_KEY` 
        3. Direct API endpoint submission with authentication
    *   Proper validation and persistence across container restarts

*   **Database Configuration (Production Ready):**
    *   **Status:** Fully resolved and production-ready
    *   SQLite database file properly persists between container restarts
    *   Volume mount correctly configured: `./genai_labeling.db:/app/genai_labeling.db`
    *   Database initialization automatic and reliable
    *   Analytics tables and relationships properly configured

*   **Docker Configuration (Production Grade):**
    *   **Frontend Dockerfile:** Multi-stage build with Node.js optimization, security hardening with non-root user
    *   **Backend Dockerfile:** Poetry integration with proper Python path configuration
    *   **docker-compose.yml:** 
        - Optimized service communication between frontend and backend
        - Proper port mapping (frontend:3001, backend:8000)
        - Secure volume mounting for database persistence
        - Environment variable management for production deployment
        - Network isolation and security considerations

*   **Analytics Configuration:**
    *   **Performance Tracking:** SQL-based analytics with configurable date ranges
    *   **Export Settings:** CSV export with comprehensive data formatting
    *   **Dashboard Configuration:** Real-time metrics with customizable refresh intervals
    *   **Data Retention:** Configurable data retention policies for analytics

## 7. Production Readiness Features

*   **Security Hardening:** Non-root Docker users, optimized image sizes, secure secret management
*   **Performance Optimization:** Multi-stage builds, optimized dependencies, efficient SQL queries
*   **Monitoring Ready:** Structured logging, comprehensive error handling, performance metrics
*   **Scalability Prepared:** Component architecture ready for horizontal scaling
*   **Deployment Ready:** Production Docker configuration, environment management, service orchestration 