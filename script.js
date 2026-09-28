/* =========================================================
   STUDENT REGISTRATION & RESULT PORTAL - APPLICATION LOGIC
   =========================================================
   Structure:
   1. Config / Constants
   2. State
   3. Storage layer (localStorage)
   4. Validation
   5. Calculations (total, percentage, grade, pass/fail)
   6. Rendering (dashboard, table, result view)
   7. Notifications
   8. Form handling (create / edit / reset)
   9. CRUD operations (view / edit / delete)
   10. Search
   11. Navigation
   12. Print
   13. Init
   ========================================================= */

/* ================= 1. CONFIG / CONSTANTS ================= */
const CONFIG = {
  STORAGE_KEY: "srrp_students_v1",
  PASS_MARK: 40,          // single source of truth for the passing threshold
  MAX_MARK: 100,
  SUBJECTS: [
    { key: "mathematics", label: "Mathematics" },
    { key: "programming", label: "Programming" },
    { key: "dbms", label: "Database Management Systems" },
    { key: "networks", label: "Computer Networks" },
    { key: "ai", label: "Artificial Intelligence" }
  ]
};
CONFIG.MAX_TOTAL = CONFIG.SUBJECTS.length * CONFIG.MAX_MARK; // 500

const SAMPLE_STUDENTS = [
  {
    studentName: "Monisha H",
    regNumber: "PEC2026001",
    email: "monisha@example.com",
    phone: "9876543210",
    dob: "2005-06-12",
    gender: "Female",
    course: "Artificial Intelligence and Data Science",
    year: "II Year",
    address: "12 Anna Nagar, Chennai",
    marks: { mathematics: 85, programming: 91, dbms: 78, networks: 82, ai: 88 }
  },
  {
    studentName: "Arun Kumar",
    regNumber: "PEC2026002",
    email: "arun@example.com",
    phone: "9123456780",
    dob: "2004-11-02",
    gender: "Male",
    course: "Computer Science and Engineering",
    year: "III Year",
    address: "45 Gandhi Street, Coimbatore",
    marks: { mathematics: 35, programming: 62, dbms: 55, networks: 48, ai: 60 }
  }
];

/* ================= 2. STATE ================= */
let editingStudentId = null;   // null = create mode, else studentId being edited
let selectedResultId = null;   // student currently shown in Results section
let pendingDeleteId = null;    // studentId awaiting delete confirmation

/* ================= 3. STORAGE LAYER ================= */

/** Safely read all students from localStorage. Never throws. */
function getStudents() {
  try {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (err) {
    console.error("Failed to read student records, resetting storage.", err);
    return [];
  }
}

/** Persist the full student array. Never throws to the caller. */
function saveStudents(students) {
  try {
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(students));
    return true;
  } catch (err) {
    console.error("Failed to save student records.", err);
    notify("Unable to save data. Your browser storage may be full or disabled.", "error");
    return false;
  }
}

function addStudent(student) {
  const students = getStudents();
  students.push(student);
  return saveStudents(students);
}

function updateStudent(id, updatedFields) {
  const students = getStudents();
  const index = students.findIndex(s => s.id === id);
  if (index === -1) return false;
  students[index] = { ...students[index], ...updatedFields, updatedAt: new Date().toISOString() };
  return saveStudents(students);
}

function deleteStudent(id) {
  const students = getStudents();
  const filtered = students.filter(s => s.id !== id);
  return saveStudents(filtered);
}

function findStudentById(id) {
  return getStudents().find(s => s.id === id) || null;
}

function findStudentByRegisterNumber(regNumber, excludeId) {
  const normalized = regNumber.trim().toLowerCase();
  return getStudents().find(
    s => s.registerNumber.toLowerCase() === normalized && s.id !== excludeId
  ) || null;
}

function searchStudents(query) {
  const students = getStudents();
  if (!query || !query.trim()) return students;
  const q = query.trim().toLowerCase();
  return students.filter(s =>
    s.studentName.toLowerCase().includes(q) ||
    s.registerNumber.toLowerCase().includes(q) ||
    s.email.toLowerCase().includes(q)
  );
}

function generateId() {
  return "stu_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}

/* ================= 4. VALIDATION ================= */

/** Clears all previously shown error messages and error styling. */
function clearAllErrors() {
  document.querySelectorAll(".error-text").forEach(el => (el.textContent = ""));
  document.querySelectorAll(".field-invalid").forEach(el => el.classList.remove("field-invalid"));
}

function setFieldError(fieldId, message) {
  const errorEl = document.getElementById("err-" + fieldId);
  const fieldEl = document.getElementById(fieldId);
  if (errorEl) errorEl.textContent = message;
  if (fieldEl) fieldEl.classList.add("field-invalid");
}

function clearFieldError(fieldId) {
  const errorEl = document.getElementById("err-" + fieldId);
  const fieldEl = document.getElementById(fieldId);
  if (errorEl) errorEl.textContent = "";
  if (fieldEl) fieldEl.classList.remove("field-invalid");
}

/**
 * Validates the whole registration form.
 * Returns { valid: boolean, data: {...} } - data is populated even on
 * partial validity so the caller always has trimmed values to reuse.
 */
function validateForm() {
  clearAllErrors();
  let valid = true;

  const studentName = document.getElementById("studentName").value.trim();
  const regNumber = document.getElementById("regNumber").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const dob = document.getElementById("dob").value;
  const genderInput = document.querySelector('input[name="gender"]:checked');
  const gender = genderInput ? genderInput.value : "";
  const course = document.getElementById("course").value;
  const year = document.getElementById("year").value;
  const address = document.getElementById("address").value.trim();

  // Student name
  if (!studentName) {
    setFieldError("studentName", "Student name is required.");
    valid = false;
  } else if (studentName.length < 3 || studentName.length > 50) {
    setFieldError("studentName", "Name must be between 3 and 50 characters.");
    valid = false;
  } else if (!/^[A-Za-z ]+$/.test(studentName)) {
    setFieldError("studentName", "Name can only contain letters and spaces.");
    valid = false;
  }

  // Register number
  if (!regNumber) {
    setFieldError("regNumber", "Register number is required.");
    valid = false;
  } else if (!/^[A-Za-z0-9]{4,20}$/.test(regNumber)) {
    setFieldError("regNumber", "Use 4-20 letters/numbers only.");
    valid = false;
  } else if (findStudentByRegisterNumber(regNumber, editingStudentId)) {
    setFieldError("regNumber", "Register number already exists.");
    valid = false;
  }

  // Email
  if (!email) {
    setFieldError("email", "Email is required.");
    valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setFieldError("email", "Enter a valid email address.");
    valid = false;
  }

  // Phone
  if (!phone) {
    setFieldError("phone", "Phone number is required.");
    valid = false;
  } else if (!/^[6-9][0-9]{9}$/.test(phone)) {
    setFieldError("phone", "Enter a valid 10-digit Indian mobile number.");
    valid = false;
  }

  // Date of birth
  if (!dob) {
    setFieldError("dob", "Date of birth is required.");
    valid = false;
  } else {
    const dobDate = new Date(dob);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(dobDate.getTime())) {
      setFieldError("dob", "Enter a valid date.");
      valid = false;
    } else if (dobDate > today) {
      setFieldError("dob", "Date of birth cannot be in the future.");
      valid = false;
    }
  }

  // Gender
  if (!gender) {
    setFieldError("gender", "Please select a gender.");
    valid = false;
  }

  // Course
  if (!course) {
    setFieldError("course", "Please select a course.");
    valid = false;
  }

  // Year
  if (!year) {
    setFieldError("year", "Please select a year of study.");
    valid = false;
  }

  // Address
  if (!address) {
    setFieldError("address", "Address is required.");
    valid = false;
  }

  // Marks
  const marks = {};
  CONFIG.SUBJECTS.forEach(subject => {
    const inputEl = document.getElementById(subject.key);
    const rawValue = inputEl.value.trim();
    const numValue = Number(rawValue);

    if (rawValue === "" || Number.isNaN(numValue)) {
      setFieldError(subject.key, "Enter a valid number.");
      valid = false;
      marks[subject.key] = null;
    } else if (numValue < 0 || numValue > CONFIG.MAX_MARK) {
      setFieldError(subject.key, `Marks must be between 0 and ${CONFIG.MAX_MARK}.`);
      valid = false;
      marks[subject.key] = null;
    } else {
      marks[subject.key] = numValue;
    }
  });

  return {
    valid,
    data: { studentName, regNumber, email, phone, dob, gender, course, year, address, marks }
  };
}

/* ================= 5. CALCULATIONS ================= */

function calculateGrade(marks) {
  if (marks >= 90) return "A+";
  if (marks >= 80) return "A";
  if (marks >= 70) return "B+";
  if (marks >= 60) return "B";
  if (marks >= 50) return "C";
  if (marks >= CONFIG.PASS_MARK) return "D";
  return "F";
}

function calculateSubjectResult(marks) {
  return marks >= CONFIG.PASS_MARK ? "Pass" : "Fail";
}

/**
 * Given a marks object { mathematics, programming, ... }, returns the full
 * derived result: total, percentage, per-subject grade/result, overall
 * result and overall grade.
 */
function computeResult(marks) {
  const subjectResults = CONFIG.SUBJECTS.map(subject => {
    const value = Number(marks[subject.key]) || 0;
    return {
      key: subject.key,
      label: subject.label,
      marks: value,
      grade: calculateGrade(value),
      result: calculateSubjectResult(value)
    };
  });

  const total = subjectResults.reduce((sum, s) => sum + s.marks, 0);
  const percentage = (total / CONFIG.MAX_TOTAL) * 100;
  const overallResult = subjectResults.every(s => s.result === "Pass") ? "PASS" : "FAIL";
  const overallGrade = calculateGrade(percentage);

  return { subjectResults, total, percentage, overallResult, overallGrade };
}

/* ================= 6. RENDERING ================= */

function renderAll() {
  renderDashboard();
  renderStudentsTable(document.getElementById("recordSearch").value);
}

function renderDashboard() {
  const students = getStudents();
  const total = students.length;
  let passed = 0;
  let percentageSum = 0;

  students.forEach(s => {
    const result = computeResult(s.marks);
    if (result.overallResult === "PASS") passed++;
    percentageSum += result.percentage;
  });

  const failed = total - passed;
  const average = total > 0 ? (percentageSum / total) : 0;

  document.getElementById("statTotal").textContent = total;
  document.getElementById("statPassed").textContent = passed;
  document.getElementById("statFailed").textContent = failed;
  document.getElementById("statAverage").textContent = average.toFixed(1) + "%";
}

function renderStudentsTable(filterQuery) {
  const tbody = document.getElementById("studentsTableBody");
  const emptyState = document.getElementById("studentsEmptyState");
  const students = searchStudents(filterQuery || "");

  tbody.innerHTML = "";

  if (students.length === 0) {
    emptyState.classList.remove("hidden");
    emptyState.textContent = (getStudents().length === 0)
      ? "No student records available. Register a student to get started."
      : "No matching students found.";
    return;
  }
  emptyState.classList.add("hidden");

  students.forEach(student => {
    const result = computeResult(student.marks);
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${escapeHtml(student.studentName)}</td>
      <td>${escapeHtml(student.registerNumber)}</td>
      <td>${escapeHtml(student.course)}</td>
      <td>${escapeHtml(student.year)}</td>
      <td>${escapeHtml(student.email)}</td>
      <td>${result.total} / ${CONFIG.MAX_TOTAL}</td>
      <td>${result.percentage.toFixed(2)}%</td>
      <td><span class="badge ${result.overallResult === 'PASS' ? 'badge-pass' : 'badge-fail'}">${result.overallResult}</span></td>
      <td class="actions-cell">
        <button type="button" class="btn-small btn-view" data-action="view" data-id="${student.id}">View</button>
        <button type="button" class="btn-small btn-edit" data-action="edit" data-id="${student.id}">Edit</button>
        <button type="button" class="btn-small btn-delete" data-action="delete" data-id="${student.id}">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/** Renders the full result view (details + table + summary) for a student. */
function renderResultView(student) {
  const container = document.getElementById("resultView");

  if (!student) {
    container.innerHTML = `<p class="empty-state" id="resultEmptyState">Select a student to view the examination result.</p>`;
    return;
  }

  const result = computeResult(student.marks);

  const rowsHtml = result.subjectResults.map(s => `
    <tr>
      <td>${escapeHtml(s.label)}</td>
      <td>${s.marks}</td>
      <td>${CONFIG.MAX_MARK}</td>
      <td>${s.grade}</td>
      <td class="${s.result === 'Pass' ? 'pass' : 'fail'}">${s.result}</td>
    </tr>
  `).join("");

  container.innerHTML = `
    <div class="card result-card" id="printableResult">
      <h2 class="print-only">Examination Result Sheet</h2>

      <div class="student-info-grid">
        <div class="info-item">
          <span class="info-label">Student Name</span>
          <span class="info-value">${escapeHtml(student.studentName)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Register Number</span>
          <span class="info-value">${escapeHtml(student.registerNumber)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Course</span>
          <span class="info-value">${escapeHtml(student.course)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Year</span>
          <span class="info-value">${escapeHtml(student.year)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Email</span>
          <span class="info-value">${escapeHtml(student.email)}</span>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="result-table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Marks</th>
              <th>Maximum Marks</th>
              <th>Grade</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>

      <div class="result-summary">
        <p><strong>Total Marks:</strong> ${result.total} / ${CONFIG.MAX_TOTAL}</p>
        <p><strong>Percentage:</strong> ${result.percentage.toFixed(2)}%</p>
        <p><strong>Overall Grade:</strong> ${result.overallGrade}</p>
        <p class="overall-result">Overall Result:
          <span class="pass-badge ${result.overallResult === 'PASS' ? 'pass-badge-pass' : 'pass-badge-fail'}">
            ${result.overallResult}
          </span>
        </p>
      </div>

      <div class="button-group no-print">
        <button type="button" class="btn btn-primary" id="printResultBtn">Print Result</button>
        <button type="button" class="btn btn-secondary" id="downloadResultBtn">Download Result (CSV)</button>
        <button type="button" class="btn btn-outline" id="closeResultBtn">Close</button>
      </div>
    </div>
  `;

  document.getElementById("printResultBtn").addEventListener("click", printResult);
  document.getElementById("downloadResultBtn").addEventListener("click", () => downloadResultCsv(student, result));
  document.getElementById("closeResultBtn").addEventListener("click", () => {
    selectedResultId = null;
    renderResultView(null);
  });
}

/** Basic HTML escaping to keep user-entered text safe when injected into the DOM. */
function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = String(value ?? "");
  return div.innerHTML;
}

/* ================= 7. NOTIFICATIONS ================= */

function notify(message, type = "success") {
  const area = document.getElementById("notificationArea");
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.setAttribute("role", "status");
  toast.textContent = message;
  area.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("toast-hide");
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

/* ================= 8. FORM HANDLING ================= */

function setFormMode(mode, student) {
  const formModeTitle = document.getElementById("formModeTitle");
  const detailsLegend = document.getElementById("detailsLegend");
  const submitBtn = document.getElementById("submitBtn");
  const cancelEditBtn = document.getElementById("cancelEditBtn");

  if (mode === "edit" && student) {
    editingStudentId = student.id;
    formModeTitle.textContent = "Edit Student";
    detailsLegend.textContent = "Edit Student";
    submitBtn.textContent = "Update Student";
    cancelEditBtn.classList.remove("hidden");
    fillFormWithStudent(student);
  } else {
    editingStudentId = null;
    formModeTitle.textContent = "Student Registration";
    detailsLegend.textContent = "Student Registration";
    submitBtn.textContent = "Submit Registration";
    cancelEditBtn.classList.add("hidden");
  }
}

function fillFormWithStudent(student) {
  document.getElementById("studentId").value = student.id;
  document.getElementById("studentName").value = student.studentName;
  document.getElementById("regNumber").value = student.registerNumber;
  document.getElementById("email").value = student.email;
  document.getElementById("phone").value = student.phone;
  document.getElementById("dob").value = student.dob;
  document.getElementById("address").value = student.address;
  document.getElementById("course").value = student.course;
  document.getElementById("year").value = student.year;

  const genderInput = document.querySelector(`input[name="gender"][value="${student.gender}"]`);
  if (genderInput) genderInput.checked = true;

  CONFIG.SUBJECTS.forEach(subject => {
    document.getElementById(subject.key).value = student.marks[subject.key];
  });

  updateLivePreview();
  clearAllErrors();
}

function resetForm() {
  const form = document.getElementById("studentForm");
  form.reset();
  document.getElementById("studentId").value = "";
  clearAllErrors();
  setFormMode("create");
  updateLivePreview();
}

function updateLivePreview() {
  const marks = {};
  CONFIG.SUBJECTS.forEach(subject => {
    const raw = document.getElementById(subject.key).value;
    marks[subject.key] = raw === "" ? 0 : Number(raw);
  });

  const result = computeResult(marks);
  document.getElementById("liveTotal").textContent = result.total;
  document.getElementById("livePercentage").textContent = result.percentage.toFixed(2) + "%";

  const overallEl = document.getElementById("liveOverall");
  const hasAnyInput = CONFIG.SUBJECTS.some(s => document.getElementById(s.key).value !== "");

  if (!hasAnyInput) {
    overallEl.textContent = "--";
    overallEl.className = "badge badge-neutral";
  } else {
    overallEl.textContent = result.overallResult;
    overallEl.className = `badge ${result.overallResult === "PASS" ? "badge-pass" : "badge-fail"}`;
  }
}

function handleFormSubmit(event) {
  event.preventDefault();

  const { valid, data } = validateForm();
  if (!valid) {
    notify("Please correct the highlighted fields.", "error");
    return;
  }

  if (editingStudentId) {
    // Update existing student - never create a duplicate.
    const updated = updateStudent(editingStudentId, {
      studentName: data.studentName,
      registerNumber: data.regNumber,
      email: data.email,
      phone: data.phone,
      dob: data.dob,
      gender: data.gender,
      course: data.course,
      year: data.year,
      address: data.address,
      marks: data.marks
    });

    if (updated) {
      notify("Student record updated successfully.", "success");
      resetForm();
      renderAll();
      if (selectedResultId === editingStudentId) {
        renderResultView(findStudentById(editingStudentId));
      }
    }
  } else {
    const newStudent = {
      id: generateId(),
      studentName: data.studentName,
      registerNumber: data.regNumber,
      email: data.email,
      phone: data.phone,
      dob: data.dob,
      gender: data.gender,
      course: data.course,
      year: data.year,
      address: data.address,
      marks: data.marks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (addStudent(newStudent)) {
      notify("Student registered successfully.", "success");
      resetForm();
      renderAll();
      selectedResultId = newStudent.id;
      renderResultView(newStudent);
      goToSection("results");
    }
  }
}

/* ================= 9. CRUD OPERATIONS (view / edit / delete) ================= */

function handleTableAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const id = button.getAttribute("data-id");
  const action = button.getAttribute("data-action");
  const student = findStudentById(id);
  if (!student) {
    notify("This student record could not be found. It may have been deleted.", "error");
    renderAll();
    return;
  }

  if (action === "view") {
    selectedResultId = id;
    renderResultView(student);
    goToSection("results");
  } else if (action === "edit") {
    setFormMode("edit", student);
    goToSection("registration");
  } else if (action === "delete") {
    pendingDeleteId = id;
    document.getElementById("confirmDialog").classList.remove("hidden");
  }
}

function confirmDelete() {
  if (!pendingDeleteId) return;
  const wasEditing = editingStudentId === pendingDeleteId;
  const wasSelectedResult = selectedResultId === pendingDeleteId;

  deleteStudent(pendingDeleteId);
  notify("Student record deleted successfully.", "success");

  if (wasEditing) resetForm();
  if (wasSelectedResult) {
    selectedResultId = null;
    renderResultView(null);
  }

  pendingDeleteId = null;
  document.getElementById("confirmDialog").classList.add("hidden");
  renderAll();
}

function cancelDelete() {
  pendingDeleteId = null;
  document.getElementById("confirmDialog").classList.add("hidden");
}

/* ================= 10. SEARCH ================= */

function handleRecordSearch(event) {
  renderStudentsTable(event.target.value);
}

function handleResultSearch() {
  const query = document.getElementById("resultSearchInput").value.trim();
  const resultView = document.getElementById("resultView");

  if (!query) {
    notify("Enter a register number to search.", "warning");
    return;
  }

  const student = getStudents().find(
    s => s.registerNumber.toLowerCase() === query.toLowerCase()
  );

  if (student) {
    selectedResultId = student.id;
    renderResultView(student);
  } else {
    selectedResultId = null;
    resultView.innerHTML = `<p class="empty-state">No result found for this register number.</p>`;
  }
}

/* ================= 11. NAVIGATION ================= */

function goToSection(sectionId) {
  document.querySelectorAll(".app-section").forEach(sec => sec.classList.remove("active-section"));
  const target = document.getElementById(sectionId);
  if (target) target.classList.add("active-section");

  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.toggle("active", link.getAttribute("data-section") === sectionId);
  });

  window.scrollTo({ top: target ? target.offsetTop - 10 : 0, behavior: "smooth" });
}

/* ================= 12. PRINT / EXPORT ================= */

function printResult() {
  window.print();
}

function downloadResultCsv(student, result) {
  const lines = [];
  lines.push("Student Registration & Result Portal - Result Sheet");
  lines.push(`Student Name,${student.studentName}`);
  lines.push(`Register Number,${student.registerNumber}`);
  lines.push(`Course,${student.course}`);
  lines.push(`Year,${student.year}`);
  lines.push(`Email,${student.email}`);
  lines.push("");
  lines.push("Subject,Marks,Maximum Marks,Grade,Result");
  result.subjectResults.forEach(s => {
    lines.push(`${s.label},${s.marks},${CONFIG.MAX_MARK},${s.grade},${s.result}`);
  });
  lines.push("");
  lines.push(`Total,${result.total},${CONFIG.MAX_TOTAL}`);
  lines.push(`Percentage,${result.percentage.toFixed(2)}%`);
  lines.push(`Overall Grade,${result.overallGrade}`);
  lines.push(`Overall Result,${result.overallResult}`);

  const csvContent = lines.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${student.registerNumber}_result.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/* ================= 13. SAMPLE DATA ================= */

function loadSampleData() {
  const existing = getStudents();
  let addedCount = 0;

  SAMPLE_STUDENTS.forEach(sample => {
    if (findStudentByRegisterNumber(sample.regNumber, null)) return; // skip duplicates
    addStudent({
      id: generateId(),
      studentName: sample.studentName,
      registerNumber: sample.regNumber,
      email: sample.email,
      phone: sample.phone,
      dob: sample.dob,
      gender: sample.gender,
      course: sample.course,
      year: sample.year,
      address: sample.address,
      marks: sample.marks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    addedCount++;
  });

  if (addedCount > 0) {
    notify(`${addedCount} sample student record(s) loaded.`, "success");
  } else {
    notify("Sample data is already loaded.", "warning");
  }
  renderAll();
}

/* ================= 14. INIT ================= */

function init() {
  // Navigation
  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      goToSection(link.getAttribute("data-section"));
    });
  });
  document.querySelectorAll("[data-goto]").forEach(btn => {
    btn.addEventListener("click", () => goToSection(btn.getAttribute("data-goto")));
  });

  // Form
  document.getElementById("studentForm").addEventListener("submit", handleFormSubmit);
  document.getElementById("resetBtn").addEventListener("click", resetForm);
  document.getElementById("cancelEditBtn").addEventListener("click", resetForm);

  // Live preview & inline error clearing on marks + required fields
  CONFIG.SUBJECTS.forEach(subject => {
    document.getElementById(subject.key).addEventListener("input", () => {
      clearFieldError(subject.key);
      updateLivePreview();
    });
  });
  ["studentName", "regNumber", "email", "phone", "dob", "course", "year", "address"].forEach(id => {
    document.getElementById(id).addEventListener("input", () => clearFieldError(id));
    document.getElementById(id).addEventListener("change", () => clearFieldError(id));
  });
  document.querySelectorAll('input[name="gender"]').forEach(radio => {
    radio.addEventListener("change", () => clearFieldError("gender"));
  });

  // Student records table (event delegation)
  document.getElementById("studentsTableBody").addEventListener("click", handleTableAction);
  document.getElementById("recordSearch").addEventListener("input", handleRecordSearch);

  // Result search
  document.getElementById("resultSearchBtn").addEventListener("click", handleResultSearch);
  document.getElementById("resultSearchInput").addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleResultSearch();
    }
  });

  // Delete confirmation modal
  document.getElementById("confirmDeleteBtn").addEventListener("click", confirmDelete);
  document.getElementById("cancelDeleteBtn").addEventListener("click", cancelDelete);

  // Sample data
  document.getElementById("loadSampleBtn").addEventListener("click", loadSampleData);

  // Initial render
  setFormMode("create");
  updateLivePreview();
  renderAll();
  renderResultView(null);
  goToSection("home");
}

document.addEventListener("DOMContentLoaded", init);
