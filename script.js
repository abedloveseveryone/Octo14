
const defaultStudents = [
    { id: "2026-001", name: "Juan Dela Cruz" },
    { id: "2026-002", name: "Maria Santos" },
    { id: "2026-003", name: "Pedro Reyes" },
    { id: "2026-004", name: "Ana Garcia" },
    { id: "2026-005", name: "Mark Lopez" }
];

function loadData(key, fallback) {
    try {
        const saved = localStorage.getItem(key);
        return saved === null ? fallback : JSON.parse(saved);
    } catch {
        return fallback;
    }
}

let students = loadData("attendanceStudents", defaultStudents);
let attendance = loadData("attendanceRecords", {});

const dateInput = document.getElementById("attendanceDate");
const searchInput = document.getElementById("searchInput");
const studentTable = document.getElementById("studentTable");

function getLocalDate() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

dateInput.value = getLocalDate();

function saveData() {
    localStorage.setItem("attendanceStudents", JSON.stringify(students));
    localStorage.setItem("attendanceRecords", JSON.stringify(attendance));
}

function getStatus(studentId) {
    return attendance[dateInput.value]?.[studentId] || "Absent";
}

function updateStatus(studentId, status) {
    const date = dateInput.value;

    if (!attendance[date]) {
        attendance[date] = {};
    }

    attendance[date][studentId] = status;

    saveData();
    renderStudents();
}

function renderStudents() {
    const query = searchInput.value.toLowerCase().trim();

    const filteredStudents = students.filter(student =>
        student.id.toLowerCase().includes(query) ||
        student.name.toLowerCase().includes(query)
    );

    studentTable.innerHTML = "";

    if (filteredStudents.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 4;
        cell.className = "empty-message";
        cell.textContent = "No students found.";

        row.appendChild(cell);
        studentTable.appendChild(row);
    }

    filteredStudents.forEach(student => {
        const row = document.createElement("tr");

        const idCell = document.createElement("td");
        idCell.textContent = student.id;

        const nameCell = document.createElement("td");
        nameCell.textContent = student.name;

        const statusCell = document.createElement("td");
        const statusSelect = document.createElement("select");

        statusSelect.className = "status-select";
        statusSelect.setAttribute(
            "aria-label",
            `Attendance status for ${student.name}`
        );

        ["Present", "Absent", "Late"].forEach(status => {
            const option = document.createElement("option");
            option.value = status;
            option.textContent = status;
            statusSelect.appendChild(option);
        });

        statusSelect.value = getStatus(student.id);
        statusSelect.classList.add(`status-${statusSelect.value}`);

        statusSelect.addEventListener("change", () => {
            updateStatus(student.id, statusSelect.value);
        });

        statusCell.appendChild(statusSelect);

        const actionCell = document.createElement("td");
        const removeButton = document.createElement("button");

        removeButton.type = "button";
        removeButton.className = "button-remove";
        removeButton.textContent = "Remove";

        removeButton.addEventListener("click", () => {
            const confirmed = confirm(
                `Are you sure you want to remove ${student.name}?`
            );

            if (!confirmed) {
                return;
            }

            students = students.filter(item => item.id !== student.id);

            Object.values(attendance).forEach(records => {
                delete records[student.id];
            });

            saveData();
            renderStudents();
        });

        actionCell.appendChild(removeButton);

        row.append(idCell, nameCell, statusCell, actionCell);
        studentTable.appendChild(row);
    });

    updateSummary();

    document.getElementById("studentCountLabel").textContent =
        `${filteredStudents.length} of ${students.length} students`;
}

function updateSummary() {
    const counts = {
        Present: 0,
        Absent: 0,
        Late: 0
    };

    students.forEach(student => {
        counts[getStatus(student.id)]++;
    });

    document.getElementById("totalStudents").textContent = students.length;
    document.getElementById("presentCount").textContent = counts.Present;
    document.getElementById("absentCount").textContent = counts.Absent;
    document.getElementById("lateCount").textContent = counts.Late;
}

document.getElementById("studentForm").addEventListener("submit", event => {
    event.preventDefault();

    const id = document.getElementById("studentId").value.trim();
    const name = document.getElementById("studentName").value.trim();

    if (!id || !name) {
        alert("Please enter the student ID and full name.");
        return;
    }

    const duplicate = students.some(student =>
        student.id.toLowerCase() === id.toLowerCase()
    );

    if (duplicate) {
        alert("This student ID already exists.");
        return;
    }

    students.push({ id, name });

    saveData();
    event.target.reset();
    renderStudents();

    alert("Student added successfully.");
});

searchInput.addEventListener("input", renderStudents);

dateInput.addEventListener("change", renderStudents);

document.getElementById("resetButton").addEventListener("click", () => {
    const date = dateInput.value;

    if (!confirm(`Reset all attendance records for ${date}?`)) {
        return;
    }

    delete attendance[date];

    saveData();
    renderStudents();
});

document.getElementById("exportButton").addEventListener("click", () => {
    const escapeCSV = value =>
        '"' + String(value).replace(/"/g, '""') + '"';

    const rows = [
        ["Date", "Student ID", "Student Name", "Attendance Status"],
        ...students.map(student => [
            dateInput.value,
            student.id,
            student.name,
            getStatus(student.id)
        ])
    ];

    const csv = rows
        .map(row => row.map(escapeCSV).join(","))
        .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `attendance-${dateInput.value}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
});

renderStudents();
