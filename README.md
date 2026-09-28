# Student Registration & Result Portal

A Student Registration and Examination Result Management System built with **HTML5, Bootstrap 5, CSS3 and vanilla JavaScript**. No backend or build step.

## Features

- Registration form: Student Name, Roll Number, Email, Phone, Date of Birth, Gender, Course, Year, Address.
- Subject-wise marks entry (5 subjects) with a live Total / Percentage / Pass-Fail preview.
- Validation with Bootstrap `is-invalid` styling, inline messages, a form-level alert and dismissible alerts.
- Automatic total, percentage, grades and Pass/Fail (JavaScript, never hardcoded).
- Student Records table (responsive): search, View, Edit, Delete (Bootstrap confirmation modal), Clear All Records.
- Edit mode ("Edit Student" / "Update Student" / "Cancel Edit") updates the same record - no duplicates.
- **Clear Form** never deletes saved records.
- Result search by roll number, printable result sheet, CSV download.
- Dashboard: total, passed, failed, average percentage.
- Optional "Load Sample Data" button; the database starts empty.

## Technologies

HTML5, Bootstrap 5.3.3 (CDN: CSS + JS bundle), CSS3 (theme overrides, print styles), vanilla JavaScript, `localStorage`.

## Project Structure

```
index.html   - structure (Bootstrap containers, grid, cards, forms, table, alerts, modal)
style.css    - purple theme overrides, section switching, print rules
script.js    - storage, validation, calculations, rendering, CRUD, search, navigation
README.md
```

## How to Run

1. Open the project folder.
2. Open `index.html` in a browser.

An internet connection is needed the first time so the browser can load Bootstrap from the jsDelivr CDN.

## How Data Is Stored

One JSON array in `localStorage` under the key `srrp_students_v1`. Only entered data is stored (details + marks + timestamps). Total, percentage, grades and results are recalculated whenever displayed. Corrupted or missing storage is treated as empty.

## Rules

- Marks: whole numbers 0-100; blank, decimal, negative, over-100 or non-numeric values are rejected.
- Total out of 500; Percentage = Total / 500 x 100.
- Subject passes at 40 or more (`CONFIG.PASS_MARK` in `script.js`). Overall PASS only if every subject passes.
- Grades: 90+ A+, 80+ A, 70+ B+, 60+ B, 50+ C, 40+ D, below 40 F.
- Roll number must be 4-20 letters/digits and unique. Phone: 10 digits starting 6-9. Date of birth cannot be in the future.

## Testing

Register, validate, calculate, view, edit, delete and clear using the buttons in the app. Try: empty form, bad email/phone, marks 39/40/100/101/decimal, duplicate roll number, search in mixed case, refresh the page, and print preview of a result.

## Limitations

Data is per-browser (`localStorage`). CSV export is plain CSV, not PDF. Email uniqueness is not enforced.
