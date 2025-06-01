# GenAI Content Detection Assistant - Proof of Concept

This project is a Proof of Concept (PoC) for a GenAI Content Detection Assistant. It aims to help content labelers identify AI-generated web content more efficiently.

## Core Features (PoC)

-   **Backend API:** Built with FastAPI (Python).
-   **Database:** SQLite for simplicity in PoC (`content_detector.db`).
-   **Admin Workflow:**
    -   Upload a list of website URLs for labeling.
-   **Labeler Workflow:**
    -   Request a website task (each website assigned to up to 3 different labelers).
    -   View the website in an iframe.
    -   See checklists of AI/Human content indicators.
    -   Submit labels ("GenAI" / "Not GenAI") and custom tags.
    -   Track time spent on labeling.
-   **Basic User Management:** Pre-defined admin and labeler users.
-   **Docker Support:** Containerized using Docker and Docker Compose for easy local setup.
-   **Unit Tests:** Basic tests for the backend API.

## Prerequisites

-   [Docker](https://www.docker.com/get-started)
-   [Docker Compose](https://docs.docker.com/compose/install/) (usually included with Docker Desktop)

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd <your-repo-directory>
    ```

2.  **Build and run the application using Docker Compose:**
    This command will build the Docker image (if not already built) and start the backend service.
    ```bash
    docker-compose up --build
    ```
    The application will be accessible at [http://localhost:8000](http://localhost:8000).

3.  **Initialize the Database (First Run):**
    If you are running the application for the first time, or if the `content_detector.db` file does not exist, you'll need to initialize the database and create the necessary tables and initial users.
    Open another terminal and run:
    ```bash
    docker-compose exec backend python scripts/init_db.py
    ```
    This script is idempotent, so it's safe to run multiple times. It will create tables if they don't exist and add default users if they aren't already in the database.

## Basic Usage

The API is the primary interface for this PoC. You can use a tool like Postman, curl, or your web browser (for GET requests) to interact with it.

### Endpoints:

-   **Root:**
    -   `GET /`: Returns a welcome message.
    -   Example: `curl http://localhost:8000/`

-   **Admin - User Management:**
    -   `GET /users?user_id=<user_id>`: Lists users. Requires an admin `user_id`.
        -   Default Admin User ID: `1`
        -   Example: `curl "http://localhost:8000/users?user_id=1"`

-   **Admin - URL Upload:**
    -   `GET /admin/upload`: Displays an HTML form to upload URLs.
        -   Access via browser: [http://localhost:8000/admin/upload](http://localhost:8000/admin/upload)
    -   `POST /admin/upload_urls`: Endpoint for the form to submit URLs to.
        -   Example (using curl, though browser form is easier):
            ```bash
            curl -X POST -F "urls_list=http://example.com/article1
http://example.org/blog2" http://localhost:8000/admin/upload_urls
            ```

-   **Labeler - Get Task:**
    -   `GET /labeler/task?user_id=<user_id>`: Assigns a website to the labeler for review.
        -   Default Labeler User IDs: `2`, `3`, `4`
        -   Access via browser: [http://localhost:8000/labeler/task?user_id=2](http://localhost:8000/labeler/task?user_id=2)
        -   This page will display the website in an iframe and the labeling form.

-   **Labeler - Submit Label:**
    -   `POST /labeler/submit_label`: Endpoint for the labeler form to submit the label, tags, etc.
        -   This is typically done via the form on the `/labeler/task` page.
        -   Example (raw data the form might send):
            ```bash
            #
            # This would be form-data, example structure:
            # website_id=1
            # user_id=2
            # label_value="GenAI"
            # tags_str="news, poorly written"
            # task_start_time="2023-10-27T10:00:00Z" (ISO Format)
            #
            # curl -X POST -F "website_id=1" -F "user_id=2" \
            # -F "label_value=GenAI" -F "tags_str=test, example" \
            # -F "task_start_time=2023-10-27T12:34:56.789Z" \
            # http://localhost:8000/labeler/submit_label
            ```

## Running Tests

To run the backend unit tests (requires the application to be NOT running via `docker-compose up` if ports conflict, or run in a separate environment):

1.  **Install backend dependencies (if not already done, e.g., in a virtual environment):**
    ```bash
    pip install -r backend/requirements.txt
    ```
2.  **Run pytest from the project root:**
    ```bash
    python -m pytest
    ```

## Project Structure

-   `backend/`: FastAPI application, database models, schemas, API logic.
-   `frontend/templates/`: HTML templates served by FastAPI.
-   `scripts/`: Utility scripts (e.g., `init_db.py`).
-   `tests/`: Backend unit tests.
-   `Dockerfile`: Defines the Docker image for the backend.
-   `docker-compose.yml`: Configures Docker Compose services.
-   `content_detector.db`: SQLite database file (created after initialization, persisted via Docker volume).

This PoC provides a basic framework. Future work could involve integrating actual AI detection models, developing a browser extension, and refining the UI/UX.
