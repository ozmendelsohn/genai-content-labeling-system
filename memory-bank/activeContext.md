# Active Context: GenAI Content Detection Assistant

This document tracks the current work focus, recent changes, next steps, and active decisions for the project.

## 1. Current Work Focus

*   **🎯 FRONTEND LOGIN IMPLEMENTATION & UI INTEGRATION 🎯**
*   API key integration and database persistence are now working correctly.
*   System operational with Gemini AI integration functional.
*   **Current Priority**: Implement proper login screen and API key management UI in frontend.
*   Frontend: http://localhost:3001 (Next.js) - External access
*   Backend: http://localhost:8000 (FastAPI) - External access

## 2. Recent Changes (as of this update)

*   **Database Persistence Issue RESOLVED (Latest):**
    *   Fixed critical volume mount mismatch between `content_detector.db` and `genai_labeling.db`.
    *   Updated docker-compose.yml to mount the correct database file (`./genai_labeling.db:/app/genai_labeling.db`).
    *   Database now properly persists between container restarts.
    *   Admin user and API keys now survive container restarts.

*   **API Key Integration FULLY WORKING (Latest):**
    *   Successfully tested API key storage via `/ai/api-key` endpoint with authentication.
    *   API key validation with real Gemini keys working correctly.
    *   API key persistence across container restarts confirmed.
    *   Three storage methods available and functional:
        1. Via authenticated API endpoint (tested and working)
        2. Environment variable `GEMINI_API_KEY` 
        3. Frontend UI (needs implementation)

*   **Authentication System WORKING:**
    *   Login endpoint `/auth/login` working correctly.
    *   JWT token generation and validation functional.
    *   Admin user (username: "admin", password: "admin123!") created and persisting.
    *   Token-based API access for protected endpoints working.

*   **Gemini AI Service Integration (Complete):**
    *   Updated `backend/src/ai_service.py` to use the new Google GenAI SDK (`google-genai` package v1.16.1).
    *   Migrated from old `google-generativeai` to new `google.genai` imports and API patterns.
    *   API key validation functionality working with real Gemini API keys.
    *   Content analysis capabilities ready for production use.

*   **Database Issues Identified:**
    *   Found recurring issue where `users` table doesn't exist after container restarts.
    *   Database initialization script (`scripts/init_db.py`) works but needs to be run manually after container startup.
    *   BCrypt version warnings present but not blocking functionality.
    *   Successfully initialized database with admin user (username: "admin", password: "admin123!").

*   **API Key Storage Options Clarified:**
    *   Users can store their Gemini API key in three ways:
        1. Through the frontend UI via `/admin/api-key` endpoint (recommended)
        2. As environment variable `GEMINI_API_KEY` in docker-compose.yml
        3. Directly via API endpoint using authentication token
    *   API key validation endpoint `/admin/validate-api-key` working correctly.

*   **Docker Network Communication Fix (Latest):**
    *   Added `NEXT_PUBLIC_API_BASE_URL=http://backend:8000` environment variable to frontend service in docker-compose.yml.
    *   Configured proper Docker service name communication for internal API calls.
    *   Verified that existing frontend code already uses `process.env.NEXT_PUBLIC_API_BASE_URL` correctly.
    *   No code changes were required - the environment variable approach was already implemented.
    *   System now uses Docker service names for internal communication while maintaining external accessibility.
    *   Deployment-ready configuration that can be easily adapted for different environments.

*   **Frontend Docker Fix (Latest):**
    *   Fixed the frontend Dockerfile to properly build and run the Next.js application in production mode.
    *   Updated the multi-stage build process to correctly install production dependencies and copy built assets.
    *   Added proper user management (non-root user) for security.
    *   Resolved port conflicts by changing frontend port mapping from 3000:3000 to 3001:3000.
    *   Cleaned up docker-compose.yml by removing irrelevant openmemory/mem0 services that were causing port conflicts.
    *   Both services now start successfully and are accessible.

*   **Docker Configuration Cleanup:**
    *   Removed mem0_store and openmemory-mcp services from docker-compose.yml as they were not relevant to our project.
    *   Simplified docker-compose.yml to only include backend and frontend services.
    *   Resolved port 6333 and 3000 conflicts that were preventing container startup.

*   **UI Fixes and Improvements (Complete):**
    *   Fixed configuration loading in `LabelingForm.tsx` to properly load indicators from global config with proper loading states
    *   Enhanced error handling and user feedback across all UI components with color-coded message displays
    *   Added retry mechanisms with exponential backoff for failed API calls in all form submissions
    *   Improved loading states with animated spinners and better visual feedback
    *   Fixed type safety issues and improved robustness of API response handling
    *   Added keyboard shortcuts (Enter key) for better user experience
    *   Implemented proper iframe error handling for website content loading
    *   Added visual indicators when config-loaded indicators are being used vs defaults

*   **Database Schema Update (Complete):**
    *   Successfully ran `docker-compose exec backend poetry run python scripts/init_db.py` to update the database schema with the new columns (`ai_indicators_str` and `human_indicators_str`).
    *   Discovered that the backend container requires using Poetry to run Python scripts (`poetry run python ...`) to ensure all dependencies are available.

*   **Frontend Component Updates (Complete):**
    *   Updated `frontend/src/components/labeler/LabelingForm.tsx` to use AI and Human indicators from the global configuration instead of hardcoded lists.
    *   Added proper TypeScript typing for the indicator items.

*   **Global Configuration System (Complete):**
    *   Created a shared `config.yaml` file at the project root with settings for both frontend and backend.
    *   Implemented `backend/src/config.py` with `get_config()` and `get_config_value()` functions to load and access configuration in Python.
    *   Implemented `frontend/src/lib/config.ts` with TypeScript interfaces and utility functions (`loadConfig()`, `getConfigValue()`, `getApiUrl()`) for the frontend.
    *   Added AI and Human indicators to the configuration.
    *   Installed `js-yaml` and `@types/js-yaml` packages for the frontend to parse YAML.

*   **Backend API Adaptation (Complete):**
    *   Modified `backend/src/main.py`'s `get_labeler_task` endpoint to return JSON data instead of HTML:
        *   Created a new `TaskResponse` Pydantic schema in `schemas.py` to define the response structure.
        *   Updated the endpoint to use `response_model=TaskResponse` for automatic validation and serialization.
        *   Changed the endpoint to return JSON with `website_id`, `website_url`, `user_id`, and `task_start_time` for tasks.
        *   For "no tasks available" scenarios, returns JSON with `message_title` and `message_body` instead of HTML.
    *   Modified `backend/src/main.py`'s `submit_label` endpoint to return JSON responses instead of HTML templates.
    *   Added support for storing AI and human indicators:
        *   Added `ai_indicators_str` and `human_indicators_str` columns to the `Label` model in `models.py`.
        *   Added corresponding fields to the Label schemas in `schemas.py`.
        *   Updated the `submit_label` endpoint to accept and store these values from form data.
    *   Added NumPy style docstrings to the updated endpoints.

*   **Frontend - API Integration (Complete):**
    *   Updated `frontend/src/components/admin/UrlUploadForm.tsx` to make real API calls to `${API_BASE_URL}/admin/upload_urls` endpoint:
        *   Set up `API_BASE_URL` using environment variable with fallback to `http://localhost:8000`.
        *   Implemented form data submission using `URLSearchParams` with appropriate Content-Type.
        *   Added loading states to improve UX during API calls.
        *   Added error handling for API responses.
    *   Updated `frontend/src/components/labeler/TaskView.tsx` to fetch task data from the backend API:
        *   Designed to call `${API_BASE_URL}/labeler/task?user_id=${currentLabelerId}`.
        *   Created more robust interfaces for API data (`TaskDataFromAPI`) and component state (`Task`).
        *   Implemented proper loading and error states.
        *   Now works with the updated JSON-returning backend endpoint.
        *   Added a `currentLabelerId` prop passed to `LabelingForm` component.
    *   Updated `frontend/src/components/labeler/LabelingForm.tsx` to submit to the backend API:
        *   Implemented integration with `${API_BASE_URL}/labeler/submit_label` endpoint.
        *   Updated form submission to use `URLSearchParams` for `application/x-www-form-urlencoded` format.
        *   Converted selected AI and Human indicators to comma-separated strings.
        *   Added proper error handling and loading states during submission.
        *   Used the `currentLabelerId` prop from `TaskView` for the user ID.
        *   Handles task start time correctly whether provided by API or tracked locally.

*   **Backend Restructuring (Previous Task):**
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

## 3. Next Steps

*   **Frontend Login Implementation (Immediate Priority):**
    *   Create proper login page/component for the frontend.
    *   Implement authentication state management in Next.js.
    *   Add login form with username/password fields.
    *   Handle JWT token storage and management (localStorage/sessionStorage).
    *   Implement protected routes and authentication guards.

*   **Frontend API Key Management UI:**
    *   Create API key management component for admin users.
    *   Integrate with `/ai/api-key` and `/ai/api-key/status` endpoints.
    *   Implement API key validation feedback in the UI.
    *   Add visual indicators for API key status.

*   **Complete Frontend-Backend Integration:**
    *   Update existing frontend components to use proper authentication.
    *   Test all existing workflows (admin upload, labeler tasks) with authentication.
    *   Implement proper error handling for authentication failures.

*   **Database Initialization Automation:**
    *   Investigate if database initialization can be automated on container startup.
    *   Consider adding database seeding to the Docker entrypoint.

*   **Verification and Testing (Current Focus):**
    *   Test the frontend-backend integration for Admin URL Upload and Labeler Task workflows.
    *   Verify that the AI and Human indicators are correctly saved to the database.
    *   Verify that configuration loading works properly and indicators are loaded from config vs defaults.
    *   Test retry mechanisms and error handling under various failure scenarios.

*   **Documentation:**
    *   Add JSDoc/TSDoc comments to frontend components.
    *   Continue adding NumPy style docstrings to backend Python code in `backend/src/`.

*   **Cleanup:**
    *   Delete `backend/requirements.txt` as Poetry is used.

## 4. Active Decisions and Considerations

*   **Frontend Authentication Approach:** Need to implement a standard Next.js authentication pattern with JWT tokens stored in localStorage/sessionStorage and protected route components.

*   **Database Persistence Solution:** Successfully resolved the volume mount issue by aligning the docker-compose database mount with the actual database file name used by the backend (`genai_labeling.db`).

*   **API Key Management:** The backend API endpoints are fully functional. Frontend UI needs to be created to provide user-friendly API key management.

*   **Login Flow Design:** Need to decide on the user experience for login - whether to have a dedicated login page or a modal, and how to handle authentication state across the application.

*   **Gemini AI Integration:** Successfully migrated to the new `google-genai` package (v1.16.1) which uses different import patterns and API structure compared to the older `google-generativeai` package.

*   **API Key Security:** Storing API keys in the user table with proper validation workflow. Users can update their keys through the UI.

*   **Database Initialization:** Need to ensure database tables are created automatically on container startup rather than requiring manual script execution.

*   **Error Handling:** Added comprehensive error handling for API key validation and Gemini AI service calls.

*   **Poetry Usage in Docker:** When running Python scripts in the backend Docker container, we need to use `poetry run python ...` to ensure all dependencies are available.

*   **Global Configuration Approach:** Created a single `config.yaml` file at the project root that can be accessed by both frontend and backend. The backend loads it directly from the filesystem, while the frontend fetches it via HTTP or falls back to default values.

*   **API Integration Approach:** We've successfully adapted the backend `/labeler/task` endpoint to return JSON instead of HTML, allowing the React frontend to maintain control of the UI rendering while still communicating with the backend API. This maintains the SPA (Single Page Application) pattern.

*   **Database Schema Evolution:** Added new columns (`ai_indicators_str` and `human_indicators_str`) to the `Label` model to store the selected indicators. The database schema has been updated by running the initialization script.

*   **API Base URL Configuration:** Using `process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'` as a short-term solution for configuring the API base URL in the frontend. Now also available in the global configuration.

*   **Form Data Submission Format:** For FastAPI's `Form` parameters, we're using `URLSearchParams` with `application/x-www-form-urlencoded` Content-Type instead of JSON. The format conversion happens in the frontend components.

*   **Backend `src/` Layout:** The decision to place core backend modules directly into `backend/src/` (rather than a sub-package like `backend/src/app_code/`) has been implemented.

*   **Docker Paths:** Paths for `PYTHONPATH`, `WORKDIR`, volume mounts, and uvicorn execution in Docker configurations have been aligned with the new `src/` layout.

*   **Template Serving by Backend:** While the backend still has the capability to serve HTML templates (for potential admin views or other pages), the labeler task workflow now uses JSON API responses for better integration with the React frontend.

## 5. Important Patterns and Preferences (from User Instructions)

*   **NumPy Style Docstrings (Python):** Required for all Python code.
*   **Global Configuration File (YAML/JSON):** For shared settings between backend and frontend.
*   **Backend: Python with FastAPI.**
*   **Frontend: Next.js with Tailwind CSS.**
*   **Dependency Management (Backend): Poetry via terminal.** (Note: `backend/requirements.txt` still exists, may need cleanup).
*   **Code Search:** Check codebase/online for existing solutions before creating new modules.
*   **Memory Bank Usage:** Must read all memory bank files at the start of every task and update them when significant changes occur or when requested.

## 6. Learnings and Project Insights

*   **Database Volume Mount Debugging:** The key to resolving persistence issues was identifying the mismatch between the file being volume mounted (`content_detector.db`) and the actual database file the application creates (`genai_labeling.db`). Always verify the actual file paths being used by the application.

*   **API Endpoint Testing:** Successfully tested the complete authentication and API key workflow using curl commands with JWT tokens. This confirmed that all backend functionality is working correctly before building the frontend UI.

*   **Container Database Persistence:** Once the correct database file is volume mounted, SQLite persistence works perfectly in Docker containers. The issue was configuration, not a fundamental problem with SQLite in containers.

*   **Authentication Token Workflow:** The backend properly implements JWT token generation and validation. Frontend needs to store tokens and include them in API requests using the `Authorization: Bearer <token>` header.

*   **Google GenAI Migration:** The new `google-genai` package requires different import patterns (`from google import genai` instead of `import google.generativeai as genai`) and uses `genai.Client(api_key=...)` instead of `genai.configure(api_key=...)`.

*   **Database Persistence in Docker:** SQLite database requires proper volume mounting and may need initialization scripts to run automatically on container startup.

*   **API Key Validation:** Real API key validation requires actual network calls to the Gemini service, making it different from simple format validation.

*   **Poetry in Docker Environment:** Confirmed that Poetry environment is properly set up in Docker container - all dependencies are available when running scripts with `poetry run python`.

*   **Container Debugging:** Using `docker-compose logs` and `docker-compose exec` commands effectively for debugging container issues and testing functionality.

*   **Global Configuration Management:** Implementing a shared configuration system between frontend and backend requires careful consideration of how each environment accesses the configuration. The backend can read directly from the filesystem, while the frontend needs to fetch the configuration via HTTP or use environment variables.

*   **API Evolution Strategy:** We've successfully evolved the API from returning HTML responses to returning JSON data, which is more appropriate for a modern SPA frontend. This demonstrates how backend APIs can be adapted to better support frontend needs without completely rewriting them.

*   **Schema-First Development:** Using Pydantic schemas (like our new `TaskResponse`) for API responses provides clear contracts between frontend and backend, improves type safety, and enables automatic validation and serialization.

*   **Form Submission Formats:** When working with FastAPI's `Form` parameters, the frontend must use `application/x-www-form-urlencoded` or `multipart/form-data` content types rather than JSON. This requires specific handling in the frontend code.

*   **Type Safety in API Integration:** Defining clear interfaces for API data (`TaskDataFromAPI`) and component state (`Task`) helps ensure type safety and reduces errors when working with data from the backend.

*   **Database Schema Evolution:** Adding new columns to existing models requires careful coordination between model definitions, schemas, and database migrations or initialization scripts.

*   **Restructuring Python Projects:** Restructuring Python project layouts (e.g., introducing a `src/` directory) requires careful updates to import paths, Docker configurations (`Dockerfile`, `entrypoint.sh`, `docker-compose.yml`), and any scripts that interact with the application modules.

*   **Loading and Error States:** Adding proper loading and error states in the frontend is crucial for good UX when integrating with backend APIs. 