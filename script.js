/**
 * AGMSC Classroom Selection Tool
 * Interactive classroom management system
 */

// Global state management
let rooms = [];
let courses = [];
let currentConflict = null;
let attendanceBase = '2024'; // Default to 2024 Max Attendance
let roomSortColumn = null;
let roomSortDirection = 'asc';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Load existing data (don't clear it!)
    loadData();
    migrateCourseData();
    initializeEventListeners();
    renderAll();
    
    // Only save if there's no existing data
    if (!localStorage.getItem('agmsc_rooms') || !localStorage.getItem('agmsc_courses')) {
        saveData();
    }
});

/**
 * Global variables for dynamic year columns
 */
let selectedYear1 = '2023';
let selectedYear2 = '2024';

/**
 * Data persistence using localStorage
 */
function saveData() {
    try {
        // Get current AGMSC year if element exists
        const agmscYearElement = document.getElementById('agmscYear');
        const agmscYear = agmscYearElement ? agmscYearElement.value : new Date().getFullYear();
        
        // Save all data including current UI states
        localStorage.setItem('agmsc_rooms', JSON.stringify(rooms));
        localStorage.setItem('agmsc_courses', JSON.stringify(courses));
        localStorage.setItem('agmsc_attendanceBase', attendanceBase);
        localStorage.setItem('agmsc_selectedYear1', selectedYear1);
        localStorage.setItem('agmsc_selectedYear2', selectedYear2);
        localStorage.setItem('agmsc_agmscYear', agmscYear);
        localStorage.setItem('agmsc_roomSortColumn', roomSortColumn || '');
        localStorage.setItem('agmsc_roomSortDirection', roomSortDirection || 'asc');
        
        console.log('Data saved successfully'); // Debug log
    } catch (error) {
        console.error('Error saving data:', error); // Debug log
        showToast('Error saving data: ' + error.message, 'error');
    }
}

function loadData() {
    try {
        const savedRooms = localStorage.getItem('agmsc_rooms');
        const savedCourses = localStorage.getItem('agmsc_courses');
        
        if (savedRooms) {
            rooms = JSON.parse(savedRooms);
            // Ensure all rooms have required properties for auto manage
            migrateCourseData(); // This also migrates room data
        } else {
            // Initialize with default AGMSC data if no saved data exists
            rooms = getDefaultRooms();
        }
        
        if (savedCourses) {
            courses = JSON.parse(savedCourses);
            // Ensure all courses have the required attendance properties
            migrateCourseData();
        } else {
            // Initialize with default AGMSC data if no saved data exists
            courses = getDefaultCourses();
        }
        
        // Load attendance base preference
        const savedAttendanceBase = localStorage.getItem('agmsc_attendanceBase');
        if (savedAttendanceBase) {
            attendanceBase = savedAttendanceBase;
            // Update dropdown selection after DOM is loaded
            setTimeout(() => {
                const dropdown = document.getElementById('attendanceBaseSelect');
                if (dropdown) {
                    dropdown.value = attendanceBase;
                }
            }, 100);
        }
        
        // Sync room assignments
        syncRoomAssignments();
        
        // Load additional saved states
        const savedYear1 = localStorage.getItem('agmsc_selectedYear1');
        if (savedYear1) selectedYear1 = savedYear1;
        
        const savedYear2 = localStorage.getItem('agmsc_selectedYear2');
        if (savedYear2) selectedYear2 = savedYear2;
        
        const savedAGMSCYear = localStorage.getItem('agmsc_agmscYear');
        const savedRoomSort = localStorage.getItem('agmsc_roomSortColumn');
        const savedSortDirection = localStorage.getItem('agmsc_roomSortDirection');
        
        if (savedRoomSort) roomSortColumn = savedRoomSort;
        if (savedSortDirection) roomSortDirection = savedSortDirection;
        
        // Restore AGMSC year dropdown after DOM loads
        if (savedAGMSCYear) {
            setTimeout(() => {
                const agmscYearElement = document.getElementById('agmscYear');
                if (agmscYearElement) {
                    agmscYearElement.value = savedAGMSCYear;
                }
            }, 100);
        }
        
        console.log('Data loaded successfully'); // Debug log
    } catch (error) {
        console.error('Error loading data:', error); // Debug log
        showToast('Error loading data: ' + error.message, 'error');
        rooms = getDefaultRooms();
        courses = getDefaultCourses();
        syncRoomAssignments();
    }
}

function getDefaultRooms() {
    return [
        {id: generateId(), name: "Hall 1", building: "UPMC", seats: 115, seatType: "Chairs", available: true, rmuStatus: "Approved", assignedTo: null, normalUsage: "lecture", autoManage: true},
        {id: generateId(), name: "Hall 2", building: "UPMC", seats: 60, seatType: "Chairs", available: true, rmuStatus: "Approved", assignedTo: null, normalUsage: "lecture", autoManage: true},
        {id: generateId(), name: "Hall 5", building: "UPMC", seats: 200, seatType: "Chairs", available: true, rmuStatus: "Approved", assignedTo: null},
        {id: generateId(), name: "Hall 6", building: "UPMC", seats: 50, seatType: "Chairs", available: true, rmuStatus: "Approved", assignedTo: null},
        {id: generateId(), name: "11", building: "Scaife", seats: 47, seatType: "Tablet desks", available: true, rmuStatus: "Approved", assignedTo: null},
        {id: generateId(), name: "141", building: "John Jay", seats: 40, seatType: "Tables", available: true, rmuStatus: "Approved", assignedTo: null},
        {id: generateId(), name: "142", building: "John Jay", seats: 40, seatType: "Tables", available: true, rmuStatus: "Approved", assignedTo: null},
        {id: generateId(), name: "143", building: "John Jay", seats: 40, seatType: "Tables", available: true, rmuStatus: "Approved", assignedTo: null},
        {id: generateId(), name: "263", building: "John Jay", seats: 40, seatType: "Tables", available: true, rmuStatus: "Approved", assignedTo: null},
        {id: generateId(), name: "264", building: "John Jay", seats: 40, seatType: "Tables", available: true, rmuStatus: "Approved", assignedTo: null},
        {id: generateId(), name: "PH-304", building: "Patrick Henry", seats: 32, seatType: "Tables", available: true, rmuStatus: "Approved", assignedTo: null},
        {id: generateId(), name: "PH-306", building: "Patrick Henry", seats: 32, seatType: "Tables", available: true, rmuStatus: "Approved", assignedTo: null},
        {id: generateId(), name: "Hopwood Hall", building: "Patrick Henry", seats: 138, seatType: "Tablet Desks", available: true, rmuStatus: "Approved", assignedTo: null},
        {id: generateId(), name: "Auditorium", building: "School of Business", seats: 200, seatType: "Chairs", available: true, rmuStatus: "Approved", assignedTo: null},
        {id: generateId(), name: "102", building: "Hale", seats: 30, seatType: "Tables", available: true, rmuStatus: "Approved", assignedTo: null},
        {id: generateId(), name: "104", building: "Hale", seats: 40, seatType: "Tables", available: true, rmuStatus: "Approved", assignedTo: null},
        {id: generateId(), name: "105", building: "Hale", seats: 40, seatType: "Tables", available: true, rmuStatus: "Approved", assignedTo: null},
        {id: generateId(), name: "106", building: "Hale", seats: 30, seatType: "Tables", available: true, rmuStatus: "Approved", assignedTo: null},
        {id: generateId(), name: "201", building: "Hale", seats: 36, seatType: "Tablet desks", available: true, rmuStatus: "Approved", assignedTo: null},
        {id: generateId(), name: "202", building: "Hale", seats: 30, seatType: "PC Lab Tables", available: true, rmuStatus: "Approved", assignedTo: null},
        {id: generateId(), name: "203", building: "Hale", seats: 58, seatType: "Tables", available: true, rmuStatus: "Approved", assignedTo: null},
        {id: generateId(), name: "204", building: "Hale", seats: 60, seatType: "Tables", available: true, rmuStatus: "Approved", assignedTo: null},
        {id: generateId(), name: "209", building: "Hale", seats: 52, seatType: "Tables", available: true, rmuStatus: "Approved", assignedTo: null},
        {id: generateId(), name: "301", building: "Hale", seats: 63, seatType: "Tables", available: true, rmuStatus: "Approved", assignedTo: null},
        {id: generateId(), name: "302", building: "Hale", seats: 42, seatType: "Tables", available: true, rmuStatus: "Approved", assignedTo: null},
        {id: generateId(), name: "303", building: "Hale", seats: 40, seatType: "Tables", available: true, rmuStatus: "Approved", assignedTo: null},
        {id: generateId(), name: "304", building: "Hale", seats: 32, seatType: "PC Lab Tables", available: true, rmuStatus: "Approved", assignedTo: null},
        {id: generateId(), name: "305", building: "Hale", seats: 0, seatType: "Tables", available: true, rmuStatus: "Approved", assignedTo: null},
        {id: generateId(), name: "306", building: "Hale", seats: 32, seatType: "PC Lab Tables", available: true, rmuStatus: "Approved", assignedTo: null},
        {id: generateId(), name: "307", building: "Hale", seats: 49, seatType: "Tables", available: true, rmuStatus: "Approved", assignedTo: null},
        {id: generateId(), name: "309", building: "Hale", seats: 49, seatType: "Tables", available: true, rmuStatus: "Approved", assignedTo: null},
        {id: generateId(), name: "310", building: "Hale", seats: 49, seatType: "Tables", available: true, rmuStatus: "Approved", assignedTo: null},
        {id: generateId(), name: "110", building: "Wheatley", seats: 39, seatType: "Tablet desks", available: true, rmuStatus: "Approved", assignedTo: null},
        {id: generateId(), name: "111", building: "Wheatley", seats: 30, seatType: "Tables", available: true, rmuStatus: "Approved", assignedTo: null},
        {id: generateId(), name: "112", building: "Wheatley", seats: 32, seatType: "Tables", available: true, rmuStatus: "Approved", assignedTo: null},
        {id: generateId(), name: "113", building: "Wheatley", seats: 30, seatType: "Tables", available: true, rmuStatus: "Approved", assignedTo: null},
        {id: generateId(), name: "114", building: "Wheatley", seats: 28, seatType: "Tables", available: true, rmuStatus: "Approved", assignedTo: null},
        {id: generateId(), name: "X", building: "UPMC", seats: 30, seatType: "Table Set up", available: true, rmuStatus: "Approved", assignedTo: null},
        {id: generateId(), name: "Lower Parking", building: "UPMC", seats: 0, seatType: "-", available: true, rmuStatus: "Approved", assignedTo: null},
        {id: generateId(), name: "Exc Boardroom 1", building: "UPMC", seats: 0, seatType: "-", available: true, rmuStatus: "Approved", assignedTo: null}
    ];
}

function getDefaultCourses() {
    return [
        // Lectures with complete 2023 and 2024 attendance data
        {id: generateId(), topic: "Fundamentals of Measurement & Regulation", type: "Lecture", expectedAttendance: 90, assignedRoom: "Hall 1", maxAttendance2023: 62, maxAttendance2024: 90, avgAttendance: 76, previousRoom: "Hall 1"},
        {id: generateId(), topic: "Basics of Measurement & Pressure Control", type: "Lecture", expectedAttendance: 90, assignedRoom: "Hall 5", maxAttendance2023: 58, maxAttendance2024: 90, avgAttendance: 74, previousRoom: "Hall 5"},
        {id: generateId(), topic: "Advanced Metering-Low Volume", type: "Lecture", expectedAttendance: 53, assignedRoom: "11", maxAttendance2023: 41, maxAttendance2024: 53, avgAttendance: 47, previousRoom: "11"},
        {id: generateId(), topic: "Advanced Metering-High Volume", type: "Lecture", expectedAttendance: 40, assignedRoom: "142", maxAttendance2023: 32, maxAttendance2024: 40, avgAttendance: 36, previousRoom: "142"},
        {id: generateId(), topic: "Pressure Control", type: "Lecture", expectedAttendance: 89, assignedRoom: "Hall 2", maxAttendance2023: 89, maxAttendance2024: 89, avgAttendance: 89, previousRoom: "Hall 2"},
        {id: generateId(), topic: "Instrumentation & Automation", type: "Lecture", expectedAttendance: 31, assignedRoom: "263", maxAttendance2023: 33, maxAttendance2024: 31, avgAttendance: 32, previousRoom: "263"},
        {id: generateId(), topic: "General Topics", type: "Lecture", expectedAttendance: 53, assignedRoom: "264", maxAttendance2023: 49, maxAttendance2024: 53, avgAttendance: 51, previousRoom: "264"},
        {id: generateId(), topic: "Production & Storage", type: "Lecture", expectedAttendance: 36, assignedRoom: "PH-304", maxAttendance2023: 40, maxAttendance2024: 36, avgAttendance: 38, previousRoom: "PH-304"},
        {id: generateId(), topic: "Gas Quality", type: "Lecture", expectedAttendance: 35, assignedRoom: "PH-306", maxAttendance2023: 31, maxAttendance2024: 35, avgAttendance: 33, previousRoom: "PH-306"},
        {id: generateId(), topic: "Communications & SCADA", type: "Lecture", expectedAttendance: 42, assignedRoom: "Hopwood Hall", maxAttendance2023: 32, maxAttendance2024: 42, avgAttendance: 37, previousRoom: "Hopwood Hall"},
        {id: generateId(), topic: "Next-Generation Gas Sources", type: "Lecture", expectedAttendance: 200, assignedRoom: "Auditorium", maxAttendance2023: 200, maxAttendance2024: 200, avgAttendance: 200, previousRoom: "Auditorium"},
        {id: generateId(), topic: "Odorization", type: "Lecture", expectedAttendance: 37, assignedRoom: "Hall 6", maxAttendance2023: 37, maxAttendance2024: 37, avgAttendance: 37, previousRoom: "Hall 6"},
        {id: generateId(), topic: "Current Industry Topics", type: "Lecture", expectedAttendance: 42, assignedRoom: "143", maxAttendance2023: 38, maxAttendance2024: 42, avgAttendance: 40, previousRoom: "143"},
        {id: generateId(), topic: "NGL/Wet Gas", type: "Lecture", expectedAttendance: 23, assignedRoom: "141", maxAttendance2023: 23, maxAttendance2024: 23, avgAttendance: 23, previousRoom: "141"},

        // Hands-On
        {id: generateId(), topic: "Lab 1", type: "Hands-On", expectedAttendance: 27, assignedRoom: "202", maxAttendance2023: 30, maxAttendance2024: 27, avgAttendance: 30, previousRoom: "202"},
        {id: generateId(), topic: "Lab 2", type: "Hands-On", expectedAttendance: 21, assignedRoom: "306", maxAttendance2023: 45, maxAttendance2024: 21, avgAttendance: 45, previousRoom: "306"},
        {id: generateId(), topic: "Lab 3", type: "Hands-On", expectedAttendance: 32, assignedRoom: "304", maxAttendance2023: 20, maxAttendance2024: 32, avgAttendance: 20, previousRoom: "304"},
        {id: generateId(), topic: "Demo 1", type: "Hands-On", expectedAttendance: 27, assignedRoom: "110", maxAttendance2023: 27, maxAttendance2024: 27, avgAttendance: 27, previousRoom: "110"},
        {id: generateId(), topic: "Demo 2", type: "Hands-On", expectedAttendance: 20, assignedRoom: "201", maxAttendance2023: 29, maxAttendance2024: 20, avgAttendance: 29, previousRoom: "201"},
        {id: generateId(), topic: "Demo 3", type: "Hands-On", expectedAttendance: 36, assignedRoom: "105", maxAttendance2023: 27, maxAttendance2024: 36, avgAttendance: 27, previousRoom: "105"},
        {id: generateId(), topic: "Demo 4", type: "Hands-On", expectedAttendance: 26, assignedRoom: "112", maxAttendance2023: 26, maxAttendance2024: 26, avgAttendance: 26, previousRoom: "112"},
        {id: generateId(), topic: "Demo 5", type: "Hands-On", expectedAttendance: 15, assignedRoom: "114", maxAttendance2023: 15, maxAttendance2024: 15, avgAttendance: 15, previousRoom: "114"},
        {id: generateId(), topic: "Demo 6", type: "Hands-On", expectedAttendance: 20, assignedRoom: "X", maxAttendance2023: 24, maxAttendance2024: 20, avgAttendance: 24, previousRoom: "X"},
        {id: generateId(), topic: "Hands 1", type: "Hands-On", expectedAttendance: 52, assignedRoom: "301", maxAttendance2023: 55, maxAttendance2024: 52, avgAttendance: 55, previousRoom: "301"},
        {id: generateId(), topic: "Hands 2", type: "Hands-On", expectedAttendance: 27, assignedRoom: "310", maxAttendance2023: 51, maxAttendance2024: 27, avgAttendance: 51, previousRoom: "310"},
        {id: generateId(), topic: "Hands 3", type: "Hands-On", expectedAttendance: 39, assignedRoom: "209", maxAttendance2023: 35, maxAttendance2024: 39, avgAttendance: 35, previousRoom: "209"},
        {id: generateId(), topic: "Hands 4", type: "Hands-On", expectedAttendance: 29, assignedRoom: "113", maxAttendance2023: 29, maxAttendance2024: 29, avgAttendance: 29, previousRoom: "113"},
        {id: generateId(), topic: "Hands 5", type: "Hands-On", expectedAttendance: 42, assignedRoom: "309", maxAttendance2023: 46, maxAttendance2024: 42, avgAttendance: 46, previousRoom: "309"},
        {id: generateId(), topic: "Hands 6", type: "Hands-On", expectedAttendance: 32, assignedRoom: "303", maxAttendance2023: 27, maxAttendance2024: 32, avgAttendance: 27, previousRoom: "303"},
        {id: generateId(), topic: "Hands 7", type: "Hands-On", expectedAttendance: 8, assignedRoom: "106", maxAttendance2023: 14, maxAttendance2024: 8, avgAttendance: 14, previousRoom: "106"},
        {id: generateId(), topic: "Hands 8", type: "Hands-On", expectedAttendance: 40, assignedRoom: "307", maxAttendance2023: 51, maxAttendance2024: 40, avgAttendance: 51, previousRoom: "307"},
        {id: generateId(), topic: "Hands 9", type: "Hands-On", expectedAttendance: 19, assignedRoom: "111", maxAttendance2023: 19, maxAttendance2024: 19, avgAttendance: 19, previousRoom: "111"},
        {id: generateId(), topic: "Hands 10", type: "Hands-On", expectedAttendance: 34, assignedRoom: "104", maxAttendance2023: 30, maxAttendance2024: 34, avgAttendance: 30, previousRoom: "104"},
        {id: generateId(), topic: "Hands 11", type: "Hands-On", expectedAttendance: 56, assignedRoom: "203", maxAttendance2023: 60, maxAttendance2024: 56, avgAttendance: 60, previousRoom: "203"},
        {id: generateId(), topic: "Hands 12", type: "Hands-On", expectedAttendance: 24, assignedRoom: "204", maxAttendance2023: 24, maxAttendance2024: 24, avgAttendance: 24, previousRoom: "204"},
        {id: generateId(), topic: "Hands 13", type: "Hands-On", expectedAttendance: 40, assignedRoom: "302", maxAttendance2023: 52, maxAttendance2024: 40, avgAttendance: 52, previousRoom: "302"},
        {id: generateId(), topic: "Hands 14", type: "Hands-On", expectedAttendance: 37, assignedRoom: "102", maxAttendance2023: 23, maxAttendance2024: 37, avgAttendance: 23, previousRoom: "102"},
        {id: generateId(), topic: "Outdoor Exhibit", type: "Hands-On", expectedAttendance: 30, assignedRoom: "Lower Parking", maxAttendance2023: 68, maxAttendance2024: 30, avgAttendance: 68, previousRoom: "Lower Parking"},
        {id: generateId(), topic: "Instructor Lounge (Hale)", type: "Hands-On", expectedAttendance: 34, assignedRoom: "305", maxAttendance2023: 34, maxAttendance2024: 34, avgAttendance: 34, previousRoom: "305"},
        {id: generateId(), topic: "Instructor Lounge (UPMC)", type: "Hands-On", expectedAttendance: 0, assignedRoom: "Exc Boardroom 1", maxAttendance2023: 0, maxAttendance2024: 0, avgAttendance: 0, previousRoom: "Exc Boardroom 1"}
    ];
}

function syncRoomAssignments() {
    // Clear all room assignments first (but preserve availability state)
    rooms.forEach(room => {
        room.assignedTo = null;
        // DON'T change room.available here - preserve user's checkbox state
    });
    
    // Set room assignments based on course assignments
    courses.forEach(course => {
        if (course.assignedRoom) {
            const room = rooms.find(r => r.name === course.assignedRoom);
            if (room) {
                room.assignedTo = course.topic;
                // DON'T automatically change availability - let user control this
            }
        }
    });
}

/**
 * Event listeners setup
 */
function initializeEventListeners() {
    // Populate year dropdowns with years 2025-2050
    populateYearDropdowns();
    
    // Swap course selection listeners
    document.getElementById('swapCourse1').addEventListener('change', updateSwapPreview);
    document.getElementById('swapCourse2').addEventListener('change', updateSwapPreview);
    
    // Modal close on outside click
    document.getElementById('conflictModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeConflictModal();
        }
    });
    
    // AGMSC Year dropdown listener
    const agmscYearSelect = document.getElementById('agmscYear');
    if (agmscYearSelect) {
        agmscYearSelect.addEventListener('change', function() {
            saveData(); // Save immediately when changed
        });
    }
}

function populateYearDropdowns() {
    const year1Select = document.getElementById('year1Dropdown');
    const year2Select = document.getElementById('year2Dropdown');
    
    if (!year1Select || !year2Select) return; // Elements don't exist in current HTML structure
    
    // Clear existing options
    year1Select.innerHTML = '';
    year2Select.innerHTML = '';
    
    // Populate with years 2023-2050
    for (let year = 2023; year <= 2050; year++) {
        const option1 = document.createElement('option');
        option1.value = year;
        option1.textContent = year;
        year1Select.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = year;
        option2.textContent = year;
        year2Select.appendChild(option2);
    }
    
    // Set default values
    year1Select.value = '2023';
    year2Select.value = '2024';
}

/**
 * Room management functions
 */
function addNewRoom() {
    const newRoom = {
        id: generateId(),
        name: 'New Room',
        building: 'Building',
        seats: 30,
        seatType: 'Tables',
        available: true,
        rmuStatus: 'Approved',
        normalUsage: '',
        autoManage: true,
        assignedTo: null
    };
    
    rooms.push(newRoom);
    saveData();
    renderRoomsTable();
    renderAssignments();
    updateSummary();
    showToast('New room added successfully', 'success');
}

function deleteRoom(roomId) {
    if (confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
        const room = rooms.find(r => r.id === roomId);
        if (room && room.assignedTo) {
            // Unassign any courses from this room
            courses.forEach(course => {
                if (course.assignedRoom === room.name) {
                    course.assignedRoom = null;
                }
            });
        }
        
        rooms = rooms.filter(r => r.id !== roomId);
        saveData();
        renderAll();
        showToast('Room deleted successfully', 'success');
    }
}

function updateRoom(roomId, field, value) {
    const room = rooms.find(r => r.id === roomId);
    if (room) {
        if (field === 'seats') {
            value = parseInt(value) || 0;
        } else if (field === 'available') {
            // Ensure boolean conversion and handle assignments
            value = Boolean(value);
            if (!value && room.assignedTo) {
                // If marking as unavailable but has assignment, clear assignment
                courses.forEach(course => {
                    if (course.assignedRoom === room.name) {
                        course.assignedRoom = null;
                    }
                });
                room.assignedTo = null;
                showToast(`Room ${room.name} marked unavailable - assignment cleared`, 'warning');
            } else if (value && !room.assignedTo) {
                showToast(`Room ${room.name} marked available`, 'success');
            }
        } else if (field === 'rmuStatus') {
            const previousStatus = room.rmuStatus;
            
            // When RMU status changes to "Denied", unassign any courses and mark unavailable
            if (value === 'Denied') {
                if (room.assignedTo) {
                    courses.forEach(course => {
                        if (course.assignedRoom === room.name) {
                            course.assignedRoom = null;
                        }
                    });
                    room.assignedTo = null;
                }
                room.available = false; // Automatically mark as unavailable
                showToast(`Room ${room.name} marked unavailable due to RMU denial`, 'warning');
            } else if (value === 'Approved' && previousStatus === 'Denied') {
                // When RMU status changes back to "Approved" from "Denied", keep unavailable until manually changed
                // Don't automatically make it available - let user decide
                showToast(`Room ${room.name} RMU status approved - you can now manually mark it available if needed`, 'info');
            }
        } else if (field === 'normalUsage') {
            // Ensure radio button selections are saved
            room.normalUsage = value;
        }
        
        // Update the field
        room[field] = value;
        
        // CRITICAL: Save immediately after any change
        saveData();
        
        // Re-render everything to reflect changes
        renderAll();
        
        // Debug logging to confirm save
        console.log(`Updated room ${room.name}, field: ${field}, value: ${value}`);
    }
}

function checkAllAvailable() {
    rooms.forEach(room => {
        room.available = true;
    });
    
    // Save the changes immediately
    saveData();
    renderRoomsTable();
    renderAssignments();
    updateSummary();
    showToast('All rooms marked as available', 'success');
}

function uncheckAllAvailable() {
    rooms.forEach(room => {
        room.available = false;
        if (room.assignedTo) {
            // Clear assignments from unavailable rooms
            courses.forEach(course => {
                if (course.assignedRoom === room.name) {
                    course.assignedRoom = null;
                }
            });
            room.assignedTo = null;
        }
    });
    
    // Save the changes immediately
    saveData();
    renderAll();
    showToast('All rooms marked as unavailable - assignments cleared', 'success');
}



/**
 * Course management functions
 */
function addNewCourse() {
    const newCourse = {
        id: generateId(),
        topic: 'New Course Topic',
        type: 'Lecture',
        expectedAttendance: 25,
        assignedRoom: null,
        maxAttendance2023: null,
        maxAttendance2024: null,
        avgAttendance: null,
        previousRoom: null
    };
    
    courses.push(newCourse);
    saveData();
    renderDataTable();
    renderAssignments();
    updateSummary();
    showToast('New course added successfully', 'success');
}

function deleteCourse(courseId) {
    if (confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
        const course = courses.find(c => c.id === courseId);
        if (course && course.assignedRoom) {
            // Free up the room
            const room = rooms.find(r => r.name === course.assignedRoom);
            if (room) {
                room.assignedTo = null;
            }
        }
        
        courses = courses.filter(c => c.id !== courseId);
        saveData();
        renderAll();
        showToast('Course deleted successfully', 'success');
    }
}

function updateCourse(courseId, field, value) {
    const course = courses.find(c => c.id === courseId);
    if (course) {
        if (field === 'expectedAttendance' || field === 'maxAttendance2023' || field === 'maxAttendance2024' || field === 'avgAttendance') {
            value = parseInt(value) || 0;
            if (value === 0 && (field === 'maxAttendance2023' || field === 'maxAttendance2024' || field === 'avgAttendance')) {
                value = null; // Allow null for empty historical data
            }
        }
        
        course[field] = value;
        saveData();
        renderAll();
    }
}

// Add this function to handle attendance updates and save immediately
function updateCourseAttendance(courseId, year, value) {
    const course = courses.find(c => c.id === courseId);
    if (course) {
        if (!course.attendanceByYear) {
            course.attendanceByYear = {};
        }
        
        const numValue = parseInt(value) || null;
        course.attendanceByYear[year] = numValue;
        
        // Recalculate average
        course.avgAttendance = calculateAverageAttendance(course);
        
        // Save immediately after any change
        saveData();
        renderAll();
    }
}

/**
 * Room assignment functions
 */
function assignRoom(courseId, roomName) {
    const course = courses.find(c => c.id === courseId);
    const room = rooms.find(r => r.name === roomName && r.available);
    
    if (!course || !room) return;
    
    // Check if room is already assigned
    if (room.assignedTo && room.assignedTo !== course.topic) {
        showConflictModal(course, room);
        return;
    }
    
    // Clear previous assignment
    if (course.assignedRoom) {
        const prevRoom = rooms.find(r => r.name === course.assignedRoom);
        if (prevRoom) {
            prevRoom.assignedTo = null;
        }
    }
    
    // Make new assignment
    course.assignedRoom = roomName;
    room.assignedTo = course.topic;
    
    saveData();
    renderAll();
    showToast(`${course.topic} assigned to ${roomName}`, 'success');
}

function unassignRoom(courseId) {
    const course = courses.find(c => c.id === courseId);
    if (course && course.assignedRoom) {
        const room = rooms.find(r => r.name === course.assignedRoom);
        if (room) {
            room.assignedTo = null;
        }
        course.assignedRoom = null;
        
        saveData();
        renderAll();
        showToast(`Room unassigned from ${course.topic}`, 'success');
    }
}

/**
 * Room swap functionality
 */
function updateSwapPreview() {
    const course1Id = document.getElementById('swapCourse1').value;
    const course2Id = document.getElementById('swapCourse2').value;
    const swapButton = document.getElementById('swapButton');
    const swapPreview = document.getElementById('swapPreview');
    const swapDetails = document.getElementById('swapDetails');
    
    if (course1Id && course2Id && course1Id !== course2Id) {
        const course1 = courses.find(c => c.id === course1Id);
        const course2 = courses.find(c => c.id === course2Id);
        
        if (course1?.assignedRoom && course2?.assignedRoom) {
            swapButton.disabled = false;
            swapPreview.style.display = 'block';
            
            swapDetails.innerHTML = `
                <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 20px; align-items: center;">
                    <div style="text-align: center; padding: 15px; background-color: hsl(210, 40%, 98%); border-radius: 6px;">
                        <strong>${course1.topic}</strong><br>
                        <small>Current: ${course1.assignedRoom}</small><br>
                        <small style="color: hsl(142, 71%, 45%);">→ Will get: ${course2.assignedRoom}</small>
                    </div>
                    <div style="font-size: 1.5em; color: hsl(210, 79%, 46%);">
                        <i class="fas fa-exchange-alt"></i>
                    </div>
                    <div style="text-align: center; padding: 15px, 0, 15px, 0; background-color: hsl(210, 40%, 98%); border-radius: 6px;">
                        <strong>${course2.topic}</strong><br>
                        <small>Current: ${course2.assignedRoom}</small><br>
                        <small style="color: hsl(142, 71%, 45%);">→ Will get: ${course1.assignedRoom}</small>
                    </div>
                </div>
            `;
        } else {
            swapButton.disabled = true;
            swapPreview.style.display = 'none';
        }
    } else {
        swapButton.disabled = true;
        swapPreview.style.display = 'none';
    }
}

function performRoomSwap() {
    const course1Id = document.getElementById('swapCourse1').value;
    const course2Id = document.getElementById('swapCourse2').value;
    
    const course1 = courses.find(c => c.id === course1Id);
    const course2 = courses.find(c => c.id === course2Id);
    
    if (!course1?.assignedRoom || !course2?.assignedRoom) {
        showToast('Both courses must have room assignments to swap', 'error');
        return;
    }
    
    const room1 = rooms.find(r => r.name === course1.assignedRoom);
    const room2 = rooms.find(r => r.name === course2.assignedRoom);
    
    // Perform the swap
    const tempRoom = course1.assignedRoom;
    course1.assignedRoom = course2.assignedRoom;
    course2.assignedRoom = tempRoom;
    
    // Update room assignments
    if (room1) room1.assignedTo = course2.topic;
    if (room2) room2.assignedTo = course1.topic;
    
    // Reset swap form
    document.getElementById('swapCourse1').value = '';
    document.getElementById('swapCourse2').value = '';
    document.getElementById('swapPreview').style.display = 'none';
    document.getElementById('swapButton').disabled = true;
    
    saveData();
    renderAll();
    showToast('Room swap completed successfully', 'success');
}

/**
 * Conflict resolution
 */
function showConflictModal(course, room) {
    currentConflict = { course, room };
    const modal = document.getElementById('conflictModal');
    const details = document.getElementById('conflictDetails');
    
    details.innerHTML = `
        <p><strong>Conflict:</strong> Room "${room.name}" is already assigned to "${room.assignedTo}".</p>
        <p>You are trying to assign it to "${course.topic}".</p>
    `;
    
    modal.style.display = 'block';
}

function closeConflictModal() {
    const modal = document.getElementById('conflictModal');
    if (modal) {
        modal.style.display = 'none';
        modal.style.visibility = 'hidden';
    }
    currentConflict = null;
}

function forceAssignment() {
    if (!currentConflict) return;
    
    const { course, room } = currentConflict;
    
    // Find and unassign the previous course
    const prevCourse = courses.find(c => c.topic === room.assignedTo);
    if (prevCourse) {
        prevCourse.assignedRoom = null;
    }
    
    // Assign to new course
    course.assignedRoom = room.name;
    room.assignedTo = course.topic;
    
    closeConflictModal();
    saveData();
    renderAll();
    showToast(`Forced assignment: ${course.topic} assigned to ${room.name}`, 'warning');
}

function resolveConflict() {
    // For now, just close the modal - could implement more sophisticated resolution
    closeConflictModal();
    showToast('Assignment cancelled due to conflict', 'warning');
}

/**
 * Rendering functions
 */
function sortRooms(column) {
    // Reset all sort icons
    document.querySelectorAll('[id^="sort-"]').forEach(icon => {
        icon.className = 'fas fa-sort';
    });
    
    // Toggle sort direction if same column, otherwise default to ascending
    if (roomSortColumn === column) {
        roomSortDirection = roomSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        roomSortColumn = column;
        roomSortDirection = 'asc';
    }
    
    // Update the sort icon
    const sortIcon = document.getElementById(`sort-${column}`);
    if (sortIcon) {
        sortIcon.className = `fas fa-sort-${roomSortDirection === 'asc' ? 'up' : 'down'}`;
    }
    
    // Sort the rooms array
    rooms.sort((a, b) => {
        let valueA, valueB;
        
        switch (column) {
            case 'available':
                valueA = a.available ? 1 : 0;
                valueB = b.available ? 1 : 0;
                break;
            case 'rmuStatus':
                valueA = (a.rmuStatus || 'Approved').toLowerCase();
                valueB = (b.rmuStatus || 'Approved').toLowerCase();
                break;
            case 'name':
                valueA = a.name.toLowerCase();
                valueB = b.name.toLowerCase();
                break;
            case 'building':
                valueA = a.building.toLowerCase();
                valueB = b.building.toLowerCase();
                break;
            case 'seats':
                valueA = a.seats;
                valueB = b.seats;
                break;
            case 'seatType':
                valueA = a.seatType.toLowerCase();
                valueB = b.seatType.toLowerCase();
                break;
            case 'assigned':
                valueA = a.assignedTo ? a.assignedTo.toLowerCase() : '';
                valueB = b.assignedTo ? b.assignedTo.toLowerCase() : '';
                break;
            default:
                return 0;
        }
        
        if (valueA < valueB) return roomSortDirection === 'asc' ? -1 : 1;
        if (valueA > valueB) return roomSortDirection === 'asc' ? 1 : -1;
        return 0;
    });
    
    // Re-render the table
    renderRoomsTable();
    saveData();
}

function renderRoomsTable() {
    const tbody = document.getElementById('roomsTableBody');
    tbody.innerHTML = '';
    
    if (rooms.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center" style="padding: 40px; color: hsl(var(--text-secondary)); font-style: italic;">
                    <i class="fas fa-door-open" style="font-size: 2em; margin-bottom: 10px; display: block;"></i>
                    No rooms added yet. Click "Add New Room" to get started.
                </td>
            </tr>
        `;
        return;
    }
    
    rooms.forEach(room => {
        const row = document.createElement('tr');
        let rowClass = room.available ? (room.assignedTo ? 'assigned' : 'available') : 'unavailable';
        
        // Add RMU status styling
        if (room.rmuStatus === 'Denied') {
            rowClass += ' rmu-denied';
        } else if (room.rmuStatus === 'Pending') {
            rowClass += ' rmu-pending';
        } else if (room.rmuStatus === 'Conditional') {
            rowClass += ' rmu-conditional';
        }
        
        row.className = rowClass;
        
        const roomUsagePattern = getRoomUsagePattern(room.name);
        
        row.innerHTML = `
            <td>
                <input type="checkbox" ${room.available ? 'checked' : ''} 
                       onchange="updateRoom('${room.id}', 'available', this.checked)">
            </td>
            <td>
                <select onchange="updateRoom('${room.id}', 'rmuStatus', this.value)">
                    <option value="Approved" ${(room.rmuStatus || 'Approved') === 'Approved' ? 'selected' : ''}>Approved</option>
                    <option value="Denied" ${room.rmuStatus === 'Denied' ? 'selected' : ''}>Denied</option>
                    <option value="Pending" ${room.rmuStatus === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Conditional" ${room.rmuStatus === 'Conditional' ? 'selected' : ''}>Conditional</option>
                </select>
            </td>
            <td>
                <input type="text" value="${escapeHtml(room.name)}" 
                       onchange="updateRoom('${room.id}', 'name', this.value)">
            </td>
            <td>
                <input type="text" value="${escapeHtml(room.building)}" 
                       onchange="updateRoom('${room.id}', 'building', this.value)">
            </td>
            <td>
                <input type="number" value="${room.seats}" min="1" 
                       onchange="updateRoom('${room.id}', 'seats', this.value)">
            </td>
            <td>
                <select onchange="updateRoom('${room.id}', 'seatType', this.value)">
                    <option value="Chairs" ${room.seatType === 'Chairs' ? 'selected' : ''}>Chairs</option>
                    <option value="Tables" ${room.seatType === 'Tables' ? 'selected' : ''}>Tables</option>
                    <option value="Tablet desks" ${room.seatType === 'Tablet desks' ? 'selected' : ''}>Tablet desks</option>
                    <option value="PC Lab Tables" ${room.seatType === 'PC Lab Tables' ? 'selected' : ''}>PC Lab Tables</option>
                    <option value="Table Set up" ${room.seatType === 'Table Set up' ? 'selected' : ''}>Table Set up</option>
                    <option value="-" ${room.seatType === '-' ? 'selected' : ''}>-</option>
                </select>
            </td>
            <td>
                <div style="display: flex; flex-direction: column; gap: 3px; font-size: 12px;">
                    <label style="margin: 0; cursor: pointer;">
                        <input type="radio" name="usage_${room.id}" value="lecture" 
                               ${roomUsagePattern === 'lecture' ? 'checked' : ''}
                               onchange="updateRoom('${room.id}', 'normalUsage', this.value)" style="margin-right: 5px;">
                        Normally Lecture
                    </label>
                    <label style="margin: 0; cursor: pointer;">
                        <input type="radio" name="usage_${room.id}" value="hands-on" 
                               ${roomUsagePattern === 'hands-on' ? 'checked' : ''}
                               onchange="updateRoom('${room.id}', 'normalUsage', this.value)" style="margin-right: 5px;">
                        Normally Hands-On
                    </label>
                </div>
            </td>
            <td>${room.assignedTo ? escapeHtml(room.assignedTo) : '<em>Not assigned</em>'}</td>
            <td>
                <button class="btn btn-danger" onclick="deleteRoom('${room.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

function renderAssignments() {
    renderLectureAssignments();
    renderHandsOnAssignments();
    updateSwapDropdowns();
}

function renderLectureAssignments() {
    const container = document.getElementById('lectureAssignments');
    const lectures = courses.filter(c => c.type === 'Lecture');
    
    if (lectures.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: hsl(var(--text-secondary)); font-style: italic;">
                <i class="fas fa-chalkboard-teacher" style="font-size: 1.5em; margin-bottom: 10px; display: block;"></i>
                No lecture courses found. Add courses in the Data Table section.
            </div>
        `;
        return;
    }
    
    container.innerHTML = lectures.map(course => {
        const assignedRoom = rooms.find(r => r.name === course.assignedRoom);
        const capacityInfo = getCapacityInfo(course, assignedRoom);
        
        return `
            <div class="assignment-row">
                <div class="topic-info">
                    <strong>${escapeHtml(course.topic)}</strong><br>
                    <small>Expected: ${getEffectiveAttendance(course)} students</small>
                </div>
                <select class="room-select" onchange="assignRoom('${course.id}', this.value)">
                    <option value="">-- Select Room --</option>
                    ${getAvailableRoomsOptions(course.assignedRoom)}
                </select>
                <div class="capacity-info ${capacityInfo.class}">
                    ${capacityInfo.text}
                    ${course.assignedRoom ? `<br><button class="btn btn-danger" style="font-size: 12px; padding: 4px 8px; margin-top: 4px;" onclick="unassignRoom('${course.id}')"><i class="fas fa-times"></i></button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function renderHandsOnAssignments() {
    const container = document.getElementById('handsOnAssignments');
    const handsOn = courses.filter(c => c.type === 'Hands-On');
    
    if (handsOn.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: hsl(var(--text-secondary)); font-style: italic;">
                <i class="fas fa-hands" style="font-size: 1.5em; margin-bottom: 10px; display: block;"></i>
                No hands-on courses found. Add courses in the Data Table section.
            </div>
        `;
        return;
    }
    
    container.innerHTML = handsOn.map(course => {
        const assignedRoom = rooms.find(r => r.name === course.assignedRoom);
        const capacityInfo = getCapacityInfo(course, assignedRoom);
        
        return `
            <div class="assignment-row">
                <div class="topic-info">
                    <strong>${escapeHtml(course.topic)}</strong><br>
                    <small>Expected: ${getEffectiveAttendance(course)} students</small>
                </div>
                <select class="room-select" onchange="assignRoom('${course.id}', this.value)">
                    <option value="">-- Select Room --</option>
                    ${getAvailableRoomsOptions(course.assignedRoom)}
                </select>
                <div class="capacity-info ${capacityInfo.class}">
                    ${capacityInfo.text}
                    ${course.assignedRoom ? `<br><button class="btn btn-danger" style="font-size: 12px; padding: 4px 8px; margin-top: 4px;" onclick="unassignRoom('${course.id}')"><i class="fas fa-times"></i></button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function renderDataTable() {
    const tbody = document.getElementById('dataTableBody');
    tbody.innerHTML = '';
    
    if (courses.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center" style="padding: 40px; color: hsl(var(--text-secondary)); font-style: italic;">
                    <i class="fas fa-graduation-cap" style="font-size: 2em; margin-bottom: 10px; display: block;"></i>
                    No courses added yet. Click "Add New Course" to get started.
                </td>
            </tr>
        `;
        return;
    }
    
    courses.forEach(course => {
        const assignedRoom = rooms.find(r => r.name === course.assignedRoom);
        const capacityInfo = getCapacityInfo(course, assignedRoom);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td contenteditable="true" onblur="updateCourse('${course.id}', 'topic', this.textContent)">${escapeHtml(course.topic)}</td>
            <td>
                <select onchange="updateCourse('${course.id}', 'type', this.value)">
                    <option value="Lecture" ${course.type === 'Lecture' ? 'selected' : ''}>Lecture</option>
                    <option value="Hands-On" ${course.type === 'Hands-On' ? 'selected' : ''}>Hands-On</option>
                </select>
            </td>
            <td contenteditable="true" onblur="updateCourseAttendance('${course.id}', '${selectedYear1}', this.textContent)">${getAttendanceForYear(course, selectedYear1)}</td>
            <td contenteditable="true" onblur="updateCourseAttendance('${course.id}', '${selectedYear2}', this.textContent)">${getAttendanceForYear(course, selectedYear2)}</td>
            <td style="background-color: hsl(210, 40%, 98%); font-style: italic;">${calculateAverageAttendance(course)}</td>
            <td contenteditable="true" onblur="updateCourse('${course.id}', 'previousRoom', this.textContent)">${course.previousRoom || ''}</td>
            <td>${course.assignedRoom || '<em>Not assigned</em>'}</td>
            <td>${assignedRoom ? assignedRoom.seats : '<em>N/A</em>'}</td>
            <td class="${capacityInfo.class}">${capacityInfo.percentage}</td>
            <td>
                <span class="badge ${getStatusBadgeClass(course, assignedRoom)}">
                    ${getStatusText(course, assignedRoom)}
                </span>
            </td>
            <td>
                <button class="btn btn-danger" onclick="deleteCourse('${course.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

function updateSwapDropdowns() {
    const course1Select = document.getElementById('swapCourse1');
    const course2Select = document.getElementById('swapCourse2');
    
    const assignedCourses = courses.filter(c => c.assignedRoom);
    
    const options = '<option value="">-- Select Course --</option>' + 
                   assignedCourses.map(course => 
                       `<option value="${course.id}">${escapeHtml(course.topic)} (${course.assignedRoom})</option>`
                   ).join('');
    
    course1Select.innerHTML = options;
    course2Select.innerHTML = options;
}

/**
 * Year dropdown management functions
 */
function updateAttendanceColumn(columnNumber, newYear) {
    if (columnNumber === 1) {
        selectedYear1 = newYear;
    } else if (columnNumber === 2) {
        selectedYear2 = newYear;
    }
    
    // Update the data structure to handle dynamic years
    courses.forEach(course => {
        if (!course.attendanceByYear) {
            course.attendanceByYear = {};
            // Migrate existing data
            if (course.maxAttendance2023 !== undefined) {
                course.attendanceByYear['2023'] = course.maxAttendance2023;
            }
            if (course.maxAttendance2024 !== undefined) {
                course.attendanceByYear['2024'] = course.maxAttendance2024;
            }
        }
        
        // Recalculate average attendance based on new year selection
        course.avgAttendance = calculateAverageAttendance(course);
    });
    
    saveData();
    renderDataTable();
    renderAssignments();
    updateSummary();
    showToast(`Updated to show ${newYear} attendance data`, 'success');
}

function getAttendanceForYear(course, year) {
    // Ensure attendanceByYear exists
    if (!course.attendanceByYear) {
        course.attendanceByYear = {};
        // Migrate existing data
        if (course.maxAttendance2023 !== undefined) {
            course.attendanceByYear['2023'] = course.maxAttendance2023;
        }
        if (course.maxAttendance2024 !== undefined) {
            course.attendanceByYear['2024'] = course.maxAttendance2024;
        }
    }
    
    return course.attendanceByYear[year] || '';
}

function calculateAverageAttendance(course) {
    const year1Value = getAttendanceForYear(course, selectedYear1);
    const year2Value = getAttendanceForYear(course, selectedYear2);
    
    const values = [];
    if (year1Value && !isNaN(parseInt(year1Value))) {
        values.push(parseInt(year1Value));
    }
    if (year2Value && !isNaN(parseInt(year2Value))) {
        values.push(parseInt(year2Value));
    }
    
    if (values.length === 0) return '';
    
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.round(average);
}

function getRoomUsagePattern(roomName) {
    // Check if room has stored normal usage preference
    const room = rooms.find(r => r.name === roomName);
    if (room && room.normalUsage) {
        return room.normalUsage;
    }
    
    // Determine usage pattern based on current assignments
    const assignedCourses = courses.filter(course => course.assignedRoom === roomName);
    
    if (assignedCourses.length === 0) {
        return ''; // No pattern if no assignments
    }
    
    // Check if any assigned course should be lecture-oriented
    const lectureOrientedCourses = [
        'NGL/Wet Gas',
        'Advanced Metering-High Volume',
        'Current Industry Topics',
        'Instrumentation & Automation',
        'General Topics',
        'Production & Storage',
        'Gas Quality'
    ];
    
    // Check if any assigned course should be hands-on oriented
    const handsOnOrientedCourses = [
        'Demo 1',
        'Demo 2',
        'Demo 6',
        'Outdoor Exhibit'
    ];
    
    const hasLectureOrientedCourse = assignedCourses.some(course => 
        lectureOrientedCourses.includes(course.topic)
    );
    
    const hasHandsOnOrientedCourse = assignedCourses.some(course => 
        handsOnOrientedCourses.includes(course.topic)
    );
    
    if (hasLectureOrientedCourse) {
        return 'lecture';
    }
    
    if (hasHandsOnOrientedCourse) {
        return 'hands-on';
    }
    
    const lectureCount = assignedCourses.filter(course => course.type === 'Lecture').length;
    const handsOnCount = assignedCourses.filter(course => course.type === 'Hands-On').length;
    
    if (lectureCount > handsOnCount) {
        return 'lecture';
    } else if (handsOnCount > lectureCount) {
        return 'hands-on';
    }
    
    return 'lecture'; // Default to lecture if tied
}

function migrateCourseData() {
    courses.forEach(course => {
        if (!course.attendanceByYear) {
            course.attendanceByYear = {};
            // Migrate existing data
            if (course.maxAttendance2023 !== undefined) {
                course.attendanceByYear['2023'] = course.maxAttendance2023;
            }
            if (course.maxAttendance2024 !== undefined) {
                course.attendanceByYear['2024'] = course.maxAttendance2024;
            }
        }
        
        // Calculate average attendance based on current year selections
        course.avgAttendance = calculateAverageAttendance(course);
    });
    
    // Migrate room data to include normalUsage field with special handling
    rooms.forEach(room => {
        if (!room.normalUsage) {
            // Check if room is assigned to a lecture-oriented course
            const assignedCourse = courses.find(c => c.assignedRoom === room.name);
            const lectureOrientedCourses = [
                'NGL/Wet Gas',
                'Advanced Metering-High Volume',
                'Current Industry Topics',
                'Instrumentation & Automation',
                'General Topics',
                'Production & Storage',
                'Gas Quality'
            ];
            
            // Check if room is assigned to a hands-on oriented course
            const handsOnOrientedCourses = [
                'Demo 1',
                'Demo 2',
                'Demo 6',
                'Outdoor Exhibit'
            ];
            
            if (assignedCourse && lectureOrientedCourses.includes(assignedCourse.topic)) {
                room.normalUsage = "lecture";
            } else if (assignedCourse && handsOnOrientedCourses.includes(assignedCourse.topic)) {
                room.normalUsage = "hands-on";
            } else if (room.seatType === "Tables" || room.seatType === "PC Lab Tables") {
                // For rooms with tables but not assigned to specific courses, check if they're hands-on
                room.normalUsage = assignedCourse && assignedCourse.type === "Hands-On" ? "hands-on" : "lecture";
            } else {
                room.normalUsage = "lecture";
            }
        }
        // Remove autoManage property if it exists
        delete room.autoManage;
    });
}

/**
 * Utility functions
 */
function getAvailableRoomsOptions(currentAssignment) {
    return rooms
        .map(room => {
            const isCurrentlyAssigned = room.name === currentAssignment;
            const isAssignedToOther = room.assignedTo && !isCurrentlyAssigned;
            const isRmuDenied = room.rmuStatus === 'Denied';
            const isAvailable = room.available && room.rmuStatus !== 'Denied';
            const canSelect = isAvailable || isCurrentlyAssigned;
            
            let statusText = '';
            if (isRmuDenied) {
                statusText = ' - RMU DENIED';
            } else if (!room.available) {
                statusText = ' - UNAVAILABLE';
            } else if (isAssignedToOther) {
                statusText = ' - ASSIGNED';
            }
            
            const label = `${escapeHtml(room.building)} - ${escapeHtml(room.name)} (${room.seats} seats)${statusText}`;
            
            return `<option value="${escapeHtml(room.name)}" ${isCurrentlyAssigned ? 'selected' : ''} ${!canSelect ? 'disabled' : ''}>${label}</option>`;
        })
        .join('');
}

function getCapacityInfo(course, room) {
    if (!room) {
        return { class: '', text: 'No room assigned', percentage: 'N/A' };
    }
    
    const attendance = getEffectiveAttendance(course);
    const percentage = Math.round((attendance / room.seats) * 100);
    let className, text;
    
    if (percentage <= 89) {
        className = 'capacity-ok';
        text = `${percentage}% capacity`;
    } else if (percentage <= 100) {
        className = 'capacity-warning';
        text = `${percentage}% capacity`;
    } else {
        className = 'capacity-over';
        text = `${percentage}% over capacity`;
    }
    
    return { class: className, text, percentage: `${percentage}%` };
}

function getEffectiveAttendance(course) {
    switch (attendanceBase) {
        case '2023':
            return course.maxAttendance2023 || 0;
        case '2024':
            return course.maxAttendance2024 || 0;
        case 'average':
            return course.avgAttendance || 0;
        case 'highest':
            return Math.max(
                course.maxAttendance2023 || 0,
                course.maxAttendance2024 || 0,
                course.avgAttendance || 0
            );
        default:
            return course.maxAttendance2024 || 0;
    }
}

function updateAttendanceBase(newBase) {
    attendanceBase = newBase;
    
    // Update the header to show which data is being used for calculations
    const headerText = newBase === '2023' ? '(2023 Max)' : 
                      newBase === '2024' ? '(2024 Max)' : 
                      newBase === 'average' ? '(Average)' :
                      '(Highest All Time)';
    
    renderAll();
    saveData();
    
    const messageText = newBase === '2023' ? '2023 Max Attendance' : 
                       newBase === '2024' ? '2024 Max Attendance' : 
                       newBase === 'average' ? 'Max Ave Attendance' :
                       'Highest All Time Attendance';
    
    showToast(`Calculations now based on ${messageText}`, 'info');
}

function getStatusBadgeClass(course, room) {
    if (!course.assignedRoom) return 'status-unassigned';
    if (!room) return 'status-error';
    
    const percentage = (course.expectedAttendance / room.seats) * 100;
    if (percentage > 100) return 'status-over';
    if (percentage > 90) return 'status-warning';
    return 'status-ok';
}

function getStatusText(course, room) {
    if (!course.assignedRoom) return 'Unassigned';
    if (!room) return 'Room not found';
    
    const percentage = (course.expectedAttendance / room.seats) * 100;
    if (percentage > 100) return 'Over capacity';
    if (percentage > 90) return 'Near capacity';
    return 'OK';
}

function updateSummary() {
    const availableRooms = rooms.filter(r => r.available).length;
    const assignedRooms = rooms.filter(r => r.assignedTo).length;
    const unassignedRooms = availableRooms - assignedRooms;
    const coursesWithoutRooms = courses.filter(c => !c.assignedRoom).length;
    
    let capacityIssues = 0;
    courses.forEach(course => {
        if (course.assignedRoom) {
            const room = rooms.find(r => r.name === course.assignedRoom);
            if (room && (course.expectedAttendance / room.seats) > 1) {
                capacityIssues++;
            }
        }
    });
    
    document.getElementById('totalAvailable').textContent = availableRooms;
    document.getElementById('roomsAssigned').textContent = assignedRooms;
    document.getElementById('roomsUnassigned').textContent = unassignedRooms;
    document.getElementById('coursesWithoutRooms').textContent = coursesWithoutRooms;
    document.getElementById('capacityIssues').textContent = capacityIssues;
}

function renderAll() {
    renderRoomsTable();
    renderAssignments();
    renderDataTable();
    updateSummary();
}

/**
 * Export and utility functions
 */
function refreshDataTable() {
    renderDataTable();
    showToast('Data table refreshed', 'success');
}

function exportTableToCSV() {
    if (courses.length === 0) {
        showToast('No data to export', 'warning');
        return;
    }
    
    const headers = ['Topic', 'Type', '2023 Max Attendance', '2024 Max Attendance', 'Average Attendance', 'Previous Room', 'Assigned Room', 'Room Capacity', 'Capacity %', 'Status'];
    const rows = courses.map(course => {
        const assignedRoom = rooms.find(r => r.name === course.assignedRoom);
        const capacityInfo = getCapacityInfo(course, assignedRoom);
        
        return [
            course.topic,
            course.type,
            course.maxAttendance2023 || '',
            course.maxAttendance2024 || '',
            course.avgAttendance || '',
            course.previousRoom || '',
            course.assignedRoom || 'Not assigned',
            assignedRoom ? assignedRoom.seats : 'N/A',
            capacityInfo.percentage,
            getStatusText(course, assignedRoom)
        ];
    });
    
    const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'classroom-assignments.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    showToast('Data exported to CSV', 'success');
}

function copyTableToClipboard() {
    if (courses.length === 0) {
        showToast('No data to copy', 'warning');
        return;
    }
    
    const table = document.getElementById('dataTable');
    const range = document.createRange();
    range.selectNode(table);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    
    try {
        document.execCommand('copy');
        window.getSelection().removeAllRanges();
        showToast('Table copied to clipboard', 'success');
    } catch (err) {
        showToast('Failed to copy table', 'error');
    }
}

/**
 * Save and Import file functions
 */
function saveToFile() {
    const fileName = prompt('Enter a name for your save file:', 'classroom_assignments_' + new Date().toISOString().split('T')[0]);
    if (!fileName) return;
    
    // Get current AGMSC year
    const agmscYearElement = document.getElementById('agmscYear');
    const agmscYear = agmscYearElement ? agmscYearElement.value : new Date().getFullYear();
    
    const dataToSave = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        rooms: rooms,
        courses: courses,
        settings: {
            attendanceBase: attendanceBase,
            selectedYear1: selectedYear1,
            selectedYear2: selectedYear2,
            agmscYear: agmscYear,
            roomSortColumn: roomSortColumn,
            roomSortDirection: roomSortDirection
        },
        metadata: {
            totalRooms: rooms.length,
            totalCourses: courses.length,
            assignedRooms: rooms.filter(r => r.assignedTo).length,
            agmscYear: agmscYear
        }
    };
    
    const jsonString = JSON.stringify(dataToSave, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.json') ? fileName : fileName + '.json';
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast('File saved successfully to Downloads folder', 'success');
}

function loadFromFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.style.display = 'none';
    
    input.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                
                // Validate data structure
                if (!data.rooms || !data.courses || !Array.isArray(data.rooms) || !Array.isArray(data.courses)) {
                    throw new Error('Invalid file format');
                }
                
                // Confirm before loading
                const confirmMessage = `Load file "${file.name}"?\n\nThis will replace all current data:\n- ${data.rooms.length} rooms\n- ${data.courses.length} courses\n\nCurrent data will be lost.`;
                if (!confirm(confirmMessage)) return;
                
                // Load the data
                rooms = data.rooms;
                courses = data.courses;
                
                // Ensure all rooms and courses have IDs
                rooms.forEach(room => {
                    if (!room.id) room.id = generateId();
                });
                courses.forEach(course => {
                    if (!course.id) course.id = generateId();
                });
                
                // Sync assignments and save
                syncRoomAssignments();
                saveData();
                renderAll();
                
                // Load settings if they exist
                if (data.settings) {
                    attendanceBase = data.settings.attendanceBase || '2024';
                    selectedYear1 = data.settings.selectedYear1 || '2023';
                    selectedYear2 = data.settings.selectedYear2 || '2024';
                    roomSortColumn = data.settings.roomSortColumn || null;
                    roomSortDirection = data.settings.roomSortDirection || 'asc';
                    
                    // Restore AGMSC year
                    if (data.settings.agmscYear) {
                        setTimeout(() => {
                            const agmscYearElement = document.getElementById('agmscYear');
                            if (agmscYearElement) {
                                agmscYearElement.value = data.settings.agmscYear;
                            }
                        }, 100);
                    }
                }
                
                showToast(`File loaded successfully: ${data.rooms.length} rooms, ${data.courses.length} courses`, 'success');
                
            } catch (error) {
                showToast('Error loading file: ' + error.message, 'error');
            }
        };
        
        reader.readAsText(file);
    });
    
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
}

/**
 * Report generation functions
 */
function generateReport() {
    // First, ensure all modals are closed
    closeConflictModal();
    document.getElementById('reportModal').style.display = 'none';
    
    // Wait a moment to ensure modals are closed
    setTimeout(() => {
        const agmscYear = document.getElementById('agmscYear').value;
        const reportContent = document.getElementById('reportContent');
        const modal = document.getElementById('reportModal');
        
        // Generate report HTML
        const reportHTML = createReportHTML(agmscYear);
        reportContent.innerHTML = reportHTML;
        
        // Show modal
        modal.style.display = 'block';
    }, 100);
}

function createReportHTML(year) {
    const totalRooms = rooms.length;
    const assignedRooms = rooms.filter(r => r.assignedTo).length;
    const totalCourses = courses.length;
    const lectureCount = courses.filter(c => c.type === 'Lecture').length;
    const handsOnCount = courses.filter(c => c.type === 'Hands-On').length;
    const coursesWithoutRooms = courses.filter(c => !c.assignedRoom).length;
    const capacityIssues = courses.filter(c => {
        const room = rooms.find(r => r.name === c.assignedRoom);
        return room && (c.expectedAttendance / room.seats) > 1;
    }).length;
    
    const currentDate = new Date().toLocaleDateString();
    
    return `
        <div class="report-header">
            <div class="report-title">AGMSC ${year} Classroom Assignment Report</div>
            <div class="report-subtitle">Generated on ${currentDate}</div>
            <div class="report-subtitle">Written by Tim Bickford</div>
        </div>
        
        <div class="report-section">
            <h3>Executive Summary</h3>
            <div class="report-summary">
                <div class="report-summary-item">
                    <div class="report-summary-value">${totalRooms}</div>
                    <div class="report-summary-label">Total Rooms</div>
                </div>
                <div class="report-summary-item">
                    <div class="report-summary-value">${assignedRooms}</div>
                    <div class="report-summary-label">Rooms Assigned</div>
                </div>
                </div>
                <div class="report-summary-item">
                    <div class="report-summary-value">${totalCourses}</div>
                    <div class="report-summary-label">Total Courses</div>
                </div>
                <div class="report-summary-item">
                    <div class="report-summary-value">${lectureCount}</div>
                    <div class="report-summary-label">Lecture Series</div>
                </div>
                <div class="report-summary-item">
                    <div class="report-summary-value">${handsOnCount}</div>
                    <div class="report-summary-label">Hands-On Series</div>
                </div>
                <div class="report-summary-item">
                    <div class="report-summary-value">${coursesWithoutRooms}</div>
                    <div class="report-summary-label">Unassigned Courses</div>
                </div>
                <div class="report-summary-item">
                    <div class="report-summary-value">${capacityIssues}</div>
                    <div class="report-summary-label">Capacity Issues</div>
                </div>
            </div>
        </div>
        
        <div class="report-section">
            <h3>Room Inventory by Building</h3>
            ${generateRoomsByBuilding()}
        </div>
        
        <div class="report-section">
            <h3>Historical Attendance Data</h3>
            ${generateHistoricalDataTable()}
        </div>
        
        <div class="report-section">
            <h3>Assigned Classrooms - Lecture Series</h3>
            ${generateAssignedRoomsTable('Lecture')}
        </div>
        
        <div class="report-section">
            <h3>Assigned Classrooms - Hands-On Series</h3>
            ${generateAssignedRoomsTable('Hands-On')}
        </div>
        
        <div class="report-section">
            <h3>Course Assignments - Lecture Series</h3>
            ${generateCourseTable('Lecture')}
        </div>
        
        <div class="report-section">
            <h3>Course Assignments - Hands-On Series</h3>
            ${generateCourseTable('Hands-On')}
        </div>
        
        <div class="report-section">
            <h3>Capacity Analysis</h3>
            ${generateCapacityAnalysis()}
        </div>
    `;
}

function generateRoomsByBuilding() {
    const roomsByBuilding = {};
    rooms.forEach(room => {
        if (!roomsByBuilding[room.building]) {
            roomsByBuilding[room.building] = [];
        }
        roomsByBuilding[room.building].push(room);
    });
    
    let html = '';
    Object.keys(roomsByBuilding).sort().forEach(building => {
        const buildingRooms = roomsByBuilding[building];
        html += `
            <h4>${building}</h4>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Room</th>
                        <th>Seats</th>
                        <th>Seat Type</th>
                        <th>Status</th>
                        <th>Assigned To</th>
                        <th>Type</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        buildingRooms.sort((a, b) => a.name.localeCompare(b.name)).forEach(room => {
            const status = room.assignedTo ? 'Assigned' : (room.available ? 'Available' : 'Unavailable');
            const assignedCourse = courses.find(c => c.assignedRoom === room.name);
            const courseType = assignedCourse ? assignedCourse.type : '-';
            
            html += `
                <tr>
                    <td>${room.name}</td>
                    <td>${room.seats}</td>
                    <td>${room.seatType}</td>
                    <td>${status}</td>
                    <td>${room.assignedTo || '-'}</td>
                    <td>${courseType}</td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
        `;
    });
    
    return html;
}

function generateHistoricalDataTable() {
    let html = `
        <table class="report-table">
            <thead>
                <tr>
                    <th>Topic</th>
                    <th>Type</th>
                    <th>2023 Max Attendance</th>
                    <th>2024 Max Attendance</th>
                    <th>Average Attendance</th>
                    <th>Previous Room</th>
                    <th>Current Room</th>
                    <th>Change in Attendance</th>
                </tr>
            </thead>
    `;
    
    courses.forEach(course => {
        const attendanceChange = course.maxAttendance2023 && course.maxAttendance2024 ? 
            course.maxAttendance2024 - course.maxAttendance2023 : 'N/A';
        const changeDisplay = attendanceChange !== 'N/A' ? 
            (attendanceChange > 0 ? `+${attendanceChange}` : attendanceChange.toString()) : 'N/A';
        
        html += `
            <tr>
                <td>${course.topic}</td>
                <td>${course.type}</td>
                <td>${course.maxAttendance2023 || 'N/A'}</td>
                <td>${course.maxAttendance2024 || 'N/A'}</td>
                <td>${course.avgAttendance || 'N/A'}</td>
                <td>${course.previousRoom || 'N/A'}</td>
                <td>${course.assignedRoom || 'Not assigned'}</td>
                <td>${changeDisplay}</td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    return html;
}

function generateAssignedRoomsTable(courseType) {
    const filteredCourses = courses.filter(c => c.type === courseType && c.assignedRoom);
    
    if (filteredCourses.length === 0) {
        return `<p>No assigned classrooms for ${courseType.toLowerCase()} courses.</p>`;
    }
    
    // Group by building
    const roomsByBuilding = {};
    filteredCourses.forEach(course => {
        const room = rooms.find(r => r.name === course.assignedRoom);
        if (room) {
            if (!roomsByBuilding[room.building]) {
                roomsByBuilding[room.building] = [];
            }
            roomsByBuilding[room.building].push({
                room: room,
                course: course
            });
        }
    });
    
    let html = '';
    Object.keys(roomsByBuilding).sort().forEach(building => {
        const buildingAssignments = roomsByBuilding[building];
        html += `
            <h4>${building}</h4>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Room</th>
                        <th>Assigned Course</th>
                        <th>Type</th>
                        <th>Expected Attendance</th>
                        <th>Room Capacity</th>
                        <th>Utilization</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        buildingAssignments.sort((a, b) => a.room.name.localeCompare(b.room.name)).forEach(assignment => {
            const utilization = Math.round((assignment.course.expectedAttendance / assignment.room.seats) * 100);
            html += `
                <tr>
                    <td>${assignment.room.name}</td>
                    <td>${assignment.course.topic}</td>
                    <td>${assignment.course.type}</td>
                    <td>${assignment.course.expectedAttendance}</td>
                    <td>${assignment.room.seats}</td>
                    <td>${utilization}%</td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
        `;
    });
    
    return html;
}

function generateCourseTable(courseType) {
    const filteredCourses = courses.filter(c => c.type === courseType);
    
    if (filteredCourses.length === 0) {
        return `<p>No ${courseType.toLowerCase()} courses found.</p>`;
    }
    
    let html = `
        <table class="report-table">
            <thead>
                <tr>
                    <th>Topic</th>
                    <th>Expected Attendance</th>
                    <th>Assigned Room</th>
                    <th>Room Capacity</th>
                    <th>Capacity %</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    filteredCourses.forEach(course => {
        const assignedRoom = rooms.find(r => r.name === course.assignedRoom);
        const capacityInfo = getCapacityInfo(course, assignedRoom);
        
        html += `
            <tr>
                <td>${course.topic}</td>
                <td>${course.expectedAttendance}</td>
                <td>${course.assignedRoom || 'Not assigned'}</td>
                <td>${assignedRoom ? assignedRoom.seats : 'N/A'}</td>
                <td>${capacityInfo.percentage}</td>
                <td>${getStatusText(course, assignedRoom)}</td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    return html;
}

function generateCapacityAnalysis() {
    const assignedCourses = courses.filter(c => c.assignedRoom);
    const overCapacity = assignedCourses.filter(c => {
        const room = rooms.find(r => r.name === c.assignedRoom);
        return room && (c.expectedAttendance / room.seats) > 1;
    });
    
    const nearCapacity = assignedCourses.filter(c => {
        const room = rooms.find(r => r.name === c.assignedRoom);
        const ratio = room ? (c.expectedAttendance / room.seats) : 0;
        return room && ratio >= 0.9 && ratio <= 1;
    });
    
    let html = `
        <div class="report-summary">
            <div class="report-summary-item">
                <div class="report-summary-value">${overCapacity.length}</div>
                <div class="report-summary-label">Over Capacity</div>
            </div>
            <div class="report-summary-item">
                <div class="report-summary-value">${nearCapacity.length}</div>
                <div class="report-summary-label">Near Capacity (90-100%)</div>
            </div>
        </div>
    `;
    
    if (overCapacity.length > 0) {
        html += `
            <h4>Courses Over Capacity</h4>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Course</th>
                        <th>Expected Attendance</th>
                        <th>Room</th>
                        <th>Room Capacity</th>
                        <th>Overflow</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        overCapacity.forEach(course => {
            const room = rooms.find(r => r.name === course.assignedRoom);
            const overflow = course.expectedAttendance - room.seats;
            html += `
                <tr>
                    <td>${course.topic}</td>
                    <td>${course.expectedAttendance}</td>
                    <td>${course.assignedRoom}</td>
                    <td>${room.seats}</td>
                    <td>+${overflow}</td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
        `;
    }
    
    return html;
}

function closeReportModal() {
    document.getElementById('reportModal').style.display = 'none';
}

function printReport() {
    // Ensure conflict modal is definitely closed
    closeConflictModal();
    
    // Add a small delay to ensure styles are applied
    setTimeout(() => {
        // Hide all other modals and elements
        const conflictModal = document.getElementById('conflictModal');
        if (conflictModal) {
            conflictModal.style.display = 'none';
            conflictModal.style.visibility = 'hidden';
        }
        
        // Set print-friendly styles
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        
        window.print();
        
        // Reset styles after printing
        setTimeout(() => {
            document.body.style.margin = '';
            document.body.style.padding = '';
        }, 1000);
    }, 200);
}

function exportReportToPDF() {
    // Instructions for better PDF generation
    showToast('For best PDF results: Use Chrome browser → Print → More settings → Enable "Background graphics" → Save as PDF', 'info');
    printReport();
}

/**
 * Toast notification system
 */
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const icon = toast.querySelector('.toast-icon');
    const messageEl = toast.querySelector('.toast-message');
    
    // Set icon based on type
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    icon.className = `toast-icon ${icons[type] || icons.info}`;
    messageEl.textContent = message;
    
    // Set toast type class
    toast.className = `toast ${type}`;
    
    // Show toast
    toast.classList.add('show');
    
    // Hide after 4 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

/**
 * Section toggle functionality
 */
function toggleSection(sectionId) {
    const content = document.getElementById(sectionId);
    const chevron = document.getElementById(sectionId.replace('-content', '-chevron'));
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        chevron.className = 'fas fa-chevron-up';
    } else {
        content.style.display = 'none';
        chevron.className = 'fas fa-chevron-down';
    }
}

/**
 * Utility functions
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add some additional CSS for status badges
const additionalCSS = `
.badge {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.8em;
    font-weight: 500;
}

.status-ok { background-color: hsl(var(--available-bg)); color: hsl(var(--capacity-ok)); }
.status-warning { background-color: hsl(45, 100%, 90%); color: hsl(var(--capacity-warning)); }
.status-over { background-color: hsl(var(--unavailable-bg)); color: hsl(var(--capacity-over)); }
.status-unassigned { background-color: hsl(0, 0%, 90%); color: hsl(var(--text-secondary)); }
.status-error { background-color: hsl(var(--unavailable-bg)); color: hsl(var(--capacity-over)); }
`;

// Inject additional CSS
const style = document.createElement('style');
style.textContent = additionalCSS;
document.head.appendChild(style);
