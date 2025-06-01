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

*   **Production-Ready Local Environment:** Docker and Docker Compose with optimized builds
*   **Code Editor:** Any modern code editor (e.g., VS Code with relevant extensions for Python, TypeScript, Docker)
*   **Terminal/Shell:** Standard shell (bash, zsh, etc.) for running Docker commands and Git
*   **Getting Started (Enhanced):** 
    1. Clone repository with all production configurations
    2. Run `docker-compose up --build` for optimized production builds
    3. Frontend available at http://localhost:3001 with modern UI
    4. Backend available at http://localhost:8000 with analytics endpoints
    5. Database persistence automatically configured
*   **Backend Code Structure:** Main Python modules in `backend/src/` with proper Docker PYTHONPATH configuration
*   **Frontend Structure:** Production-ready Next.js build with optimized assets and security hardening

## 3. Technical Constraints

*   **PoC Focus Enhanced:** System now exceeds PoC requirements with production-ready features
*   **SQLite Persistence:** Enhanced with proper volume mounting for reliable data persistence
*   **Analytics Performance:** Optimized SQL queries for real-time performance tracking
*   **Docker Production:** Multi-stage builds with security hardening and optimized image sizes
*   **Dependency Management:** Poetry for backend, npm for frontend with production optimization

## 4. Dependencies

*   **Backend (Enhanced Dependencies - confirmed via pyproject.toml):**
    *   `fastapi` - Core web framework
    *   `uvicorn[standard]` - Production ASGI server
    *   `sqlalchemy` - Database ORM with analytics queries
    *   `pydantic` - Data validation with analytics models
    *   `google-genai = "^1.16.1"` - Gemini AI integration
    *   `requests` - Web scraping for AI service
    *   `beautifulsoup4` - HTML parsing for content analysis
    *   `bcrypt` - Password hashing for authentication
    *   `python-jose[cryptography]` - JWT token management
    *   `python-multipart` - Form data handling
    *   `jinja2` - Template rendering (minimal usage)
    *   `pytest` - Testing framework

*   **Frontend (Production Dependencies - from `package.json`):**
    *   `next` - React framework with production optimization
    *   `react`, `react-dom` - UI library
    *   `typescript` - Type safety
    *   `tailwindcss` - Utility-first CSS framework
    *   `js-yaml` and `@types/js-yaml` - Configuration parsing
    *   Associated `@types/*` packages for TypeScript safety

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