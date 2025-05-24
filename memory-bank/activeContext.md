# Active Context: GenAI Content Detection Assistant

This document tracks the current work focus, recent changes, next steps, and active decisions for the project.

## 1. Current Work Focus

*   **🎯 SYSTEM FULLY OPERATIONAL - LABELING WORKFLOW WORKING 🎯**
*   Fixed critical labeling screen error that was preventing task assignments.
*   Authentication system and real API integration now fully functional.
*   Frontend and backend properly integrated with JWT authentication.
*   **Current Priority**: Continue testing and refining the complete user workflows.
*   Frontend: http://localhost:3001 (Next.js) - Working with authentication
*   Backend: http://localhost:8000 (FastAPI) - Fully functional

## 2. Recent Changes (as of this update)

*   **Critical Labeling Screen Bug Fix (Latest):**
    *   Fixed `currentLabelerId is not defined` JavaScript error that was preventing the labeling screen from loading.
    *   Root cause: When updating TaskView to use authenticated users, the `currentLabelerId` state variable was removed but the LabelingForm component call still referenced it.
    *   Solution: Updated `frontend/src/components/labeler/TaskView.tsx` to pass `task.userId` instead of undefined `currentLabelerId`.
    *   Labeling screen now loads correctly and allows labelers to work on tasks.

*   **Authentication System Working (Latest):**
    *   Complete authentication flow implemented and tested:
        - Login page with username/password form
        - JWT token storage in localStorage
        - AuthContext for global authentication state
        - ProtectedRoute component for role-based access control
        - Automatic token refresh and logout functionality
    *   Fixed import path issues that were causing "useAuth must be used within an AuthProvider" errors.
    *   Updated API calls throughout the application to include proper authentication headers.

*   **Task Assignment System Working (Latest):**
    *   Backend `/labeler/task` endpoint updated to use authenticated user instead of manual labeler ID input.
    *   Auto-assignment logic working: tasks are assigned to authenticated labelers when they request them.
    *   Task status properly updated from PENDING → IN_PROGRESS → COMPLETED.
    *   Labelers can successfully fetch, view, and submit labels for assigned tasks.

*   **Admin URL Upload System Working (Latest):**
    *   Admin upload interface fully functional with real API integration.
    *   Bulk URL upload with form data submission working correctly.
    *   Option to reset existing URLs to PENDING status implemented.
    *   Real-time feedback and error handling for upload operations.
    *   Statistics and upload history displaying real data from backend APIs.

*   **Dashboard Statistics Integration (Latest):**
    *   Replaced all placeholder statistics with real API calls to `/dashboard` endpoint.
    *   Created `DashboardStats` component that fetches actual user and system statistics.
    *   Implemented `UploadHistory` component for displaying real content upload history.
    *   Added proper loading states and error handling for dashboard data.
    *   Role-based statistics display (admin sees system stats, labelers see personal stats).

*   **Real API Integration Complete (Latest):**
    *   All frontend components now use real backend APIs instead of mock data.
    *   Removed hardcoded statistics, placeholder content, and simulated API calls.
    *   Proper error handling and loading states implemented across all components.
    *   Authentication headers properly included in all API requests.

*   **TypeScript Icon Component Fixes (Latest):**
    *   Fixed linter errors in admin upload page by adding proper TypeScript interfaces to icon components.
    *   Updated `CheckIcon` and `AlertIcon` components to accept optional `className` props.
    *   Improved type safety throughout the UI components.

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

*   **System Testing and Validation (Current Priority):**
    *   Test complete admin workflow: login → upload URLs → verify task creation
    *   Test complete labeler workflow: login → request task → view website → submit labels
    *   Verify AI integration workflow: API key management → content analysis
    *   Test edge cases and error scenarios across all user flows

*   **User Experience Improvements:**
    *   Enhance loading states and visual feedback throughout the application
    *   Improve error messages and user guidance
    *   Add more comprehensive dashboard analytics and reporting
    *   Implement bulk operations and advanced filtering capabilities

*   **AI Integration Enhancements:**
    *   Complete frontend UI for AI content analysis features
    *   Integrate AI-powered suggestions into the labeling workflow
    *   Add confidence scoring and AI indicator validation

*   **System Robustness:**
    *   Implement comprehensive logging and monitoring
    *   Add rate limiting and API protection
    *   Enhance database backup and recovery procedures
    *   Add more comprehensive error handling and user feedback

*   **Documentation and Testing:**
    *   Add comprehensive API documentation with examples
    *   Implement frontend component testing
    *   Create user guides for admin and labeler workflows
    *   Add system integration tests

*   **Performance Optimization:**
    *   Optimize frontend bundle size and loading performance
    *   Implement caching strategies for frequently accessed data
    *   Add pagination for large datasets
    *   Optimize database queries and indexing

## 4. Active Decisions and Considerations

*   **System Architecture Validation:** The current architecture with FastAPI backend and Next.js frontend is working well. The separation of concerns allows for independent development and testing of each layer.

*   **Authentication Implementation Success:** JWT-based authentication with localStorage storage is working effectively. The AuthContext pattern provides clean state management across the React application.

*   **Task Assignment Strategy:** The auto-assignment approach where labelers request tasks and the system assigns available work is functioning correctly. This eliminates the need for manual labeler ID input and streamlines the workflow.

*   **Real-time Data Integration:** Successfully replaced all placeholder data with real API calls. The system now provides accurate, up-to-date information for statistics, task status, and user progress.

*   **Database Persistence Solution:** SQLite with proper volume mounting is working reliably for the PoC. Database data persists correctly across container restarts.

*   **API Integration Patterns:** Using proper REST API patterns with form data for file uploads and JSON for data queries. Authentication headers are consistently applied across all API calls.

*   **Error Handling Strategy:** Implemented comprehensive error handling with user-friendly messages, loading states, and retry mechanisms where appropriate.

*   **Frontend State Management:** Using React hooks and Context API for state management is sufficient for the current application complexity. No need for additional state management libraries at this point.

## 5. Important Patterns and Preferences (from User Instructions)

*   **NumPy Style Docstrings (Python):** Required for all Python code.
*   **Global Configuration File (YAML/JSON):** For shared settings between backend and frontend.
*   **Backend: Python with FastAPI.**
*   **Frontend: Next.js with Tailwind CSS.**
*   **Dependency Management (Backend): Poetry via terminal.** (Note: `backend/requirements.txt` still exists, may need cleanup).
*   **Code Search:** Check codebase/online for existing solutions before creating new modules.
*   **Memory Bank Usage:** Must read all memory bank files at the start of every task and update them when significant changes occur or when requested.

## 6. Learnings and Project Insights

*   **JavaScript/React Error Debugging:** Fixed the `currentLabelerId is not defined` error by carefully tracing variable usage across component updates. When refactoring React components, it's critical to update all references to removed state variables. The error occurred because the variable was removed from one component but still referenced in a child component call.

*   **Authentication State Management:** Successfully implemented a complete authentication flow using React Context and localStorage. The AuthContext pattern provides clean separation of authentication logic and makes it easy to access user state throughout the application.

*   **Task Assignment Evolution:** The transition from manual labeler ID input to authenticated user-based assignment greatly improved the user experience. This eliminated the confusing step of asking users to manually enter their ID and streamlined the workflow.

*   **Real API Integration Benefits:** Replacing placeholder data with real API calls revealed several UX improvements needed, such as better loading states and error handling. Real data integration also helped identify edge cases that weren't apparent with mock data.

*   **TypeScript Error Prevention:** Adding proper TypeScript interfaces to React components (like icon components accepting className props) helps catch errors at compile time rather than runtime. This is especially important for reusable UI components.

*   **Full-Stack Error Tracing:** When debugging issues, it's important to trace the complete data flow from frontend component → API call → backend endpoint → database. The `currentLabelerId` error was traced from the browser console error back to the specific component prop passing.

*   **Authentication Headers Pattern:** Consistently including authentication headers in all API calls requires a systematic approach. Using a centralized token storage (AuthContext) makes it easier to ensure all requests are properly authenticated.

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