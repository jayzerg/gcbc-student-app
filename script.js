const API_BASE = '/api';

// Authentication helper functions
function isAuthenticated() {
    const teacher = localStorage.getItem('currentTeacher');
    return teacher !== null;
}

function getCurrentTeacher() {
    const teacher = localStorage.getItem('currentTeacher');
    return teacher ? JSON.parse(teacher) : null;
}

function displayWelcomeMessage() {
    const teacher = getCurrentTeacher();
    if (teacher) {
        console.log(`Welcome, ${teacher.firstName} ${teacher.lastName}!`);
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('currentTeacher');
        window.location.href = 'login.html';
    }
}

function updateTeacherInfo() {
    const teacher = getCurrentTeacher();
    if (teacher) {
        const teacherInfo = document.getElementById('teacherInfo');
        const teacherName = document.getElementById('teacherName');
        
        if (teacherInfo && teacherName) {
            teacherName.textContent = `${teacher.firstName} ${teacher.lastName}`;
            teacherInfo.classList.remove('hidden');
        }
    }
}

// Load students on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication first
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    // Initialize app
    displayWelcomeMessage();
    updateTeacherInfo();
    loadStudents();
});

document.getElementById('studentForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const student = {
        studentId: document.getElementById('studentId').value,
        lastName: document.getElementById('lastName').value,
        firstName: document.getElementById('firstName').value,
        middleName: document.getElementById('middleName').value,
        course: document.getElementById('course').value,
        yearLevel: document.getElementById('yearLevel').value,
        address: document.getElementById('address').value
    };

    try {
        const response = await fetch(`${API_BASE}/students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(student)
        });

        if (response.ok) {
            this.reset();
            loadStudents();
        } else {
            const error = await response.json();
            alert(error.error);
        }
    } catch (error) {
        alert('Error adding student: ' + error.message);
    }
});

async function loadStudents() {
    try {
        const response = await fetch(`${API_BASE}/students`);
        allStudents = await response.json();
        populateCourseFilter();
        displayStudents(allStudents);
    } catch (error) {
        console.error('Error loading students:', error);
    }
}

function displayStudents(students) {
    const tbody = document.getElementById('studentTableBody');
    tbody.innerHTML = '';

    students.forEach((student, index) => {
        const status = student.status || 'PENDING';
        const statusEmoji = status === 'ACTIVE' ? '✅' : '⏳';
        const statusColor = status === 'ACTIVE' ? 'bg-green-500 hover:bg-green-600' : 'bg-yellow-500 hover:bg-yellow-600';
        
        const row = tbody.insertRow();
        row.innerHTML = `
            <td class="px-1 sm:px-2 py-2 border border-gray-300 text-xs text-center">${index + 1}</td>
            <td class="px-1 sm:px-2 py-2 border border-gray-300 text-xs">${student.studentId}</td>
            <td class="px-1 sm:px-2 py-2 border border-gray-300 text-xs">${student.lastName}</td>
            <td class="px-1 sm:px-2 py-2 border border-gray-300 text-xs">${student.firstName}</td>
            <td class="px-1 sm:px-2 py-2 border border-gray-300 text-xs">${student.course || ''}</td>
            <td class="px-1 sm:px-2 py-2 border border-gray-300 text-xs">${student.yearLevel || ''}</td>
            <td class="px-1 sm:px-2 py-2 border border-gray-300">
                <button onclick="editStudent('${student._id}')" class="bg-blue-500 hover:bg-blue-600 text-white p-1 rounded mr-1 text-xs" title="Edit">
                    ✏️
                </button>
                <button onclick="openStatusModal('${student._id}')" class="${statusColor} text-white p-1 rounded mr-1 text-xs" title="Status: ${status}">
                    ${statusEmoji}
                </button>
                <button onclick="deleteStudent('${student._id}')" class="bg-red-500 hover:bg-red-600 text-white p-1 rounded text-xs" title="Delete">
                    🗑️
                </button>
            </td>
        `;
    });
}

let studentToDelete = null;

function deleteStudent(id) {
    studentToDelete = id;
    document.getElementById('deleteModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeDeleteModal() {
    studentToDelete = null;
    document.getElementById('deleteModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

async function confirmDelete() {
    if (studentToDelete) {
        try {
            await fetch(`${API_BASE}/students/${studentToDelete}`, { method: 'DELETE' });
            loadStudents();
            closeDeleteModal();
        } catch (error) {
            alert('Error deleting student: ' + error.message);
        }
    }
}

function showSection(section) {
    document.getElementById('studentsSection').classList.add('hidden');
    document.getElementById('gradingSection').classList.add('hidden');
    document.getElementById('classrecordSection').classList.add('hidden');
    document.getElementById('syllabusSection').classList.add('hidden');
    
    if (section === 'students') {
        document.getElementById('studentsSection').classList.remove('hidden');
        resetGradingPeriod();
    } else if (section === 'grading') {
        document.getElementById('gradingSection').classList.remove('hidden');
    } else if (section === 'classrecord') {
        document.getElementById('classrecordSection').classList.remove('hidden');
        // Load subjects when section is shown
        loadSubjects();
    } else if (section === 'syllabus') {
        document.getElementById('syllabusSection').classList.remove('hidden');
    }
}

// Subject management functions
function openAddSubjectModal() {
    const modal = document.getElementById('addSubjectModal');
    modal.classList.remove('hidden');
    
    // Enhanced animation sequence
    const modalContent = modal.querySelector('.bg-gradient-to-br');
    modalContent.classList.remove('scale-95');
    modalContent.classList.add('scale-100');
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    // Focus on first field for better UX
    setTimeout(() => {
        document.getElementById('subjectCode').focus();
    }, 300);
}

function closeAddSubjectModal() {
    const modal = document.getElementById('addSubjectModal');
    const modalContent = modal.querySelector('.bg-gradient-to-br');
    
    // Enhanced closing animation
    modalContent.classList.remove('scale-100');
    modalContent.classList.add('scale-95');
    
    // Fade out and hide modal
    setTimeout(() => {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        
        // Reset form for clean state
        document.getElementById('addSubjectForm').reset();
        
        // Reset all counters
        updateSubjectCounter('subjectCode', 'subjectCodeCounter', 20);
        updateSubjectCounter('subjectTitle', 'subjectTitleCounter', 100);
        updateSubjectCounter('subjectPrerequisites', 'subjectPrerequisitesCounter', 200);
        updateSubjectCounter('subjectDescription', 'subjectDescriptionCounter', 500);
    }, 300);
}

// Subject counter function
function updateSubjectCounter(inputId, counterId, maxLength) {
    const input = document.getElementById(inputId);
    const counter = document.getElementById(counterId);
    
    if (!input || !counter) return;
    
    const currentLength = input.value.length;
    
    counter.textContent = `${currentLength}/${maxLength}`;
    
    // Change color when approaching limit
    if (currentLength >= maxLength * 0.9) {
        counter.classList.add('text-red-500', 'font-bold');
        counter.classList.remove('text-purple-600', 'text-blue-600', 'text-gray-600');
    } else {
        counter.classList.remove('text-red-500', 'font-bold');
        // Restore original color based on field
        if (inputId.includes('Code')) {
            counter.classList.add('text-purple-600');
        } else if (inputId.includes('Title')) {
            counter.classList.add('text-blue-600');
        } else {
            counter.classList.add('text-gray-600');
        }
    }
}

// Load subjects function
function loadSubjects() {
    try {
        const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
        displaySubjects(subjects);
    } catch (error) {
        console.error('Error loading subjects:', error);
    }
}

// Display subjects function
function displaySubjects(subjects) {
    const tbody = document.getElementById('subjectsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (subjects.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-gray-500 border border-gray-300">No subjects added yet. Click "Add New Subject" to get started.</td></tr>';
        return;
    }
    
    subjects.forEach((subject, index) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td class="px-4 py-3 border border-gray-300 text-sm font-semibold text-gray-900 text-center">${index + 1}</td>
            <td class="px-4 py-3 border border-gray-300 text-sm font-bold text-purple-600">${subject.code}</td>
            <td class="px-4 py-3 border border-gray-300 text-sm font-semibold text-gray-900">${subject.title}</td>
            <td class="px-4 py-3 border border-gray-300 text-sm font-semibold text-center text-green-600">${subject.units}</td>
            <td class="px-4 py-3 border border-gray-300 text-center">
                <button onclick="editSubject('${subject.id}')" class="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded mr-1 text-sm font-bold" title="Edit Subject">
                    ✏️
                </button>
                <button onclick="deleteSubject('${subject.id}')" class="bg-red-500 hover:bg-red-600 text-white p-2 rounded text-sm font-bold" title="Delete Subject">
                    🗑️
                </button>
            </td>
        `;
    });
}

// Edit subject function (placeholder)
function editSubject(id) {
    alert('Edit subject functionality will be implemented in the next update.');
}

// Delete subject function
function deleteSubject(id) {
    if (confirm('Are you sure you want to delete this subject?')) {
        try {
            let subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
            subjects = subjects.filter(subject => subject.id !== id);
            localStorage.setItem('subjects', JSON.stringify(subjects));
            loadSubjects();
            alert('Subject deleted successfully!');
        } catch (error) {
            alert('Error deleting subject: ' + error.message);
        }
    }
}

// Load curriculum data
async function loadCurriculum() {
    try {
        // Load First Year First Semester
        const response1_1 = await fetch(`${API_BASE}/curriculum/1/1`);
        const subjects1_1 = await response1_1.json();
        displayCurriculum(subjects1_1, 'curriculum-1-1-body');
        
        // Load First Year Second Semester
        const response1_2 = await fetch(`${API_BASE}/curriculum/1/2`);
        const subjects1_2 = await response1_2.json();
        displayCurriculum(subjects1_2, 'curriculum-1-2-body');
        
        // Load Second Year First Semester
        const response2_1 = await fetch(`${API_BASE}/curriculum/2/1`);
        const subjects2_1 = await response2_1.json();
        displayCurriculum(subjects2_1, 'curriculum-2-1-body');
        
        // Load Second Year Second Semester
        const response2_2 = await fetch(`${API_BASE}/curriculum/2/2`);
        const subjects2_2 = await response2_2.json();
        displayCurriculum(subjects2_2, 'curriculum-2-2-body');
        

    } catch (error) {
        console.error('Error loading curriculum:', error);
    }
}

function displayCurriculum(subjects, tbodyId) {
    const tbody = document.getElementById(tbodyId);
    tbody.innerHTML = '';
    
    let totalLec = 0, totalLab = 0, totalUnits = 0;
    
    subjects.forEach(subject => {
        totalLec += subject.lecUnits;
        totalLab += subject.labUnits;
        totalUnits += subject.totalUnits;
        
        const row = tbody.insertRow();
        row.innerHTML = `
            <td class="px-3 py-2 border border-gray-300 text-sm">${subject.code}</td>
            <td class="px-3 py-2 border border-gray-300 text-sm">${subject.title}</td>
            <td class="px-3 py-2 border border-gray-300 text-sm text-center">${subject.lecUnits}</td>
            <td class="px-3 py-2 border border-gray-300 text-sm text-center">${subject.labUnits}</td>
            <td class="px-3 py-2 border border-gray-300 text-sm text-center">${subject.totalUnits}</td>
            <td class="px-3 py-2 border border-gray-300 text-sm">${subject.prerequisite}</td>
        `;
    });
    
    // Add total row
    const totalRow = tbody.insertRow();
    totalRow.innerHTML = `
        <td class="px-3 py-2 border border-gray-300 text-sm font-bold" colspan="2">Total</td>
        <td class="px-3 py-2 border border-gray-300 text-sm font-bold text-center">${totalLec}</td>
        <td class="px-3 py-2 border border-gray-300 text-sm font-bold text-center">${totalLab}</td>
        <td class="px-3 py-2 border border-gray-300 text-sm font-bold text-center">${totalUnits}</td>
        <td class="px-3 py-2 border border-gray-300 text-sm"></td>
    `;
    totalRow.classList.add('bg-gray-100');
}

function resetGradingPeriod() {
    document.getElementById('gradingGrid').classList.add('hidden');
    const allIcons = ['prelim-icon', 'midterm-icon', 'finals-icon'];
    allIcons.forEach(iconId => {
        const icon = document.getElementById(iconId);
        icon.classList.remove('blur-sm', 'opacity-50', 'scale-110');
    });
}

function editStudent(id) {
    fetch(`${API_BASE}/students`)
        .then(response => response.json())
        .then(students => {
            const student = students.find(s => s._id === id);
            if (student) {
                document.getElementById('editStudentId').value = student.studentId;
                document.getElementById('editLastName').value = student.lastName;
                document.getElementById('editFirstName').value = student.firstName;
                document.getElementById('editMiddleName').value = student.middleName || '';
                document.getElementById('editCourse').value = student.course || '';
                document.getElementById('editYearLevel').value = student.yearLevel || '';
                
                const editAddressField = document.getElementById('editAddress');
                editAddressField.disabled = false;
                editAddressField.value = student.address;
                editAddressField.disabled = true;
                
                updateCounter('editLastName', 'editLastNameCounter', 50);
                updateCounter('editFirstName', 'editFirstNameCounter', 50);
                updateCounter('editMiddleName', 'editMiddleNameCounter', 50);
                updateCounter('editAddress', 'editAddressCounter', 200);
                
                document.getElementById('editForm').setAttribute('data-student-id', id);
                document.getElementById('editModal').classList.remove('hidden');
                document.body.style.overflow = 'hidden';
            }
        })
        .catch(error => {
            alert('Error loading student data: ' + error.message);
        });
}

function closeEditModal() {
    document.getElementById('editModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// Edit form submission
document.getElementById('editForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const studentId = this.getAttribute('data-student-id');
    const updatedStudent = {
        lastName: document.getElementById('editLastName').value,
        firstName: document.getElementById('editFirstName').value,
        middleName: document.getElementById('editMiddleName').value,
        course: document.getElementById('editCourse').value,
        yearLevel: document.getElementById('editYearLevel').value,
        address: document.getElementById('editAddress').value
    };

    try {
        const response = await fetch(`${API_BASE}/students/${studentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedStudent)
        });

        if (response.ok) {
            closeEditModal();
            loadStudents();
        } else {
            const error = await response.json();
            alert(error.error);
        }
    } catch (error) {
        alert('Error updating student: ' + error.message);
    }
});

// Filter functionality
let allStudents = [];

function applyFilters() {
    const statusFilter = document.getElementById('statusFilter').value;
    const idSearch = document.getElementById('searchId').value.toLowerCase();
    const nameSearch = document.getElementById('searchName').value.toLowerCase();
    const courseFilter = document.getElementById('courseSort').value;
    const idSort = document.getElementById('idSort').value;
    
    let filteredStudents = allStudents.filter(student => {
        const matchesStatus = !statusFilter || (student.status || 'PENDING') === statusFilter;
        const matchesId = !idSearch || student.studentId.toLowerCase().includes(idSearch);
        const matchesName = !nameSearch || 
            student.lastName.toLowerCase().includes(nameSearch) ||
            student.firstName.toLowerCase().includes(nameSearch);
        const matchesCourse = !courseFilter || student.course === courseFilter;
        
        return matchesStatus && matchesId && matchesName && matchesCourse;
    });
    
    if (idSort === 'asc') {
        filteredStudents.sort((a, b) => a.studentId.localeCompare(b.studentId, undefined, { numeric: true }));
    } else if (idSort === 'desc') {
        filteredStudents.sort((a, b) => b.studentId.localeCompare(a.studentId, undefined, { numeric: true }));
    }
    
    displayStudents(filteredStudents);
}

document.getElementById('statusFilter').addEventListener('change', applyFilters);
document.getElementById('searchId').addEventListener('input', applyFilters);
document.getElementById('searchName').addEventListener('input', applyFilters);
document.getElementById('courseSort').addEventListener('change', applyFilters);
document.getElementById('idSort').addEventListener('change', applyFilters);

function populateCourseFilter() {
    const courseSelect = document.getElementById('courseSort');
    const courses = [...new Set(allStudents.map(s => s.course).filter(c => c))];
    
    courseSelect.innerHTML = '<option value="">All Courses</option>';
    courses.forEach(course => {
        courseSelect.innerHTML += `<option value="${course}">${course}</option>`;
    });
}

// Dropdown functionality
function toggleDropdown() {
    const dropdown = document.getElementById('dropdown');
    dropdown.classList.toggle('hidden');
}

function closeDropdown() {
    document.getElementById('dropdown').classList.add('hidden');
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('dropdown');
    const menuButton = event.target.closest('button');
    if (!menuButton || menuButton.onclick.toString().indexOf('toggleDropdown') === -1) {
        dropdown.classList.add('hidden');
    }
});

// Grading grid functions
async function showGradingGrid(period) {
    const grid = document.getElementById('gradingGrid');
    const tbody = document.getElementById('gradingTableBody');
    
    const allIcons = ['prelim-icon', 'midterm-icon', 'finals-icon'];
    allIcons.forEach(iconId => {
        const icon = document.getElementById(iconId);
        if (iconId === period + '-icon') {
            icon.classList.remove('blur-sm', 'opacity-50');
            icon.classList.add('scale-110');
        } else {
            icon.classList.add('blur-sm', 'opacity-50');
            icon.classList.remove('scale-110');
        }
    });
    
    // Load and display student data for grading
    await loadGradingData(period);
    
    grid.classList.remove('hidden');
}

async function loadGradingData(period = '') {
    try {
        const response = await fetch(`${API_BASE}/students`);
        let students = await response.json();
        
        // Filter only active students for grading
        students = students.filter(student => (student.status || 'PENDING') === 'ACTIVE');
        
        displayGradingData(students, period);
    } catch (error) {
        console.error('Error loading grading data:', error);
        const tbody = document.getElementById('gradingTableBody');
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-12 text-center text-red-500 font-medium tracking-wide">Error loading student data</td></tr>';
    }
}

function displayGradingData(students, period = '') {
    const tbody = document.getElementById('gradingTableBody');
    tbody.innerHTML = '';

    if (students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-12 text-center text-slate-500 font-medium tracking-wide">No active students found</td></tr>';
        return;
    }

    students.forEach((student, index) => {
        // Format full name with middle name if available
        const middleName = student.middleName ? ` ${student.middleName}` : '';
        const fullName = `${student.lastName}, ${student.firstName}${middleName}`;
        
        const row = tbody.insertRow();
        row.className = 'hover:bg-slate-50 transition-colors duration-200 border-b border-slate-200';
        row.innerHTML = `
            <td class="px-6 py-4 text-sm font-bold text-slate-700 text-center">${index + 1}</td>
            <td class="px-6 py-4 text-sm font-semibold text-blue-600">${student.studentId}</td>
            <td class="px-6 py-4 text-sm font-semibold text-slate-800">${fullName}</td>
            <td class="px-6 py-4 text-sm font-medium text-amber-600 text-center bg-amber-50 rounded-md border border-amber-200">
                <span class="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold tracking-wide">TBD</span>
            </td>
            <td class="px-6 py-4 text-sm font-medium text-slate-600 text-center italic">
                <span class="text-slate-400">— No remarks yet —</span>
            </td>
        `;
    });
}

// ID column sorting
let currentIdSort = 'default';

function toggleIdSort() {
    const idSortSelect = document.getElementById('idSort');
    
    if (currentIdSort === 'default' || currentIdSort === 'desc') {
        currentIdSort = 'asc';
        idSortSelect.value = 'asc';
    } else {
        currentIdSort = 'desc';
        idSortSelect.value = 'desc';
    }
    
    applyFilters();
}

// Status modal functions
function openStatusModal(studentId) {
    fetch(`${API_BASE}/students`)
        .then(response => response.json())
        .then(students => {
            const student = students.find(s => s._id === studentId);
            if (student) {
                const currentStatus = student.status || 'PENDING';
                document.querySelector(`input[name="studentStatus"][value="${currentStatus}"]`).checked = true;
                
                document.getElementById('statusModal').setAttribute('data-student-id', studentId);
                document.getElementById('statusModal').classList.remove('hidden');
                document.body.style.overflow = 'hidden';
            }
        })
        .catch(error => {
            alert('Error loading student data: ' + error.message);
        });
}

function closeStatusModal() {
    document.getElementById('statusModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

async function updateStatus() {
    const modal = document.getElementById('statusModal');
    const studentId = modal.getAttribute('data-student-id');
    const selectedStatus = document.querySelector('input[name="studentStatus"]:checked')?.value;
    
    if (!selectedStatus) {
        alert('Please select a status');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/students/${studentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: selectedStatus })
        });

        if (response.ok) {
            closeStatusModal();
            loadStudents();
            
            const gradingGrid = document.getElementById('gradingGrid');
            if (!gradingGrid.classList.contains('hidden')) {
                await loadGradingData('');
            }
        } else {
            const error = await response.json();
            alert(error.error);
        }
    } catch (error) {
        alert('Error updating status: ' + error.message);
    }
}

// Character counter function
function updateCounter(inputId, counterId, maxLength) {
    const input = document.getElementById(inputId);
    const counter = document.getElementById(counterId);
    const currentLength = input.value.length;
    
    counter.textContent = `${currentLength}/${maxLength}`;
    
    if (currentLength >= maxLength * 0.9) {
        counter.classList.add('text-red-500');
        counter.classList.remove('text-gray-500');
    } else {
        counter.classList.add('text-gray-500');
        counter.classList.remove('text-red-500');
    }
}

// Address modal functions
function openAddressModal() {
    document.getElementById('addressModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeAddressModal() {
    document.getElementById('addressModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function generateAddress() {
    const country = document.getElementById('country').value.trim();
    const region = document.getElementById('region').value.trim();
    const province = document.getElementById('province').value.trim();
    const municipality = document.getElementById('municipality').value.trim();
    const barangay = document.getElementById('barangay').value.trim();
    const streetAddress = document.getElementById('streetAddress').value.trim();
    
    const addressParts = [streetAddress, barangay, municipality, province, region, country].filter(part => part !== '');
    const fullAddress = addressParts.join(', ');
    
    const isEditMode = document.getElementById('addressModal').getAttribute('data-edit-mode') === 'true';
    
    if (isEditMode) {
        const editAddressField = document.getElementById('editAddress');
        editAddressField.disabled = false;
        editAddressField.value = fullAddress;
        updateCounter('editAddress', 'editAddressCounter', 200);
        editAddressField.disabled = true;
        
        document.getElementById('addressModal').removeAttribute('data-edit-mode');
    } else {
        const addressField = document.getElementById('address');
        addressField.disabled = false;
        addressField.value = fullAddress;
        updateCounter('address', 'addressCounter', 200);
        addressField.disabled = true;
    }
    
    // Clear all fields except country
    document.getElementById('region').value = '';
    document.getElementById('province').value = '';
    document.getElementById('municipality').value = '';
    document.getElementById('barangay').value = '';
    document.getElementById('streetAddress').value = '';
    
    closeAddressModal();
}

function toggleRegionDropdown() {
    document.getElementById('regionDropdown').classList.toggle('hidden');
}

function selectRegion(region) {
    document.getElementById('region').value = region;
    document.getElementById('regionDropdown').classList.add('hidden');
    
    document.getElementById('province').value = '';
    document.getElementById('municipality').value = '';
    document.getElementById('barangay').value = '';
    
    loadProvinces(region);
}

// Philippine address data cache
let addressCache = {
    provinces: {},
    municipalities: {},
    barangays: {}
};

async function loadProvinces(region) {
    const provinceList = document.getElementById('provinceList');
    provinceList.innerHTML = '<div class="text-center py-4 text-gray-500">Loading...</div>';
    
    try {
        if (!addressCache.provinces[region]) {
            const regionMapping = {
                'NCR': ['Metro Manila'],
                'CAR': ['Abra', 'Apayao', 'Benguet', 'Ifugao', 'Kalinga', 'Mountain Province'],
                'Region I': ['Ilocos Norte', 'Ilocos Sur', 'La Union', 'Pangasinan'],
                'Region II': ['Batanes', 'Cagayan', 'Isabela', 'Nueva Vizcaya', 'Quirino'],
                'Region III': ['Aurora', 'Bataan', 'Bulacan', 'Nueva Ecija', 'Pampanga', 'Tarlac', 'Zambales'],
                'Region IV-A': ['Batangas', 'Cavite', 'Laguna', 'Quezon', 'Rizal'],
                'Region IV-B': ['Marinduque', 'Occidental Mindoro', 'Oriental Mindoro', 'Palawan', 'Romblon'],
                'Region V': ['Albay', 'Camarines Norte', 'Camarines Sur', 'Catanduanes', 'Masbate', 'Sorsogon'],
                'Region VI': ['Aklan', 'Antique', 'Capiz', 'Guimaras', 'Iloilo', 'Negros Occidental'],
                'Region VII': ['Bohol', 'Cebu', 'Negros Oriental', 'Siquijor'],
                'Region VIII': ['Biliran', 'Eastern Samar', 'Leyte', 'Northern Samar', 'Samar', 'Southern Leyte'],
                'Region IX': ['Zamboanga del Norte', 'Zamboanga del Sur', 'Zamboanga Sibugay'],
                'Region X': ['Bukidnon', 'Camiguin', 'Lanao del Norte', 'Misamis Occidental', 'Misamis Oriental'],
                'Region XI': ['Davao de Oro', 'Davao del Norte', 'Davao del Sur', 'Davao Occidental', 'Davao Oriental'],
                'Region XII': ['Cotabato', 'Sarangani', 'South Cotabato', 'Sultan Kudarat'],
                'Region XIII': ['Agusan del Norte', 'Agusan del Sur', 'Dinagat Islands', 'Surigao del Norte', 'Surigao del Sur'],
                'BARMM': ['Basilan', 'Lanao del Sur', 'Maguindanao', 'Sulu', 'Tawi-Tawi']
            };
            
            addressCache.provinces[region] = regionMapping[region] || [];
        }
        
        const provinces = addressCache.provinces[region];
        
        if (provinces.length === 0) {
            provinceList.innerHTML = '<div class="text-center py-4 text-gray-500">No provinces available</div>';
            return;
        }
        
        provinceList.innerHTML = provinces.map(province => 
            `<button type="button" onclick="selectProvince('${province}')" class="block w-full px-3 py-2 text-left text-sm hover:bg-blue-50">${province}</button>`
        ).join('');
    } catch (error) {
        provinceList.innerHTML = '<div class="text-center py-4 text-red-500">Error loading provinces</div>';
    }
}

function toggleProvinceDropdown() {
    document.getElementById('provinceDropdown').classList.toggle('hidden');
}

function toggleMunicipalityDropdown() {
    document.getElementById('municipalityDropdown').classList.toggle('hidden');
}

function toggleBarangayDropdown() {
    document.getElementById('barangayDropdown').classList.toggle('hidden');
}

function selectProvince(province) {
    document.getElementById('province').value = province;
    document.getElementById('provinceDropdown').classList.add('hidden');
    
    document.getElementById('municipality').value = '';
    document.getElementById('barangay').value = '';
}

function selectMunicipality(municipality, municipalityCode) {
    document.getElementById('municipality').value = municipality;
    document.getElementById('municipalityDropdown').classList.add('hidden');
    
    document.getElementById('barangay').value = '';
}

function selectBarangay(barangay) {
    document.getElementById('barangay').value = barangay;
    document.getElementById('barangayDropdown').classList.add('hidden');
}

function resetForm() {
    document.getElementById('studentForm').reset();
    
    document.getElementById('middleName').disabled = true;
    document.getElementById('middleName').classList.add('bg-gray-100', 'cursor-not-allowed');
    document.getElementById('middleName').classList.remove('focus:ring-2', 'focus:ring-blue-500');
    
    updateCounter('lastName', 'lastNameCounter', 50);
    updateCounter('firstName', 'firstNameCounter', 50);
    updateCounter('middleName', 'middleNameCounter', 50);
    updateCounter('address', 'addressCounter', 200);
}

function toggleMiddleName() {
    const checkbox = document.getElementById('hasMiddleName');
    const middleNameField = document.getElementById('middleName');
    
    if (checkbox.checked) {
        middleNameField.disabled = false;
        middleNameField.classList.remove('bg-gray-100', 'cursor-not-allowed');
        middleNameField.classList.add('focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500');
    } else {
        middleNameField.disabled = true;
        middleNameField.value = '';
        middleNameField.classList.add('bg-gray-100', 'cursor-not-allowed');
        middleNameField.classList.remove('focus:ring-2', 'focus:ring-blue-500');
        updateCounter('middleName', 'middleNameCounter', 50);
    }
}

let currentYearFilter = null;
let isTableHidden = false;

function filterByYear(yearLevel) {
    const tableContainer = document.getElementById('studentTableContainer');
    const buttons = ['btn1st', 'btn2nd', 'btn3rd', 'btn4th', 'btnAll'];
    
    buttons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        btn.classList.remove('bg-blue-500', 'text-white');
        btn.classList.add('bg-blue-100', 'text-blue-800');
    });
    
    if (currentYearFilter === yearLevel) {
        if (isTableHidden) {
            tableContainer.classList.remove('hidden');
            isTableHidden = false;
        } else {
            tableContainer.classList.add('hidden');
            isTableHidden = true;
        }
    } else {
        tableContainer.classList.remove('hidden');
        isTableHidden = false;
        currentYearFilter = yearLevel;
        
        const activeBtn = document.getElementById(`btn${yearLevel.split(' ')[0].toLowerCase()}`);
        activeBtn.classList.remove('bg-blue-100', 'text-blue-800');
        activeBtn.classList.add('bg-blue-500', 'text-white');
        
        const filteredStudents = allStudents.filter(student => student.yearLevel === yearLevel);
        displayStudents(filteredStudents);
    }
}

function showAllYears() {
    const tableContainer = document.getElementById('studentTableContainer');
    const buttons = ['btn1st', 'btn2nd', 'btn3rd', 'btn4th', 'btnAll'];
    
    buttons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        btn.classList.remove('bg-blue-500', 'text-white', 'bg-gray-500');
        if (btnId === 'btnAll') {
            btn.classList.add('bg-gray-500', 'text-white');
        } else {
            btn.classList.add('bg-blue-100', 'text-blue-800');
        }
    });
    
    tableContainer.classList.remove('hidden');
    isTableHidden = false;
    currentYearFilter = null;
    displayStudents(allStudents);
}

function openEditAddressModal() {
    document.getElementById('addressModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    document.getElementById('addressModal').setAttribute('data-edit-mode', 'true');
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(event) {
    const dropdowns = ['regionDropdown', 'provinceDropdown', 'municipalityDropdown', 'barangayDropdown'];
    const buttons = ['toggleRegionDropdown', 'toggleProvinceDropdown', 'toggleMunicipalityDropdown', 'toggleBarangayDropdown'];
    
    dropdowns.forEach((dropdownId, index) => {
        const dropdown = document.getElementById(dropdownId);
        const isClickOnButton = event.target.closest(`button[onclick="${buttons[index]}()"]`);
        const isClickInDropdown = event.target.closest(`#${dropdownId}`);
        
        if (!isClickOnButton && !isClickInDropdown) {
            dropdown.classList.add('hidden');
        }
    });
});

// Subject form submission event listener
document.addEventListener('DOMContentLoaded', function() {
    const addSubjectForm = document.getElementById('addSubjectForm');
    if (addSubjectForm) {
        addSubjectForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const subject = {
                code: document.getElementById('subjectCode').value,
                title: document.getElementById('subjectTitle').value,
                units: parseInt(document.getElementById('subjectUnits').value),
                semester: document.getElementById('subjectSemester').value,
                yearLevel: document.getElementById('subjectYearLevel').value,
                prerequisites: document.getElementById('subjectPrerequisites').value,
                description: document.getElementById('subjectDescription').value
            };

            try {
                // For now, we'll use localStorage until backend is ready
                let subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
                subject.id = Date.now().toString(); // Simple ID generation
                subjects.push(subject);
                localStorage.setItem('subjects', JSON.stringify(subjects));
                
                // Show success message
                alert(`Subject "${subject.code} - ${subject.title}" added successfully!`);
                
                // Close modal and reload subjects
                closeAddSubjectModal();
                loadSubjects();
                
            } catch (error) {
                alert('Error adding subject: ' + error.message);
            }
        });
    }
});