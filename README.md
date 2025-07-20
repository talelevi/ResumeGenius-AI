# AI Resume Designer


## Overview

The **AI Resume Designer** is an innovative web-based tool designed to streamline the process of creating professional, tailored resumes and cover letters. It leverages artificial intelligence to transform your raw resume text into a polished, job-specific PDF document, ensuring maximum impact for your job applications.

## Key Features

* **AI-Powered Job Details Extraction:** Automatically fetch and analyze job descriptions from provided URLs to extract key information like company name, job title, and detailed job requirements.
* **Intelligent Keyword Analysis:** Utilize AI to identify the most critical keywords and skills from a job description, helping you tailor your resume effectively.
* **Dynamic Resume Generation:** Convert your raw resume text (or uploaded PDF/TXT file) into a structured JSON format, which is then used to generate a professional, single-page PDF resume. The AI customizes content to align with the target job's requirements, emphasizing relevant experience and achievements.
* **Customizable PDF Templates:** Choose from various professional PDF templates (Blue, Green, Gray) to give your resume a distinct visual style.
* **AI-Drafted Cover Letters:** Generate a personalized cover letter in either Hebrew or English, automatically tailored to the job description and your resume content.
* **Progress Management:** Save and load your current application progress (job details, resume text) locally in your browser, and clear saved data when needed.
* **Token Usage Tracking:** Monitor the number of AI tokens consumed during your session for transparency.

## Technologies Used

* **HTML5:** For the basic structure of the web application.
* **CSS3 (Tailwind CSS):** For modern, responsive, and aesthetically pleasing styling.
* **JavaScript (ES6+):** For all dynamic functionalities, user interactions, and API calls.
* **jsPDF Library:** For generating the professional PDF resumes directly in the browser.
* **PDF.js Library:** For parsing and extracting text content from uploaded PDF files.
* **Google Gemini API:** The core AI engine for:
    * Extracting job details from web pages.
    * Analyzing job descriptions for keywords.
    * Structuring and tailoring resume content.
    * Generating personalized cover letters.

## How to Use

To run this application locally:

1.  **Clone or Download:** Get the project files (`index.html`, `style.css`, `script.js`) and place them in a single folder on your computer.
2.  **Open `index.html`:** Simply open the `index.html` file in your web browser.
3.  **Input Job Details:**
    * (Optional) Paste a job link into the "קישור למשרה" field and click "טען פרטים מהקישור (באמצעות AI)" to automatically populate company name, job title, and description.
    * Alternatively, manually enter the "שם חברה" (Company Name), "שם תפקיד" (Job Title), and "תיאור תפקיד" (Job Description).
4.  **Analyze Keywords (Optional):** Click "נתח תיאור משרה למילות מפתח" to see key terms identified by the AI.
5.  **Provide Resume:**
    * Paste your raw resume text into the "קורות חיים גולמיים" textarea.
    * Or, click "בחר קובץ" to upload your resume as a `.txt` or `.pdf` file.
6.  **Select PDF Template:** Choose your preferred visual template for the generated PDF resume.
7.  **Generate Resume:** Click "צור קורות חיים מותאמים" to generate and download your tailored PDF resume.
8.  **Generate Cover Letter:** Navigate to the "טיוטת מכתב מקדים" section, select your preferred language (Hebrew/English), and click "צור טיוטת מכתב מקדים" to get an AI-generated cover letter. You can then copy it to your clipboard.
9.  **Manage Progress:** Use the "שמור התקדמות", "טען התקדמות", and "נקה נתונים שמורים" buttons to save, load, or clear your session data in the browser.

## Future Enhancements

* **More PDF Templates:** Expand the library of professional resume templates.
* **User Authentication & Cloud Storage:** Implement user accounts and cloud storage (e.g., Firebase Firestore) to save and access resumes from any device.
* **Direct Editing of Generated Resume:** Allow users to make minor edits to the AI-generated resume content directly within the application before PDF generation.
* **Feedback Mechanism:** Gather user feedback on AI-generated content to further refine the models.
* **Multi-Page Resume Support:** While currently focused on single-page resumes, add an option for multi-page layouts for more extensive experience.
