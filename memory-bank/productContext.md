# Product Context: GenAI Content Detection Assistant

## 1. Why This Project Exists

The proliferation of AI-generated content presents a challenge for maintaining transparency and authenticity on the web. Content labelers, moderators, and researchers need tools to help them efficiently distinguish between human-written and AI-generated text. This project aims to provide a foundational tool to support these users.

## 2. Problems It Solves

*   **Inefficiency in Manual Detection:** Manually scrutinizing content for signs of AI generation is time-consuming and prone to inconsistency.
*   **Lack of Standardized Tools:** Content labelers often lack dedicated tools and may rely on ad-hoc methods or general-purpose software.
*   **Subjectivity in Labeling:** Providing structured checklists and a consistent workflow can help reduce subjectivity in labeling decisions.
*   **Training and Data Collection:** The system can (in the future) serve as a platform for collecting labeled data, which is crucial for training more advanced AI detection models.

## 3. How It Should Work (User Experience Goals)

*   **Simplicity and Ease of Use:** The interface should be intuitive for both admin users uploading URLs and labelers performing tasks.
*   **Focused Workflow:** The labeler interface should minimize distractions, presenting the website content clearly alongside the necessary labeling tools (checklists, submission form).
*   **Clear Guidance:** Checklists for AI and human indicators should provide actionable guidance to labelers.
*   **Efficient Task Management:** Labelers should be able to quickly request new tasks and submit their findings.
*   **Transparency (for PoC):** While not a full audit system, the PoC should clearly track basic submission data (who labeled what, when, and the label itself).

## 4. User Experience Goals

*   **Admin Users:** 
    *   Effortlessly upload batches of URLs for labeling.
    *   Receive clear feedback on the upload process.
*   **Labeler Users:**
    *   Quickly obtain a new website to label.
    *   View the target website seamlessly within the application.
    *   Easily access and use checklists for AI/Human content indicators.
    *   Submit labels and custom tags with minimal friction.
    *   Be aware of the time spent on a task (implicitly or explicitly shown).
    *   Feel confident that their submissions are recorded accurately. 