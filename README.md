# QuizRev — Mobile-First Mock Exam & Revision Platform

**QuizRev** is a mobile-first, distraction-free mock examination and revision platform designed for educators and students. Built with an editorial aesthetic following the `design-taste-frontend` specification (no generic AI-slop, clear typography in Instrument Sans and Instrument Serif, high-contrast data, and tabular numbers).

---

## Key Features

### 👩‍🏫 Teacher Functions
1. **Gemini AI Agent Integration (`gemini-3.5-flash`):**
   - Deep semantic parsing of complex exam documents (.docx / .pdf) with 100% accurate segmentation of questions and choices.
   - Intelligent answer key mapping from standalone key files, appendix sections, or in-text markers.
   - Dedicated AI Agent configuration on the Teacher Dashboard with API key management and live connection tests.
2. **Upload Exam / Answer Key (.docx or .pdf):**
   - Supports uploading both an Exam document and an Answer Key document simultaneously.
   - Automatic question parsing, choice shuffling, and answer key extraction with instant client-side preview.
   - Dedicated Standalone Answer Key Uploader with AI Auto-Mapping.
3. **Dynamic Question & Choice Shuffling:**
   - Shuffles question order (Fisher-Yates) for each student sitting the exam.
   - Shuffles choices within each question while maintaining the correct answer pointer.
   - Configurable per-exam shuffle settings.
3. **Student Account Management:**
   - Create accounts for students with Full Name, Email, Student ID Number, and Temporary Password.
   - Quick "View As" toggle to simulate any student's testing session.
4. **Student Attempts & Scores Gradebook:**
   - Track classwide exam attempts, scores, percentages, and pass rates.
   - "Inspect Attempt" view to examine the exact answers chosen by any student for every question.
5. **Subject Tagging:**
   - Assign exams to subjects (e.g., General Science, Mathematics, Professional Education, English & Literature, History) or create custom subjects.

### 🎓 Student Functions
1. **Mobile-First Mock Exam Taking:**
   - Distraction-free exam mode with full touch optimization.
   - Live countdown timer with color shifting (amber under 5 minutes, red pulse under 2 minutes).
   - Horizontal question tracker with status colors (Answered, Unanswered, Flagged).
   - "Flag for Review" bookmarking.
   - Pre-submission confirmation summary warning if questions are left unanswered.
2. **Instant Score & Detailed Answer Review:**
   - Pass/Fail badge with celebratory confetti on passing marks.
   - Question-by-question review showing student choice vs answer key and rationale/explanations.
3. **Attempt Histories:**
   - Chronological attempt records filterable by subject.
   - Click any past attempt to review mistakes and answer explanations.
4. **Quantitative Analytics & Improvement Ratings:**
   - **Improvement Rating (%):** Compares recent attempt scores against baseline averages (e.g. `+14.5%` growth).
   - Class passing benchmark indicators (70%+).
   - Subject mastery breakdown bars categorized by **Mastered**, **Proficient**, or **Needs Review**.
   - Chronological score progression chart.

---

## Database Architecture (Supabase)

QuizRev operates with **Dual-Mode Database Architecture**:
1. **Local Mode (Out of the Box):** Pre-seeded with authentic mock exams, student profiles, and historical test attempts for instant testing without setup.
2. **Live Supabase Mode:** Plug in your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` via `.env` or through the in-app **DB Configuration Dialog** in the top navigation bar.

### SQL Schema Script
A production-ready Supabase migration file is included at [`supabase-schema.sql`](file:///c:/Users/ProfieJack/Desktop/QuizRev/supabase-schema.sql). It creates:
- `profiles` (with RLS for teachers and students)
- `subjects`
- `quizzes` (duration, passing percentage, shuffle settings)
- `questions` & `question_choices`
- `quiz_attempts` & `student_answers`

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev

# 3. Build for production
npm run build
```
Open [http://localhost:5173/](http://localhost:5173/) in your mobile browser or desktop.
