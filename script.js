// --- UI Elements ---
const messageDisplay = document.getElementById('messageDisplay');
const errorDisplay = document.getElementById('errorDisplay');
const pdfProcessingMessage = document.getElementById('pdfProcessingMessage');
const resultArea = document.getElementById('resultArea');
const downloadLink = document.getElementById('downloadLink');
const loadingIndicator = document.getElementById('loadingIndicator');

const companyNameInput = document.getElementById('companyName');
const jobTitleInput = document.getElementById('jobTitle');
const jobDescriptionTextarea = document.getElementById('jobDescription');
const resumeInput = document.getElementById('resumeInput');
const resumeFile = document.getElementById('resumeFile');
const generateCvBtn = document.getElementById('generateCvBtn');

const jobLinkInput = document.getElementById('jobLink');
const fetchJobDetailsBtn = document.getElementById('fetchJobDetailsBtn');
const loadingLinkDetails = document.getElementById('loadingLinkDetails');

// --- Elements for Keywords Feature ---
const analyzeKeywordsBtn = document.getElementById('analyzeKeywordsBtn');
const loadingKeywords = document.getElementById('loadingKeywords');
const keywordsResultArea = document.getElementById('keywordsResultArea');
const keywordsList = document.getElementById('keywordsList');

// --- Elements and Logic for LocalStorage ---
const saveProgressBtn = document.getElementById('saveProgressBtn');
const loadProgressBtn = document.getElementById('loadProgressBtn');
const clearProgressBtn = document.getElementById('clearProgressBtn');
const localStorageKey = 'aiResumeDesignerProgress';

// List of fields to save and load from local storage
const fieldsToSave = {
    jobLink: jobLinkInput,
    companyName: companyNameInput,
    jobTitle: jobTitleInput,
    jobDescription: jobDescriptionTextarea,
    resumeInput: resumeInput
};

// --- Elements and Logic for Cover Letter Feature ---
const generateCoverLetterBtn = document.getElementById('generateCoverLetterBtn');
const loadingCoverLetter = document.getElementById('loadingCoverLetter');
const coverLetterResultArea = document.getElementById('coverLetterResultArea');
const coverLetterText = document.getElementById('coverLetterText');
const copyCoverLetterBtn = document.getElementById('copyCoverLetterBtn');
let currentResumeDataForCoverLetter = null;

// --- Token Tracking ---
let totalTokensConsumed = 0;
const totalTokensDisplay = document.getElementById('totalTokens');

function updateTokenDisplay() {
    totalTokensDisplay.textContent = totalTokensConsumed.toLocaleString(); // Format with commas
}

// --- API Configuration ---
// Use the __api_key global variable provided by the Canvas environment
// הנתיב לפונקציית ה-proxy שלנו ב-Netlify
const geminiApiUrl = '/.netlify/functions/gemini-proxy';    

// --- PDF.js Worker Initialization ---
// Ensure pdf.min.js is loaded before pdf.worker.min.js
// pdfjsLib.GlobalWorkerOptions.workerSrc is set by pdf.worker.min.js itself.
if (window.pdfjsLib) {
    // All good, pdf.js is loaded.
} else {
    console.error("PDF.js library not loaded. Please check the CDN link.");
}

// --- Utility Functions ---
function showMessage(message, isError = false) {
    const displayElement = isError ? errorDisplay : messageDisplay;
    [messageDisplay, errorDisplay].forEach(el => el.classList.add('hidden'));
    displayElement.innerHTML = message;
    displayElement.classList.remove('hidden');
}

function sanitizeFilename(str) {
    return str.replace(/[^a-z0-9_\-.]/gi, '_').toLowerCase();
}

// Helper function for delay
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to clean text from strange characters (like those seen in the image)
function cleanTextForPdf(text) {
    if (!text) return '';
    // Remove non-printable characters or strange characters observed
    // Includes a wider range of special characters that might cause issues in jsPDF
    // Also handles HTML entities like &#39;
    return text
        .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec)) // Convert numeric entities
        .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16))) // Convert hexadecimal entities
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/[^\x20-\x7E\u0590-\u05FF\n\r\t]/g, '') // Keep only printable ASCII, Hebrew, spaces, and tabs
        .trim();
}


// --- File Input Handler ---
resumeFile.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    resumeInput.value = '';
    [messageDisplay, errorDisplay].forEach(el => el.classList.add('hidden'));
    pdfProcessingMessage.classList.remove('hidden');

    try {
        let text = '';
        if (file.type === 'application/pdf') {
            const pdfData = new Uint8Array(await file.arrayBuffer());
            const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                text += textContent.items.map(item => item.str).join(' ') + '\n';
            }
        } else {
            text = await file.text();
        }
        resumeInput.value = text.trim();
        showMessage('קובץ נטען בהצלחה.', false);
    } catch (err) {
        showMessage('שגיאה בעיבוד הקובץ: ' + err.message, true);
        console.error("File processing error:", err);
    } finally {
        pdfProcessingMessage.classList.add('hidden');
    }
});

// --- LocalStorage Logic ---
saveProgressBtn.addEventListener('click', () => {
    const dataToSave = {};
    for (const key in fieldsToSave) {
        dataToSave[key] = fieldsToSave[key].value;
    }
    try {
        localStorage.setItem(localStorageKey, JSON.stringify(dataToSave));
        showMessage('ההתקדמות נשמרה בהצלחה בדפדפן שלך!', false);
    } catch (e) {
        showMessage('שגיאה בשמירת ההתקדמות. ייתכן שהאחסון המקומי מלא או לא נתמך.', true);
        console.error("Error saving to localStorage:", e);
    }
});

loadProgressBtn.addEventListener('click', () => {
    try {
        const savedData = localStorage.getItem(localStorageKey);
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            for (const key in parsedData) {
                if (fieldsToSave[key]) {
                    fieldsToSave[key].value = parsedData[key];
                }
            }
            showMessage('ההתקדמות נטענה בהצלחה!', false);
        } else {
            showMessage('לא נמצאו נתונים שמורים.', false);
        }
    } catch (e) {
        showMessage('שגיאה בטעינת ההתקדמות מהאחסון המקומי.', true);
        console.error("Error loading from localStorage:", e);
    }
});

clearProgressBtn.addEventListener('click', () => {
    try {
        localStorage.removeItem(localStorageKey);
        for (const key in fieldsToSave) {
            fieldsToSave[key].value = '';
        }
        keywordsList.innerHTML = '';
        keywordsResultArea.classList.add('hidden');
        coverLetterText.value = '';
        coverLetterResultArea.classList.add('hidden');
        resultArea.classList.add('hidden');
        totalTokensConsumed = 0; // Reset tokens
        updateTokenDisplay(); // Update display

        showMessage('הנתונים השמורים וכל התוצאות נוקו בהצלחה.', false);
    } catch (e) {
        showMessage('שגיאה בניקוי הנתונים השמורים.', true);
        console.error("Error clearing localStorage:", e);
    }
});


// --- Event Listener for Fetching Job Details from Link (USING AI) ---
fetchJobDetailsBtn.addEventListener('click', async () => {
    const jobUrl = jobLinkInput.value.trim();
    if (!jobUrl) {
        showMessage('אנא הזן קישור למשרה.', true);
        return;
    }

    try {
        new URL(jobUrl);
    } catch (_) {
        showMessage('הקישור שהוזן אינו תקין.', true);
        return;
    }

    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(jobUrl)}`;

    loadingLinkDetails.classList.remove('hidden');
    [messageDisplay, errorDisplay].forEach(el => el.classList.add('hidden'));

    const maxRetries = 3;
    const retryDelayMs = 1000;
    let success = false;
    let lastError = null;

    for (let i = 0; i < maxRetries; i++) {
        showMessage(`טוען תוכן מהקישור... ניסיון ${i + 1} מתוך ${maxRetries}.`, false);
        try {
            const response = await fetch(proxyUrl, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
            if (!response.ok) {
                throw new Error(`שגיאה בגישה לקישור דרך פרוקסי: ${response.status} ${response.statusText}.`);
            }
            const htmlContent = await response.text();

            console.log("Raw HTML Content from Proxy:", htmlContent);

            showMessage('תוכן נטען. שולח ל-AI לניתוח...', false);

            const extractionPrompt = `
You are an expert web page analyzer. Your task is to extract specific job details from the provided HTML content of a job posting page.
Please analyze the following HTML and return ONLY a valid JSON object with the following structure:
{
    "companyName": "The name of the company posting the job. Be concise and accurate.",
    "jobTitle": "The precise title of the job position.",
    "jobDescription": "The full, core job description text. Extract only the main descriptive content of the role, avoiding any surrounding navigation, headers, footers, 'apply now' buttons, contact information, or generic company boilerplate. Crucially, remove ALL HTML tags (e.g., <p>, <div>, <li>, <ul>, <br>) and HTML entities (e.g., &amp;, &lt;, &gt;, &#39;). Clean the extracted text from excessive whitespace and any recruitment firm information. Focus purely on the responsibilities, requirements, and benefits of the job itself. If the job description is structured with sections (e.g., 'Responsibilities', 'Requirements'), retain that structure using plain text formatting (e.g., newlines, bullet points) if it helps readability, but only for the actual job details."
}

If you cannot confidently find a piece of information, return null or an empty string for that field.
Do not add any explanations or text before or after the JSON object.

HTML Content to analyze:
---
${htmlContent}
---
End of HTML Content. Now provide the JSON.
`;
            const aiPayload = {
                contents: [{ role: "user", parts: [{ text: extractionPrompt }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                }
            };

            const aiResponse = await fetch(geminiApiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(aiPayload)
            });

            if (!aiResponse.ok) {
                const errorBody = await aiResponse.text();
                throw new Error(`שגיאה בניתוח ה-HTML על ידי ה-AI: ${aiResponse.status}. ${errorBody}`);
            }

            const aiResult = await aiResponse.json();

            if (aiResult.usageMetadata) {
                totalTokensConsumed += aiResult.usageMetadata.promptTokenCount || 0;
                totalTokensConsumed += aiResult.usageMetadata.candidatesTokenCount || 0;
                updateTokenDisplay();
            }

            if (!aiResult.candidates?.[0]?.content?.parts?.[0]?.text) {
                console.error("AI Response for HTML extraction missing expected data structure:", JSON.stringify(aiResult, null, 2));
                throw new Error("מבנה תגובה לא תקין מה-AI בעת חילוץ פרטי משרה.");
            }

            let extractedDataText = aiResult.candidates[0].content.parts[0].text;
            let jobDetails;
            try {
                extractedDataText = extractedDataText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
                jobDetails = JSON.parse(extractedDataText);
                console.log("AI Extracted Job Details:", jobDetails);
            } catch (parseError) {
                console.error("JSON Parse Error for AI extracted job details:", parseError, "Raw Text:", extractedDataText);
                throw new Error("ה-AI החזיר מבנה נתונים לא תקין עבור פרטי המשרה. בדוק קונסול.");
            }

            if (jobDetails.jobTitle) jobTitleInput.value = jobDetails.jobTitle;
            if (jobDetails.companyName) companyNameInput.value = jobDetails.companyName;
            // Corrected: Ensure we use jobDetails.jobDescription as per the prompt's expected output
            if (jobDetails.jobDescription) jobDescriptionTextarea.value = jobDetails.jobDescription;

            console.log("Value of resumeInput after job details fetch:", resumeInput.value);

            if (jobDetails.jobTitle || jobDetails.companyName || jobDetails.jobDescription) {
                showMessage('פרטי משרה נטענו באמצעות AI. אנא בדוק את השדות ואמת את המידע.', false);
            } else {
                showMessage('ה-AI לא הצליח לחלץ פרטים מהקישור. ייתכן שתצטרך למלא ידנית.', true);
            }
            success = true;
            break;

        } catch (error) {
            lastError = error;
            console.error(`ניסיון ${i + 1} נכשל: ${error.message}`);
            if (i < maxRetries - 1) {
                // Only delay and continue loop, do not show an error message to the user yet.
                await delay(retryDelayMs);
            } else {
                // If it's the last attempt and it failed, then show the error.
                showMessage(`שגיאה בתהליך טעינת פרטי משרה לאחר ${maxRetries} ניסיונות: ${lastError ? lastError.message : 'שגיאה לא ידועה'}`, true);
            }
        }
    }
    loadingLinkDetails.classList.add('hidden');
});

// --- Keywords Analysis ---
analyzeKeywordsBtn.addEventListener('click', async () => {
    const jobDescription = jobDescriptionTextarea.value.trim();
    if (!jobDescription) {
        showMessage('אנא הזן או טען תיאור משרה תחילה.', true);
        return;
    }

    loadingKeywords.classList.remove('hidden');
    keywordsResultArea.classList.add('hidden');
    keywordsList.innerHTML = '';
    [messageDisplay, errorDisplay].forEach(el => el.classList.add('hidden'));
    showMessage('מנתח תיאור משרה למילות מפתח...', false);

    const keywordsPrompt = `
You are an expert in recruitment and job market analysis.
Analyze the following job description and extract the top 5-10 most important keywords or key skills.
Keywords should be concise and relevant for a job applicant to focus on.
Return the keywords as a simple JSON array of strings. For example: ["Keyword1", "Skill2", "Technology3"]
Do not add any explanations or text before or after the JSON array.

Job Description:
---
${jobDescription}
---
End of Job Description. Provide the JSON array of keywords.
`;

    try {
        const payload = {
            contents: [{ role: "user", parts: [{ text: keywordsPrompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
            }
        };

        const response = await fetch(geminiApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`שגיאה בזיהוי מילות מפתח מה-AI: ${response.status}. ${errorBody}`);
        }

        const result = await response.json();

        if (result.usageMetadata) {
            totalTokensConsumed += result.usageMetadata.promptTokenCount || 0;
            totalTokensConsumed += result.usageMetadata.candidatesTokenCount || 0;
            updateTokenDisplay();
        }

        if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
            console.error("AI Response for keywords missing expected data structure:", JSON.stringify(result, null, 2));
            throw new Error("מבנה תגובה לא תקין מה-AI בעת חילוץ מילות מפתח.");
        }

        let keywordsText = result.candidates[0].content.parts[0].text;
        let extractedKeywords;
        try {
            keywordsText = keywordsText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            extractedKeywords = JSON.parse(keywordsText);
        } catch (parseError) {
            console.error("JSON Parse Error for AI extracted keywords:", parseError, "Raw Text:", keywordsText);
            throw new Error("ה-AI החזיר מבנה נתונים לא תקין עבור מילות המפתח. בדוק קונסול.");
        }

        if (extractedKeywords && Array.isArray(extractedKeywords) && extractedKeywords.length > 0) {
            extractedKeywords.forEach(keyword => {
                const listItem = document.createElement('li');
                listItem.textContent = keyword;
                keywordsList.appendChild(listItem);
            });
            keywordsResultArea.classList.remove('hidden');
            showMessage('מילות מפתח זוהו בהצלחה.', false);
        } else {
            showMessage('ה-AI לא הצליח לזהות מילות מפתח ברורות מתיאור המשרה.', true);
        }

    } catch (error) {
        showMessage(`שגיאה בתהליך זיהוי מילות מפתח: ${error.message}`, true);
        console.error("Error identifying keywords:", error);
    } finally {
        loadingKeywords.classList.add('hidden');
    }
});


/**
 * The core function to generate a designed PDF from structured JSON data.
 */
function generatePdfFromResumeData(data, jobTitleForFileName, template = 'blue') {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'pt', 'a4');

    let PRIMARY_COLOR = '#005a9c';
    let TEXT_COLOR = '#333333';
    let LIGHT_TEXT_COLOR = '#555555';
    let MAIN_FONT = 'helvetica';

    if (template === 'green') {
        PRIMARY_COLOR = '#059669';
        TEXT_COLOR = '#2F4F4F';
        LIGHT_TEXT_COLOR = '#556B2F';
    } else if (template === 'gray') {
        PRIMARY_COLOR = '#4A5568';
        TEXT_COLOR = '#1A202C';
        LIGHT_TEXT_COLOR = '#718096';
    }

    const MARGIN = 50;
    const FONT_SIZES = { H1: 22, H2: 11, P: 10, TITLE: 14 };
    const LINE_HEIGHT = 1.3;

    const pageWidth = doc.internal.pageSize.getWidth();
    let y = MARGIN;

    const setDocFont = (style = 'normal', size = FONT_SIZES.P) => {
        doc.setFont(MAIN_FONT, style);
        doc.setFontSize(size);
    };

    const checkPageBreak = (currentY, neededSpace = 20) => {
        if (currentY + neededSpace > doc.internal.pageSize.getHeight() - MARGIN) {
            doc.addPage();
            return MARGIN;
        }
        return currentY;
    };

    const { name, title, email, phone, linkedin } = data.personalInfo || {};
    y = checkPageBreak(y, 80);

    setDocFont('bold', FONT_SIZES.H1);
    doc.setTextColor(TEXT_COLOR);
    doc.text(name || "שם לא צוין", MARGIN, y);
    y += FONT_SIZES.H1 * 1.0;

    setDocFont('normal', FONT_SIZES.TITLE);
    doc.setTextColor(PRIMARY_COLOR);
    doc.text(title || "תפקיד לא צוין", MARGIN, y);
    y += FONT_SIZES.TITLE * 1.0;

    setDocFont('normal', FONT_SIZES.P);
    doc.setTextColor(LIGHT_TEXT_COLOR);
    const contactInfo = [phone, email, linkedin].filter(Boolean).join('  |  ');
    if (contactInfo) {
        doc.text(contactInfo, MARGIN, y);
    }
    y += 40;

    const drawSectionHeader = (headerText) => {
        y = checkPageBreak(y, 30);
        setDocFont('bold', FONT_SIZES.H2);
        doc.setTextColor(PRIMARY_COLOR);
        doc.text(headerText.toUpperCase(), MARGIN, y);
        y += 5;
        doc.setDrawColor(PRIMARY_COLOR);
        doc.setLineWidth(1.5);
        doc.line(MARGIN, y, pageWidth - MARGIN, y);
        y += FONT_SIZES.H2 * LINE_HEIGHT * 1.5;
    };

    if (data.summary) {
        drawSectionHeader('Professional Profile');
        setDocFont('normal', FONT_SIZES.P);
        doc.setTextColor(TEXT_COLOR);
        const summaryLines = doc.splitTextToSize(data.summary, pageWidth - 2 * MARGIN);
        doc.text(summaryLines, MARGIN, y);
        y += summaryLines.length * FONT_SIZES.P * LINE_HEIGHT + 20;
    }

    if (data.experience && data.experience.length > 0) {
        drawSectionHeader('Experience');
        data.experience.forEach(job => {
            y = checkPageBreak(y, 60);
            setDocFont('bold', FONT_SIZES.P);
            doc.setTextColor(TEXT_COLOR);
            doc.text(job.title || "תפקיד", MARGIN, y);

            setDocFont('normal', FONT_SIZES.P);
            doc.setTextColor(LIGHT_TEXT_COLOR);
            // Display only dates, without company name
            const datesOnly = job.dates || "תאריכים";
            doc.text(datesOnly, pageWidth - MARGIN, y, { align: 'right' });
            y += FONT_SIZES.P * LINE_HEIGHT * 1.2;

            setDocFont('normal', FONT_SIZES.P);
            doc.setTextColor(TEXT_COLOR);
            if (job.responsibilities && Array.isArray(job.responsibilities)) {
                job.responsibilities.forEach(bullet => {
                    y = checkPageBreak(y);
                    const bulletLines = doc.splitTextToSize(bullet, pageWidth - 2 * MARGIN - 20);
                    doc.text('•', MARGIN + 5, y);
                    doc.text(bulletLines, MARGIN + 20, y);
                    y += bulletLines.length * FONT_SIZES.P * LINE_HEIGHT;
                });
            }
            y += 15;
        });
    }

     if (data.skills && data.skills.length > 0) {
        drawSectionHeader('Skills');
        y = checkPageBreak(y);
        doc.setTextColor(TEXT_COLOR);

        const skillsContent = [];
        data.skills.forEach(skillGroup => {
            if (skillGroup.category && skillGroup.tools && skillGroup.tools.length > 0) {
                skillsContent.push({ text: `${skillGroup.category}: `, bold: true });
                skillsContent.push({ text: skillGroup.tools.join(', ') + ". ", bold: false });
            }
        });

        let currentX = MARGIN;
        const availableWidth = pageWidth - 2 * MARGIN;

        skillsContent.forEach(item => {
            setDocFont(item.bold ? 'bold' : 'normal', FONT_SIZES.P);
            const textWidth = doc.getTextWidth(item.text);

            if (currentX !== MARGIN && currentX + textWidth > pageWidth - MARGIN) {
                y += FONT_SIZES.P * LINE_HEIGHT;
                y = checkPageBreak(y);
                currentX = MARGIN;
            }

            const splitText = doc.splitTextToSize(item.text, availableWidth - (currentX - MARGIN));
            splitText.forEach((line, index) => {
                if (index > 0) {
                     y += FONT_SIZES.P * LINE_HEIGHT;
                     y = checkPageBreak(y);
                     currentX = MARGIN;
                }
                doc.text(line, currentX, y);
            });
            currentX += textWidth;
        });
        y += FONT_SIZES.P * LINE_HEIGHT + 20;
    }

    if (data.education && data.education.length > 0) {
        drawSectionHeader('Education');
        data.education.forEach(edu => {
            y = checkPageBreak(y, 40);
            setDocFont('bold', FONT_SIZES.P);
            doc.setTextColor(TEXT_COLOR);

            const degreeInstitutionText = cleanTextForPdf(`${edu.degree || "Degree"} from ${edu.institution || "Institution"}`);
            const datesText = cleanTextForPdf(edu.dates || ""); // Make sure dates are extracted and cleaned

            // Calculate available width for degree/institution text to avoid overlap with dates
            const datesWidth = doc.getTextWidth(datesText);
            const maxDegreeWidth = pageWidth - 2 * MARGIN - datesWidth - 30; // 30pt buffer
            const degreeLines = doc.splitTextToSize(degreeInstitutionText, maxDegreeWidth);

            doc.text(degreeLines, MARGIN, y);

            setDocFont('normal', FONT_SIZES.P);
            doc.setTextColor(LIGHT_TEXT_COLOR);
            // Calculate X position for right alignment, ensuring it doesn't overlap left text
            const datesX = pageWidth - MARGIN - datesWidth;
            if (datesText) { // Only draw dates if they exist
                doc.text(datesText, datesX, y);
            }

            // Adjust Y based on the number of lines the degree/institution text took
            y += degreeLines.length * FONT_SIZES.P * LINE_HEIGHT * 1.2;
            y = checkPageBreak(y, 10);
        });
        y += 10;
    }

    if (data.projects && data.projects.length > 0) {
        drawSectionHeader('Projects');
        data.projects.forEach(project => {
            y = checkPageBreak(y, 60);
            setDocFont('bold', FONT_SIZES.P);
            doc.setTextColor(TEXT_COLOR);
            doc.text(project.name || "שם פרויקט", MARGIN, y);

            setDocFont('normal', FONT_SIZES.P);
            doc.setTextColor(LIGHT_TEXT_COLOR);
            doc.text(project.dates || "תאריכים", pageWidth - MARGIN, y, { align: 'right' });
            y += FONT_SIZES.P * LINE_HEIGHT * 1.2;

            setDocFont('normal', FONT_SIZES.P);
            doc.setTextColor(TEXT_COLOR);
            if (project.description && Array.isArray(project.description)) {
                project.description.forEach(bullet => {
                    y = checkPageBreak(y);
                    const bulletLines = doc.splitTextToSize(bullet, pageWidth - 2 * MARGIN - 20);
                    doc.text('•', MARGIN + 5, y);
                    doc.text(bulletLines, MARGIN + 20, y);
                    y += bulletLines.length * FONT_SIZES.P * LINE_HEIGHT;
                });
            }
            y += 15;
        });
    }

    // Generate filename: FirstName_LastName_JobTitle.pdf
    const candidateName = data.personalInfo && data.personalInfo.name ? data.personalInfo.name.replace(/\s+/g, '_') : 'Candidate';
    const sanitizedJobTitle = jobTitleForFileName ? sanitizeFilename(jobTitleForFileName) : 'Resume';
    const outputFileName = `${candidateName}_${sanitizedJobTitle}.pdf`;

    return { blob: doc.output('blob'), filename: outputFileName };
}


// --- Main CV Generation Logic ---
generateCvBtn.addEventListener('click', async () => {
    const companyName = companyNameInput.value.trim();
    const jobTitle = jobTitleInput.value.trim();
    const jobDescription = jobDescriptionTextarea.value.trim();
    const resumeText = resumeInput.value.trim();
    const selectedTemplate = document.querySelector('input[name="pdfTemplate"]:checked').value;

    if (!resumeText) {
        showMessage('אנא הדבק את קורות החיים שלך או העלה קובץ.', true);
        return;
    }

    loadingIndicator.classList.remove('hidden');
    resultArea.classList.add('hidden');
    [messageDisplay, errorDisplay].forEach(el => el.classList.add('hidden'));
    showMessage('מנתח קורות חיים ויוצר עיצוב...', false);

    const prompt = `
You are an expert resume analyzer and designer. Your task is to take raw resume text and relevant job details, and convert them into a structured JSON object suitable for generating a professional PDF resume.
The output MUST be a valid JSON object. Do not include any other text or explanations.

**CRITICAL CONSTRAINT: THE ENTIRE GENERATED RESUME (ALL SECTIONS COMBINED) MUST FIT ON A SINGLE PAGE (A4 size).**
If the content exceeds one page, you must prioritize, summarize, and condense information to ensure it fits, without losing critical relevance. Be ruthless in prioritizing and condensing to meet this single-page limit. Focus on impact and conciseness.

For the 'personalInfo.title' field:
- **PRIORITIZE** using the exact 'Job Title' provided in the job details (from the link or manual input) for the candidate's professional title.
- Ensure the chosen title is professional, clear, and does not contain arbitrary numbers or unclear suffixes (e.g., "Data Analyst 2" should be "Data Analyst" or "Senior Data Analyst" if applicable).
- Use it as long as it is reasonably aligned with the candidate's overall experience described in the 'Raw Resume Text'.
- If the provided 'Job Title' is not a good fit (e.g., completely unrelated to the resume content), or if no 'Job Title' is provided, then infer the best professional title from the 'Raw Resume Text'.

For the 'summary' section:
- Generate a professional summary that is concise, impactful, and sounds natural and authentic (not AI-generated).
- Tailor it to the specific 'Job Title' and 'Job Description' provided, highlighting the candidate's most relevant skills and achievements that align with the target role.
- **IMPORTANT: DO NOT MENTION THE COMPANY NAME (e.g., "${companyName}") IN THE SUMMARY OR ANY OTHER SECTION OF THE RESUME. The resume should be tailored to the job, but not explicitly name the company to avoid a "generated" feel.**
- Avoid generic phrases that make it sound artificial.

For the 'experience' section, pay special attention to the 'responsibilities' array. Each bullet point should be:
- **Highly detailed and descriptive**, providing more depth than a typical resume bullet. Strive to expand each bullet point to provide comprehensive detail, aiming to fill the available space on the page while maintaining conciseness and impact. Each bullet should be a mini-narrative of achievement.
- **Explicitly tailored to the provided Job Description**, highlighting how the candidate's experience directly aligns with the job requirements, technologies, and responsibilities mentioned in the job posting.
- **Actively 'round corners'** by subtly aligning the candidate's existing experience with the job description's language and requirements, even if the direct terminology isn't present in the raw resume. This means rephrasing and emphasizing aspects of the candidate's background that are most relevant to the target role, without fabricating information.
- **Quantifiable where possible** (e.g., "Increased sales by 20%", "Managed a team of 5", "Reduced processing time by 15%").
- **Focus on accomplishments and impact** (what was achieved and its benefit) rather than just duties (what was done).

Example JSON structure:
{
  "personalInfo": {
    "name": "Your Full Name",
    "title": "Your Professional Title (e.g., Software Engineer, Marketing Manager)",
    "email": "your.email@example.com",
    "phone": "+1234567890",
    "linkedin": "linkedin.com/in/yourprofile"
  },
  "summary": "A concise professional summary or objective, tailored to the job description if possible. Focus on key achievements and skills.",
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "dates": "Start Date - End Date (e.g., Jan 2020 - Dec 2022 or Jan 2023 - Present)",
      "responsibilities": [
        "Key responsibility/achievement 1, quantify results where possible (e.g., Increased sales by 20%)",
        "Key responsibility/achievement 2",
        "Key responsibility/achievement 3"
      ]
    }
  ],
  "education": [
    {
      "degree": "Degree (e.g., B.Sc. Computer Science)",
      "institution": "University/College Name",
      "dates": "Start Year - End Year or Graduation Year"
    }
  ],
  "skills": [
    {
      "category": "Category Name (e.g., Programming Languages, Tools, Methodologies)",
      "tools": ["Skill 1", "Skill 2", "Skill 3"]
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "dates": "Start Date - End Date (Optional)",
      "description": [
        "Description of project goal/technology used",
        "Key achievements/impacts"
      ]
    }
  ]
}

Ensure all dates are clear and consistent. Extract phone numbers and emails accurately. If a section (like projects) is not present or empty, return an empty array for it.

Raw Resume Text:
---
${resumeText}
---

Job Company (if available): ${companyName || 'Not provided'}
Job Title (if available): ${jobTitle || 'Not provided'}
Job Description (if available):
---
${jobDescription}
---

Based on the above, provide the JSON structured resume.
`;

    try {
        const payload = {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
            }
        };

        const response = await fetch(geminiApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`שגיאה ב-AI בעת ניתוח קורות חיים: ${response.status}. ${errorBody}`);
        }

        const result = await response.json();

        if (result.usageMetadata) {
            totalTokensConsumed += result.usageMetadata.promptTokenCount || 0;
            totalTokensConsumed += result.usageMetadata.candidatesTokenCount || 0;
            updateTokenDisplay();
        }

        if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
            console.error("AI Response for resume parsing missing expected data structure:", JSON.stringify(result, null, 2));
            throw new Error("מבנה תגובה לא תקין מה-AI בעת ניתוח קורות חיים.");
        }

        let resumeDataText = result.candidates[0].content.parts[0].text;
        let parsedResumeData;
        try {
            resumeDataText = resumeDataText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            parsedResumeData = JSON.parse(resumeDataText);
            currentResumeDataForCoverLetter = parsedResumeData;
        } catch (parseError) {
            console.error("JSON Parse Error for AI parsed resume:", parseError, "Raw Text:", resumeDataText);
            throw new Error("ה-AI החזיר מבנה נתונים לא תקין עבור קורות חיים. בדוק קונסול.");
        }

        const { blob, filename } = generatePdfFromResumeData(parsedResumeData, jobTitle, selectedTemplate);
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = filename;

        resultArea.classList.remove('hidden');
        showMessage('קורות חיים מעוצבים נוצרו בהצלחה! ניתן להוריד את הקובץ.', false);

    } catch (error) {
        showMessage(`שגיאה בתהליך יצירת קורות חיים: ${error.message}`, true);
        console.error("Error generating resume:", error);
    } finally {
        loadingIndicator.classList.add('hidden');
    }
});

// --- Cover Letter Generation Logic ---
generateCoverLetterBtn.addEventListener('click', async () => {
    const companyName = companyNameInput.value.trim();
    const jobTitle = jobTitleInput.value.trim();
    const jobDescription = jobDescriptionTextarea.value.trim();
    const resumeText = resumeInput.value.trim();
    const selectedLanguage = document.querySelector('input[name="coverLetterLang"]:checked').value;

    const resumeContext = currentResumeDataForCoverLetter ?
        `Structured Resume Data:\n${JSON.stringify(currentResumeDataForCoverLetter, null, 2)}` :
        `Raw Resume Text:\n${resumeText}`;

    const applicantName = currentResumeDataForCoverLetter?.personalInfo?.name || "Applicant";
    const companyNameToUse = companyName || "Hiring Team";
    const jobTitleToUse = jobTitle || "the position";

    if (!companyName || !jobTitle || !jobDescription || (!resumeText && !currentResumeDataForCoverLetter)) {
        showMessage('אנא מלא את שדות "שם חברה", "שם תפקיד", "תיאור תפקיד" ו"קורות חיים גולמיים" (או טען מקישור) כדי ליצור מכתב מקדים.', true);
        return;
    }

    loadingCoverLetter.classList.remove('hidden');
    coverLetterResultArea.classList.add('hidden');
    coverLetterText.value = '';
    [messageDisplay, errorDisplay].forEach(el => el.classList.add('hidden'));
    showMessage('יוצר טיוטת מכתב מקדים...', false);

    let coverLetterPrompt;

    if (selectedLanguage === 'hebrew') {
        coverLetterPrompt = `
You are an expert HR professional and a persuasive writer. Your task is to generate a professional and compelling cover letter based on the provided job details and resume information.
The cover letter should be concise, professional, and highlight how the applicant's skills and experience align with the job requirements.
Focus on the job title, company, and description, and weave in relevant points from the resume.
Include a professional opening and closing.
Do NOT include any placeholders like [Your Name], [Hiring Manager Name], [Date], [Your Address], [Company Address].
**IMPORTANT: DO NOT MENTION THE COMPANY NAME (e.g., "${companyName}") IN THE COVER LETTER. The cover letter should be tailored to the job, but not explicitly name the company to avoid a "generated" feel.**

Job Title: ${jobTitle}
Company: ${companyName}
Job Description:
---
${jobDescription}
---

Applicant's Resume Information:
---
${resumeContext}
---

Generate the cover letter in Hebrew.
`;
    } else { // English
        coverLetterPrompt = `
You are an expert HR professional and a persuasive writer. Your task is to generate a professional and compelling cover letter based on the provided job details and resume information.
The cover letter should be concise, professional, and highlight how the applicant's skills and experience align with the job requirements.
Focus on the job title, company, and description, and weave in relevant points from the resume.
Include a professional opening and closing.

Opening:
Dear Hiring Manager,

Body:
(Generate the main body of the cover letter here, focusing on skills and experience relevant to ${jobTitleToUse} at ${companyNameToUse} based on the resume context.)
**IMPORTANT: DO NOT MENTION THE COMPANY NAME (e.g., "${companyName}") IN THE COVER LETTER. The cover letter should be tailored to the job, but not explicitly name the company to avoid a "generated" feel.**

Closing:
Thank you for your time and consideration. I look forward to hearing from you soon.

Sincerely,
${applicantName}

Do NOT include any placeholders like [Your Name], [Hiring Manager Name], [Date], [Your Address], [Company Address] within the body. Only use the provided opening and closing format.

Job Title: ${jobTitle}
Company: ${companyName}
Job Description:
---
${jobDescription}
---

Applicant's Resume Information:
---
${resumeContext}
---

Generate the cover letter in English.
`;
    }


    try {
        const payload = {
            contents: [{ role: "user", parts: [{ text: coverLetterPrompt }] }],
            generationConfig: {
                temperature: 0.7,
            }
        };

        const response = await fetch(geminiApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`שגיאה ב-AI בעת יצירת מכתב מקדים: ${response.status}. ${errorBody}`);
        }

        const result = await response.json();

        if (result.usageMetadata) {
            totalTokensConsumed += result.usageMetadata.promptTokenCount || 0;
            totalTokensConsumed += result.usageMetadata.candidatesTokenCount || 0;
            updateTokenDisplay();
        }

        if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
            console.error("AI Response for cover letter missing expected data structure:", JSON.stringify(result, null, 2));
            throw new Error("מבנה תגובה לא תקין מה-AI בעת יצירת מכתב מקדים.");
        }

        const generatedLetter = result.candidates[0].content.parts[0].text;
        coverLetterText.value = generatedLetter.trim();
        coverLetterResultArea.classList.remove('hidden');
        showMessage('טיוטת מכתב מקדים נוצרה בהצלחה!', false);

    } catch (error) {
        showMessage(`שגיאה בתהליך יצירת מכתב מקדים: ${error.message}`, true);
        console.error("Error generating cover letter:", error);
    } finally {
        loadingCoverLetter.classList.add('hidden');
    }
});

// --- Copy Cover Letter to Clipboard ---
copyCoverLetterBtn.addEventListener('click', () => {
    coverLetterText.select();
    coverLetterText.setSelectionRange(0, 99999);
    document.execCommand('copy');
    showMessage('המכתב המקדים הועתק ללוח הגזירים!', false);
});

// Initialize by trying to load saved progress on page load
loadProgressBtn.click();
updateTokenDisplay(); // Initial update for the token count
