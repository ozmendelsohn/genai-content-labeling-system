# Progress: GenAI Content Detection Assistant

## Current Status (as of last update)

This document tracks the development progress of the GenAI Content Detection Assistant PoC.

### What Works / Implemented

*   **Project Setup:**
    *   Basic project structure with `backend` and `frontend` directories.
    *   `README.md` with project overview, setup instructions, and API endpoint documentation.
    *   `docker-compose.yml` updated for new backend structure, script and template volume mounts.
    *   Backend `Dockerfile` updated (implicitly, as `entrypoint.sh` was changed, and `PYTHONPATH` usage was confirmed).
*   **Backend (Restructured):**
    *   Core application modules (`main.py`, `models.py`, `database.py`, `schemas.py`) moved into `backend/src/`.
    *   Imports adjusted within these modules and in `scripts/init_db.py`.
    *   `backend/entrypoint.sh` updated for correct uvicorn execution path (`main:app` from `src`).
    *   Database initialization script (`scripts/init_db.py`) path and imports updated for Docker execution.
    *   FastAPI application structure within `backend/src/`.
    *   SQLite database (`content_detector.db`) path in `backend/src/database.py` configured for Docker volume mount (`/app/content_detector.db`).
    *   Jinja2 template path in `backend/src/main.py` configured for Docker volume mount (`/app/templates`).
    *   API endpoints (as defined in `backend/src/main.py`) for:
        *   Admin: User listing, URL upload form (GET), URL submission (POST).
        *   Labeler: Get task (GET), Submit label (POST).
*   **Frontend (Development In Progress - Previous Session Work):**
    *   `frontend/Dockerfile` created.
    *   Basic Next.js application structure, root layout, home page, Navbar.
    *   Admin URL Upload Feature (Page and Form Component with simulated API).
    *   Labeler Task Feature (Page, TaskView, and LabelingForm Components with simulated API).

### What's Left to Build / Next Steps

*   **Backend - Verification & Testing:**
    *   Thoroughly build and run the backend with `docker-compose up --build`.
    *   Execute `docker-compose exec backend python scripts/init_db.py`.
    *   Manually test all API endpoints (e.g., using Postman or curl) to ensure the restructuring didn't break functionality.
    *   Run existing backend unit tests (if any, need to adapt paths if test files import from `src`).
*   **Frontend - API Integration:**
    *   Replace all simulated API calls in frontend components with actual `fetch` calls to the backend FastAPI endpoints.
*   **Global Configuration File:**
    *   Implement the shared YAML/JSON configuration file (e.g., for AI/Human indicator checklists).
*   **Documentation:**
    *   Add/Update NumPy style docstrings for backend Python code in `backend/src/`.
    *   Add JSDoc/TSDoc comments to frontend components.
*   **Cleanup:**
    *   Delete `backend/requirements.txt` as Poetry is used.
*   **Testing (General):**
    *   Write frontend unit/integration tests.

## Known Issues (as of last update)

*   **Backend Untested Post-Restructure:** The backend restructuring is complete, but functionality (API endpoints, DB operations) has not been tested yet.
*   **Linter Warning in Frontend Dockerfile:** (From previous session) A persistent linter warning regarding `COPY` instruction in `frontend/Dockerfile`.
*   **API Calls Simulated (Frontend):** Frontend currently uses placeholders for API calls.
*   **Hardcoded Checklists (Frontend):** AI/Human indicator checklists in `LabelingForm.tsx` are hardcoded.
*   **User ID Handling (Labeler - Frontend):** Current labeler User ID input in `TaskView.tsx` is basic for PoC.

## Evolution of Project Decisions

*   **Backend File Structure:** Core Python modules moved to `backend/src/` for better organization and alignment with `pyproject.toml` for Poetry.
*   **Docker Configuration:** `docker-compose.yml` and `backend/Dockerfile` (via `entrypoint.sh`) adapted to support the new `src/` layout, including correct `PYTHONPATH`, script execution, and volume mounts for database and templates.
*   (Previous) Initial focus on scaffolding frontend UI elements with simulated API calls.
*   (Previous) Decision to use a dark theme with Tailwind CSS for the frontend. 