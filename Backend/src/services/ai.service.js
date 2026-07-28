const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const puppeteer = require("puppeteer")


const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})


const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job describe"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum(["low", "medium", "high"]).describe("The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc."),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.")
    })).describe("A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively"),
    title: z.string().describe("The title of the job for which the interview report is generated"),
})


async function generateInterviewReport({ resume, selfDescription, jobDescription }) {

    const prompt = `You are an expert technical interviewer and career coach with 15+ years of experience hiring for the role described below. Analyze the candidate's resume and self-description against the job description, then produce a detailed, honest interview-preparation report.

    === CANDIDATE RESUME ===
    ${resume}

    === CANDIDATE SELF DESCRIPTION ===
    ${selfDescription}

    === TARGET JOB DESCRIPTION ===
    ${jobDescription}

    Follow these rules strictly:

    1. matchScore: Give a realistic 0-100 score based on how well the candidate's actual skills, experience, and projects (from the resume/self description) align with the job description's requirements. Justify it through specifics — do not default to a generic high or low number.
    2. technicalQuestions: Generate 6-8 role-specific technical questions grounded in the actual technologies, projects, and requirements mentioned in the resume and job description — not generic questions. For each, explain the interviewer's real intention behind asking it, and give a concrete answer strategy (key points to cover, a suggested structure, and common mistakes to avoid).
    3. behavioralQuestions: Generate 4-6 behavioral questions relevant to the seniority level and role type implied by the job description. Ground them in realistic scenarios (teamwork, conflict, ownership, failure, deadlines), tailored to the candidate's background where possible.
    4. skillGaps: Identify specific, concrete skills or experience the job requires that are missing or weak in the candidate's resume/self-description. Assign a severity (low/medium/high) based on how critical that skill is to the role. Do not invent gaps that don't exist — if the candidate is a strong match, keep this list short and honest.
    5. preparationPlan: Create a realistic day-wise plan (7-10 days) leading up to the interview. Each day needs a clear focus area and 3-5 specific, actionable tasks — name actual topics, practice types, or resource categories, not vague advice like "study hard."
    6. title: A concise, professional job title derived from the job description (e.g. "Backend Developer (Node.js)").

    Be specific and evidence-based throughout — every question, gap, and task should clearly trace back to something in the resume or job description. Avoid generic, one-size-fits-all filler content.

    The response must be valid JSON matching the schema.`

    const response = await withRetry(() => ai.models.generateContent({
        // model: "gemini-3.6-flash",
        model: "gemini-3.1-flash-lite",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseJsonSchema: z.toJSONSchema(interviewReportSchema),
        }
    }))

    const result = JSON.parse(response.text)
    if (!result.title || !result.title.toString().trim()) {
        result.title = jobDescription?.split('\n')[0]?.trim() || "Untitled Position"
    }
    return result
}


async function generatePdfFromHtml(htmlContent) {
    const browser = await puppeteer.launch()
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
        format: "A4",
        margin: {
            top: "10mm",
            bottom: "5mm",
            left: "5mm",
            right: "5mm"
        }
    })

    await browser.close()

    return pdfBuffer
}


async function generateResumePdf({ resume, selfDescription, jobDescription }) {

    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
    })

    const prompt = `You are an expert resume writer and ATS (Applicant Tracking System) optimization specialist. Create a tailored, professional resume for this candidate for the target job.

    === CANDIDATE RESUME ===
    ${resume}

    === CANDIDATE SELF DESCRIPTION ===
    ${selfDescription}

    === TARGET JOB DESCRIPTION ===
    ${jobDescription}

    CONTENT rules:
        - Tailor the summary, skills ordering, and bullet points to mirror the language and priorities of the job description, using its keywords/terminology wherever it's truthfully applicable to this candidate.
        - Rewrite experience/project bullets with strong action verbs. Quantify impact (%, time saved, scale, users, performance) only where the source resume actually supports a number — never fabricate metrics or experience.
        - Write in a natural, human tone. Avoid AI-sounding clichés ("leveraged," "spearheaded," "passionate about," "results-driven synergy") and repetitive sentence openers.
        - Include only sections that have real content: Header (name, contact info, links), Summary, Skills, Experience, Projects, Education, Certifications.
        - Be concise — 1-2 pages worth of content. Prioritize whatever is most relevant to this specific job over completeness.

    ATS-FRIENDLY FORMATTING rules (critical — do not violate):
        - Single-column layout only. No tables, no multi-column CSS, no floated boxes — ATS parsers misread or scramble these.
        - Use real semantic HTML: <h1> for the name, <h2> for section headings, <ul><li> for bullets, <p> for paragraphs. Never rely on bare unstyled <div>s to convey structure.
        - No images, icons, or externally-loaded fonts (no @import, no Google Fonts links, no CDN references) — this renders offline in headless Chromium with no network access, so everything must be self-contained.
        - Use only standard web-safe font stacks (e.g. Arial, Helvetica, Calibri, Georgia, Times New Roman).
        - All CSS must live in one <style> block inside the returned HTML document — no external stylesheets.
        - Keep the visual design clean and restrained: consistent heading sizes, generous white space, at most one accent color used sparingly (e.g. name or section headings). No heavy colored backgrounds or decorative graphics.
        - Design for A4 print margins — content must not overflow or get cut off across page breaks.

    Return a JSON object with a single field "html" containing the complete, self-contained HTML document (including its <style> block), ready to be rendered directly to PDF.`

    const response = await withRetry(() => ai.models.generateContent({
        // model: "gemini-3.6-flash",
        model: "gemini-3.1-flash-lite",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseJsonSchema: z.toJSONSchema(resumePdfSchema),
        }
    }))

    const jsonContent = JSON.parse(response.text)

    const pdfBuffer = await generatePdfFromHtml(jsonContent.html)

    return pdfBuffer
}


async function withRetry(fn, { retries = 3, baseDelayMs = 1000 } = {}) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await fn()
        } catch (err) {
            const isRetryable = err.status === 503 || err.status === 429
            if (!isRetryable || attempt === retries) throw err

            const delay = baseDelayMs * 2 ** attempt // 1s, 2s, 4s...
            console.warn(`Gemini request failed (${err.status}), retrying in ${delay}ms... (attempt ${attempt + 1}/${retries})`)
            await new Promise(resolve => setTimeout(resolve, delay))
        }
    }
}


module.exports = { generateInterviewReport, generateResumePdf }