# Student Registration & Result Portal

A fully functional Student Registration and Examination Result Management System built with plain **HTML5, CSS3 and vanilla JavaScript** — no frameworks, no backend required.

## Features

- Student registration form with full client-side validation (required fields, name/phone/email/register-number format checks, future-date rejection, duplicate register-number rejection).
- Examination marks entry (5 subjects) with live total/percentage/PASS-FAIL preview as you type.
- Automatic calculation of total, percentage, subject-wise grade & result, overall grade, and overall PASS/FAIL — nothing is hardcoded.
- Persistent storage in the browser via `localStorage` — records survive a page refresh.
- Student Records table: search (name / register number / email), View, Edit, Delete.
- Edit mode clearly indicated ("Edit Student" / "Update Student" / "Cancel Edit") and updates the existing record instead of creating a duplicate.
- Delete requires confirmation before removing a record.
- Dedicated Result Search by register number, with a "no result found" empty state.
- Dashboard with total/passed/failed students and average percentage, updated automatically.
- Print-friendly result sheet (`Print Result`) and CSV export (`Download Result`).
- Reusable toast notification system for success / error / warning messages.
- Optional "Load Sample Data" button (no fake data is inserted automatically).
- Responsive layout (desktop, tablet, mobile) and accessibility improvements (labels, focus states, ARIA attributes, PASS/FAIL shown with both color and text/symbol).

## Technologies Used

- HTML5 (semantic elements, native form validation)
- CSS3 (Flexbox, Grid, media queries, print styles)
- Vanilla JavaScript (ES6+, no libraries or frameworks)
- Browser `localStorage` for persistence

## Project Structure

```
project/
├── index.html
├── style.css
├── script.js
└── README.md
```

## How to Run

1. Open the project folder.
2. Open `index.html` directly in any modern browser (Chrome, Edge, Firefox).

No server, build step, or installation is required.

## How Data Is Stored

All student records are stored as a single JSON array under the localStorage key `srrp_students_v1`. Each record has this shape:

```json
{
  "id": "stu_...",
  "studentName": "...",
  "registerNumber": "...",
  "email": "...",
  "phone": "...",
  "dob": "YYYY-MM-DD",
  "gender": "...",
  "course": "...",
  "year": "...",
  "address": "...",
  "marks": { "mathematics": 0, "programming": 0, "dbms": 0, "networks": 0, "ai": 0 },
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp"
}
```

Total, percentage, grades, and PASS/FAIL are **derived values** — they are calculated on the fly from `marks` whenever the data is displayed, never stored as stale numbers.

Storage access is wrapped in try/catch; corrupted or missing localStorage data is treated as an empty list rather than crashing the app.

## Registration Workflow

Home → Registration → Enter Student Details → Enter Marks → Validate → Submit → record saved → result shown automatically → visible in Student Records and searchable in Results.

## Result Calculation Rules

- Maximum per subject: 100. Total subjects: 5. Maximum total: 500.
- `Total = sum of all 5 subject marks`
- `Percentage = (Total / 500) * 100`

## Grading Rules

| Marks / Percentage | Grade |
|---|---|
| 90–100 | A+ |
| 80–89  | A  |
| 70–79  | B+ |
| 60–69  | B  |
| 50–59  | C  |
| 40–49  | D  |
| Below 40 | F |

## PASS / FAIL Rules

- Passing threshold: **40 marks** per subject (single constant `CONFIG.PASS_MARK` in `script.js` — change it in one place to adjust the rule everywhere).
- A subject is "Pass" if marks ≥ 40, otherwise "Fail".
- Overall result is **PASS** only if every subject is a Pass; otherwise **FAIL**.

## Testing Instructions

Open the app and manually verify:

1. Register a valid student → confirm it is saved and the result view appears.
2. Register a second student → confirm both remain in Student Records.
3. Try registering with a register number that already exists → confirm it is rejected with an inline error.
4. Enter a subject mark below 40 → confirm that subject shows "Fail" and overall result is FAIL.
5. Enter all marks ≥ 40 → confirm overall result is PASS.
6. Change marks and watch the live preview (Total / Percentage / Overall) update before submitting.
7. Refresh the browser → confirm previously saved students are still listed.
8. Search Student Records by name, register number, and email (mixed case) → confirm matching results.
9. Click **View** on a student → confirm the full result (marks, grades, total, percentage, overall result/grade) is shown.
10. Click **Edit**, change some data, and submit → confirm the existing record is updated (no duplicate created).
11. Click **Delete**, confirm the dialog, and confirm the record is removed from the table and dashboard counts.
12. Use **Reset** while filling the form → confirm the form clears without deleting any saved student.
13. Use **Cancel Edit** while editing → confirm it returns to registration mode without altering the record.
14. Click **Print Result** → confirm only the result sheet is included in the print preview.
15. Resize the browser to a mobile width → confirm the layout, tables, and buttons remain usable.

## Known Limitations

- Data is stored per-browser via `localStorage`; it is not shared across devices or browsers and can be cleared by the user or by clearing site data.
- CSV export is a plain-text download rather than a formatted PDF (kept intentionally simple, per project scope).
- Email uniqueness is not enforced — only register number is required to be unique, per the specification.
