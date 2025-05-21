# Active Context: GenAI Content Detection Assistant

This document tracks the current work focus, recent changes, next steps, and active decisions for the project.

## 1. Current Work Focus

*   Updating Memory Bank to reflect backend file structure changes.
*   Ensuring Docker configurations and import paths are consistent with the new backend `src/` layout.

## 2. Recent Changes (as of this update)

*   **Backend Restructuring (Main Task):**
    *   Moved core Python modules (`main.py`, `models.py`, `database.py`, `schemas.py`) from `backend/` root into `backend/src/`.
    *   The `backend/src/app_code/` directory (and its residual contents) was removed as the modules are now directly in `backend/src/`.
    *   Adjusted Python import statements in the moved files to reflect their new sibling status within `backend/src/` (e.g., `from database import Base` in `models.py`).
    *   Updated `backend/entrypoint.sh` to correctly call `uvicorn main:app` (since `main.py` is now in `src/` which is on `PYTHONPATH`).
    *   Updated `docker-compose.yml`:
        *   Uncommented and corrected path for mounting the `./scripts` directory to `/app/scripts` in the backend container.
        *   Corrected path for mounting `./content_detector.db` to `/app/content_detector.db`.
        *   Added a volume mount for `./frontend/templates` to `/app/templates` in the backend container to allow FastAPI to serve HTML templates.
    *   Updated `backend/src/main.py` to use the correct absolute path (`/app/templates`) for `Jinja2Templates`.
    *   Updated `scripts/init_db.py` to use correct direct imports (`from database import ...`, `from models import ...`) based on `/app/src` being on `PYTHONPATH` within the Docker container.
*   **Memory Bank Initialization (Previous Session):**
    *   Created the `memory-bank/` directory and initial versions of core Memory Bank files.
*   **Frontend Development (UI Scaffolding - Previous Session):**
    *   Created `frontend/Dockerfile`.
    *   Established root layout, home page, Navbar.
    *   Developed Admin URL Upload page and form component (simulated submission).
    *   Developed Labeler Task View page and associated components (simulated submission).

## 3. Next Steps

*   **Verification:** Thoroughly test the backend with the new structure (`docker-compose up --build`, run `init_db.py`, test API endpoints).
*   **Frontend - API Integration:** Prioritize replacing all simulated API calls in the frontend components with actual `fetch` calls to the (now restructured) backend FastAPI endpoints.
*   **Global Configuration File:** Implement the shared YAML/JSON configuration file (e.g., for AI/Human indicator checklists).
*   **Documentation:**
    *   Add JSDoc/TSDoc comments to frontend components.
    *   Ensure backend Python code in `backend/src/` is documented using NumPy style docstrings.

## 4. Active Decisions and Considerations

*   **Backend `src/` Layout:** The decision to place core backend modules directly into `backend/src/` (rather than a sub-package like `backend/src/app_code/`) has been implemented.
*   **Docker Paths:** Paths for `PYTHONPATH`, `WORKDIR`, volume mounts, and uvicorn execution in Docker configurations have been aligned with the new `src/` layout.
*   **Template Serving by Backend:** Confirmed that the backend serves some HTML templates, requiring `frontend/templates` to be mounted into the backend container.

## 5. Important Patterns and Preferences (from User Instructions)

*   **NumPy Style Docstrings (Python):** Required for all Python code.
*   **Global Configuration File (YAML/JSON):** For shared settings between backend and frontend.
*   **Backend: Python with FastAPI.**
*   **Frontend: Next.js with Tailwind CSS.**
*   **Dependency Management (Backend): Poetry via terminal.** (Note: `backend/requirements.txt` still exists, may need cleanup).
*   **Code Search:** Check codebase/online for existing solutions before creating new modules.
*   **Memory Bank Usage:** Must read all memory bank files at the start of every task and update them when significant changes occur or when requested.

## 6. Learnings and Project Insights

*   Restructuring Python project layouts (e.g., introducing a `src/` directory) requires careful updates to import paths, Docker configurations (`Dockerfile`, `entrypoint.sh`, `docker-compose.yml`), and any scripts that interact with the application modules.
*   Clear communication (like the user clarifying the `app_code` vs `src` preference) is vital to avoid missteps. 