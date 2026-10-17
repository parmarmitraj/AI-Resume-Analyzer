# 📘 AI Resume Analyzer & Recruitment Platform — User Guide

Welcome to the **AI Resume Analyzer & Recruitment Platform**! This application is built with the **MERN Stack** (React.js, TailwindCSS, Node.js, Express.js, and MongoDB) and provides a two-way recruitment experience for both **Students/Job Seekers** and **Recruiters**.

---

## 🚀 Quick Start (Running Locally)

### 1. Backend Server
```bash
cd backend
npm install   # (First time only)
npm start
```
* **URL**: `http://localhost:8000`
* **Features**: Runs on Node.js/Express with native PDF parsing, in-memory skill extractor (2,800+ skills), pure JS TF-IDF scoring, and MongoDB storage (with automatic in-memory fallback if MongoDB is not running locally).

### 2. Frontend Application
```bash
cd frontend
npm install   # (First time only)
npm run dev
```
* **URL**: `http://localhost:5173` (or the port displayed in your terminal)
* **Proxy**: Automatically forwards `/api/*` requests to `http://localhost:8000`.

---

## 🌐 Site Navigation & Routes

| Path | Page | Description |
| :--- | :--- | :--- |
| `/` | **Default Home Landing Page** | Public landing page welcoming all visitors without requiring login, explaining the platform, and providing 1-click access to both portals. |
| `/jobs` | **Explore Jobs & AI Matcher** | Student portal to upload a resume PDF, view real-time match scores on every job card, and apply. |
| `/recruiter` | **Recruiter Command Hub** | Post job openings with auto-extracted skills, view auto-sorted applicant leaderboards, and bulk-screen resumes. |
| `/applications` | **My Applications** | Candidate tracking dashboard with live recruiter review status and persistent resume locker. |
| `/auditor` | **Resume Auditor** | Standalone tool to test any resume PDF against a custom job description. |
| `/analytics` | **Analytics & Intelligence** | System metrics, average match score, and top in-demand skill demand graphs. |

---

## 🎓 Guide for Students & Job Seekers

### Step 1: Open the "Explore Jobs" Portal
* From the Home page (`/`), click **"Explore Jobs & Test Match"** or navigate to `/jobs` in the navigation bar.

### Step 2: Upload Your Resume PDF
* In the top banner, click **"Upload Resume PDF"** (or drag & drop your resume).
* Supported format: **PDF** (e.g., using `resumes/sample.pdf` or your own resume).

### Step 3: View Real-Time Match Scores
* As soon as your resume is uploaded, the system evaluates it against **all active job postings**.
* Every job card displays a color-coded **Match Score Pill**:
  * 🟢 **80%+ Match**: High alignment (Emerald badge)
  * 🔵 **60% - 79% Match**: Solid foundation (Indigo badge)
  * 🟡 **Below 60%**: Emerging fit (Amber badge)

### Step 4: Filter & Search Opportunities
* **Min Match Score Slider**: Drag the slider to filter for jobs with high compatibility (e.g., `75%+ Match`).
* **Search Bar**: Search by job title, company, role, or technical skill (e.g., `React`, `Python`, `Remote`).

### Step 5: Inspect Skill Breakdown & AI Advice
* Click **"View Skill Breakdown"** on any job card to open the evaluation modal:
  * **Matched Skills**: Technical skills found in both your resume and the job requirements.
  * **Missing Requirements**: Skills demanded by the job that were not detected in your resume.
  * **Score Metrics**: Overall Match Score %, Skill Match %, and Contextual Similarity %.

### Step 6: One-Click Apply
* Click **"Apply Now"** on any job card.
* Your resume, extracted skills, and calculated match score are submitted to the recruiter.
* The button instantly confirms: **"Applied ✓"**.

---

## 🏢 Guide for Recruiters

### Step 1: Access the Recruiter Hub
* Click **Recruiter Hub** (`/recruiter`) in the top navigation bar.

### Step 2: Post a New Job Opening
1. Click the **"+ Post New Job"** button in the top right.
2. Fill in the job details:
   * **Job Title** (e.g., *Senior Full Stack AI Engineer*)
   * **Company / Department** (e.g., *Apex Labs*)
   * **Job Role** (e.g., *Full Stack Engineer*)
   * **Experience Level** (Entry, Mid, Senior, Lead)
   * **Location** (Remote, Hybrid, On-site)
   * **Salary Range** (e.g., *$120,000 - $145,000*)
   * **Job Description**: Paste the full job description.
3. Click **"Publish Job Posting"**.
4. The system automatically parses the description, extracts all technical skill requirements, and creates the posting.

### Step 3: View the Auto-Sorted Applicant Leaderboard
1. On the left sidebar, click on any active job opening.
2. The right panel immediately loads all candidate applicants **automatically sorted from highest match score to lowest**:
   * 🥇 **Rank #1 (Gold)**
   * 🥈 **Rank #2 (Silver)**
   * 🥉 **Rank #3 (Bronze)**
   * Ranked numbers for subsequent candidates (`#4`, `#5`, ...)
3. Each row displays:
   * **Candidate Name** & resume filename
   * **Visual Match Score Bar**
   * **Skills Matched / Missing Counts**
   * **Status Dropdown**: Change applicant status between `Applied`, `Shortlisted`, `Reviewed`, and `Rejected`.

### Step 4: Bulk Screen Candidate Resumes
* Have a folder of candidate resumes?
* Click **"Bulk Add Resumes"** inside any job opening and select multiple PDF files simultaneously.
* The system evaluates each resume in parallel, extracts skills, computes match scores, and adds them directly into the sorted leaderboard.

### Step 5: Candidate Details Modal
* Click **"Details"** on any applicant to view their full AI executive summary, score breakdown, and skill comparison.
* **Internal Recruiter Notes**: Type private review notes directly into the modal (e.g. *"Strong portfolio, scheduled for round 1 on Friday"*), which are saved in real-time.

### Step 6: Export Shortlist to CSV
* Click **"Export CSV"** in the top action bar to immediately download a spreadsheet containing candidate rankings, contact details, match percentages, skills, review statuses, and recruiter notes.

---

## 🔐 User Authentication & Roles

The system includes JWT-based role authentication for **Candidates** and **Recruiters**:

### 1. Register / Sign In
* Click **"Sign In"** or **"Register"** in the top navigation bar.
* During registration, select your role:
  * 💼 **Job Seeker / Candidate**: Grants access to the **Persistent Resume Locker** and **"My Applications"** tracker.
  * 🏢 **Recruiter / Hiring Manager**: Allows entering your Company Name and enables full job creation, candidate status management, internal review notes, and CSV exports.

### 2. Candidate "Resume Locker" ("Upload Once, Match Everywhere")
* Candidates can upload their resume PDF once under **My Applications** (`/applications`).
* The system extracts and stores your skills in your persistent profile locker.
* Whenever you browse the **Jobs Portal**, all active jobs automatically use your saved resume to calculate live match percentages without asking you to pick a file each time!

### 3. "My Applications" Tracking Page (`/applications`)
* Candidates can review all submitted applications in a real-time table:
  * Company, role, applied date, and match score %.
  * **Live Recruiter Review Status**: `Applied`, `Shortlisted`, `Reviewed`, or `Rejected`.
  * Missing requirements chips to identify which skills to learn next.
  * Recruiter feedback notes.

---

## ⚡ Standalone Resume Auditor (`/auditor`)

Use the **Resume Auditor** when you want to perform an ad-hoc test between any single resume and a custom job description:
1. Click **Resume Auditor** in the top navigation bar.
2. Upload a candidate resume PDF on the left.
3. Paste any job description text into the text area.
4. Click **"Run AI Match & Analysis"**.
5. View the score metrics, matched skill chips, missing skill chips, and actionable AI recommendations.

---

## 📊 Analytics & Insights (`/analytics`)

Click **Analytics** in the top navigation bar to inspect real-time recruitment metrics:
* **Active Job Openings**: Total jobs created by recruiters.
* **Total Applications**: Total candidate evaluations recorded.
* **Average Match Score**: System-wide candidate alignment average.
* **Most In-Demand Skills**: Horizontal bar charts displaying the most frequently required technical skills across postings.

---

## ⚙️ Configuration & Environment

### Database (`backend/.env`)
* **Default MongoDB URI**: `mongodb://127.0.0.1:27017/resume_analyzer`
* **Zero Setup Required**: If MongoDB is not running on your machine, the backend will automatically enable an **In-Memory database store** so all features work immediately out of the box.

### Gemini AI Coaching (Optional)
* To enable live Google Gemini 2.5 Flash feedback generation, set your API key in `backend/.env`:
  ```env
  GEMINI_API_KEY=your_gemini_api_key_here
  ```
* If no key is set, the system uses an intelligent rule-based coaching engine with full functionality preserved.

---

## ❓ Frequently Asked Questions (FAQ)

**Q: Do I need Python installed to run this project?**  
*No.* All PDF parsing, skill extraction, TF-IDF calculation, and scoring run natively in Node.js / JavaScript.

**Q: How is the match score calculated?**  
$$\text{Score} = \sqrt{\frac{0.50 \times \text{Skill Match \%} + 0.50 \times \text{Contextual TF-IDF Similarity \%}}{100}} \times 100$$  
*The square-root curve prevents artificially low scores resulting from natural vocabulary variations.*

**Q: Where are default jobs seeded from?**  
*When the backend starts, if no jobs exist in the database, it automatically seeds 3 realistic tech job openings so you can test student matching and recruiter leaderboards immediately.*
