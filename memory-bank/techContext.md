# Tech Context: GenAI Content Detection Assistant

## 1. Technologies Used

*   **Backend:**
    *   Programming Language: Python (version 3.9+ recommended)
    *   Framework: FastAPI
    *   Core Application Code Location: `backend/src/` (contains `main.py`, `models.py`, etc.)
    *   Database ORM: SQLAlchemy (primarily for schema definition and interaction via FastAPI helper libraries or custom CRUD operations)
    *   Data Validation: Pydantic (integrated with FastAPI)
    *   AI Integration: Google Gemini AI via `google-genai` package (v1.16.1)
    *   Testing: Pytest
    *   Dependency Management: Poetry (as per user instructions, though `requirements.txt` was mentioned in `README.md` for backend - will need to clarify or update project consistency)
*   **Frontend:**
    *   Programming Language: TypeScript
    *   Framework/Library: Next.js (React)
    *   Styling: Tailwind CSS
    *   Package Management: npm (implied by `package-lock.json`) or Yarn/pnpm if preferred by user later.
*   **Database:**
    *   SQLite (file-based)
*   **Containerization & Orchestration:**
    *   Docker
    *   Docker Compose
*   **Version Control:**
    *   Git

## 2. Development Setup

*   **Local Environment:** Developers are expected to have Docker and Docker Compose installed.
*   **Code Editor:** Any modern code editor (e.g., VS Code with relevant extensions for Python, TypeScript, Docker).
*   **Terminal/Shell:** Standard shell (bash, zsh, etc.) for running Docker commands, Git, etc.
*   **Getting Started:** 
    1. Clone repository.
    2. Ensure `docker-compose.yml` has correct volume mounts (e.g., `./scripts:/app/scripts`, `./frontend/templates:/app/templates` for backend).
    3. Run `docker-compose up --build` to build and start services.
    4. Database initialization via `docker-compose exec backend python scripts/init_db.py` (executes `/app/scripts/init_db.py` in container, which imports from `/app/src`).
*   **Backend Code Structure:** Main Python modules (`main.py`, `database.py`, `models.py`, `schemas.py`) are located in `backend/src/`. `PYTHONPATH` in Docker is set to include `/app/src` (`/app` being the `WORKDIR`).

## 3. Technical Constraints

*   **PoC Focus:** The system is a Proof of Concept, so solutions should prioritize simplicity and rapid development over premature optimization or enterprise-grade scalability features.
*   **SQLite Limitations:** SQLite is suitable for PoC but has limitations for concurrent writes and large datasets in a production environment.
*   **Stateless API:** Backend API should be designed to be stateless where possible, relying on client-side tokens or session info if needed (though PoC uses simple User ID query params for now).
*   **Dependency Management:** User has specified Poetry for Python backend dependencies. Frontend uses npm (based on `package-lock.json`).

## 4. Dependencies

*   **Backend (Key Dependencies - confirmed via pyproject.toml):**
    *   `fastapi`
    *   `uvicorn[standard]` (for serving)
    *   `sqlalchemy`
    *   `pydantic`
    *   `google-genai = "^1.16.1"` (for Gemini AI integration)
    *   `requests` (for web scraping in AI service)
    *   `beautifulsoup4` (for HTML parsing in AI service)
    *   `bcrypt` (for password hashing)
    *   `python-jose[cryptography]` (for JWT tokens)
    *   `python-multipart` (for form data handling)
    *   `jinja2` (for HTML template rendering)
    *   `pytest` (for testing)

*   **Frontend (Key Dependencies - from `package.json`):**
    *   `next`
    *   `react`, `react-dom`
    *   `typescript`
    *   `tailwindcss`
    *   `js-yaml` and `@types/js-yaml` (for configuration parsing)
    *   Associated `@types/*` packages for TypeScript.

## 5. Tool Usage Patterns

*   **Docker:** For creating reproducible environments and packaging the application.
*   **Docker Compose:** For defining and running multi-container Docker applications (backend, frontend, potentially database if not SQLite).
*   **Git:** For version control and collaboration.
*   **npm/yarn/pnpm:** For managing frontend dependencies and running scripts (build, dev server).
*   **Poetry (Backend):** For managing Python dependencies and packaging.
*   **Pytest (Backend):** For running unit and integration tests.
*   **API Interaction Tools (Development):** Postman, curl, or browser developer tools for testing API endpoints.
*   **Linters/Formatters:** (Assumed) Tools like ESLint/Prettier for frontend and Black/Flake8/Ruff for backend to maintain code quality (not explicitly configured yet by me).

## 6. Configuration Management

*   **Global Configuration:** User has requested a single global configuration file (YAML or JSON) for settings shared between backend and frontend.
    *   **Status:** Implemented with `config.yaml` at project root.
    *   **Content:** API base URLs, feature flags, UI text/labels, checklist definitions for AI/Human indicators, paths for templates if not fixed.

*   **Environment Variables:**
    *   `GEMINI_API_KEY`: For Google Gemini AI service authentication (optional - can also be stored in database per user).
    *   `NEXT_PUBLIC_API_BASE_URL`: Frontend API base URL configuration.

*   **API Key Management:**
    *   Three storage methods available:
        1. User-specific storage in database (via frontend UI)
        2. Environment variable `GEMINI_API_KEY` 
        3. Direct API endpoint submission with authentication

*   **Database Configuration:**
    *   **Current Issue:** SQLite database file doesn't persist between container restarts.
    *   Volume mount configured: `./content_detector.db:/app/content_detector.db`
    *   Database initialization required manually after each restart.

*   **Backend Docker Configuration:**
    *   `backend/Dockerfile`: Sets `WORKDIR /app`, `ENV PYTHONPATH="/app/src:${PYTHONPATH}"`. Copies `backend/` content to `/app/`.
    *   `backend/entrypoint.sh`: Activates poetry venv, runs `python -m uvicorn main:app --host 0.0.0.0 --port 8000`.
    *   `docker-compose.yml` (backend service):
        *   Mounts `./content_detector.db` to `/app/content_detector.db`.
        *   Mounts `./scripts` to `/app/scripts`.
        *   Mounts `./frontend/templates` to `/app/templates`.

*   **Environment Variables:** Potentially for database connection strings (currently hardcoded for SQLite but path is via volume mount), API keys for external services (future), or runtime behavior modifications. Docker Compose can inject environment variables. 