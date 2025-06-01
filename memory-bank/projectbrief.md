# Project Brief: GenAI Content Detection Assistant

This document outlines the core requirements and goals for the GenAI Content Detection Assistant project.

## 1. Project Goal

The primary goal of this project is to develop a Proof of Concept (PoC) for an assistant that helps human content labelers identify AI-generated web content more efficiently and accurately.

## 2. Core Requirements (PoC)

*   **Backend System:** A robust API to manage URLs, user tasks, and labeling submissions.
*   **Frontend Interface:** An intuitive user interface for administrators to upload URLs and for labelers to view websites, use checklists, and submit labels.
*   **Labeling Workflow:** 
    *   Admins can upload a list of website URLs.
    *   Labelers can request a website task (each website can be assigned to multiple labelers, e.g., up to 3).
    *   Labelers can view the assigned website within an iframe.
    *   Labelers are provided with checklists of common AI-generated content indicators and human-generated content indicators.
    *   Labelers can submit a primary label ("GenAI" / "Not GenAI").
    *   Labelers can add custom tags to their submissions.
    *   Time spent on each labeling task should be tracked.
*   **User Management:** Basic user roles (admin, labeler) with pre-defined users for the PoC.
*   **Deployment:** The application should be containerized using Docker and Docker Compose for easy local setup and deployment.
*   **Database:** SQLite will be used for simplicity in the PoC.

## 3. Scope

*   **In Scope (PoC):**
    *   Backend API development (FastAPI).
    *   Frontend UI development (Next.js, Tailwind CSS).
    *   Admin workflow for URL upload.
    *   Labeler workflow for task assignment, website viewing, checklist usage, and label submission.
    *   Basic database schema and initialization for URLs, tasks, labels, and users.
    *   Dockerization of backend and frontend.
    *   Basic unit tests for the backend API.
*   **Out of Scope (PoC):**
    *   Integration of actual AI detection models.
    *   Development of a browser extension.
    *   Advanced user management features (self-registration, password recovery, etc.).
    *   Complex reporting or analytics dashboards.
    *   Scalability for a large number of users or high-volume processing (beyond PoC needs).

## 4. Success Criteria (PoC)

*   Admins can successfully upload lists of URLs via the UI.
*   Labelers can request tasks, view websites, use checklists, and submit labels with tags and tracked time.
*   Submitted data is correctly stored in the database.
*   The application can be built and run locally using Docker Compose.
*   Basic backend API endpoints are functional and tested. 