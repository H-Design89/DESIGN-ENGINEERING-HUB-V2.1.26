// ==========================================
// HỆ THỐNG BẢO MẬT & ĐĂNG NHẬP
// ==========================================
let ACCOUNTS = (window.GT_CONFIG && window.GT_CONFIG.ACCOUNTS) ? window.GT_CONFIG.ACCOUNTS : [{ user: 'admin', pass: 'zodiac1612@', role: 'admin', tabs: ['coil', 'psychro'] }];
let currentUser = null;

function checkLogin() {
    const user = document.getElementById('login-user').value.trim();
    const pass = document.getElementById('login-pass').value;

    let validAccount = null;
    for (let acc of ACCOUNTS) {
        if (acc.user === user && acc.pass === pass) {
            validAccount = acc;
            break;
        }
    }

    if (validAccount) {
        currentUser = validAccount;
        document.getElementById('login-error').style.display = 'none';
        unlockApp();
    } else {
        document.getElementById('login-error').style.display = 'block';
    }
}

function unlockApp() {
    document.getElementById('lock-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
    
    // Configure visible tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.style.display = 'none'; // Hide all by default
    });
    
    // Show tabs based on permissions
    let firstVisibleTab = null;
    if (currentUser.tabs) {
        currentUser.tabs.forEach(tabId => {
            const btn = document.querySelector(`.nav-tab[onclick="switchTab('${tabId}')"]`);
            if (btn) {
                btn.style.display = 'inline-block';
                if (!firstVisibleTab) firstVisibleTab = tabId;
            }
        });
    }
    
    // Admin tab logic
    const adminBtn = document.querySelector(`.nav-tab[onclick="openAdminPage()"]`);
    if (currentUser.role === 'admin') {
        if (adminBtn) adminBtn.style.display = 'inline-block';
    } else {
        if (adminBtn) adminBtn.style.display = 'none';
    }

    // Default to first visible tab
    if (firstVisibleTab) {
        switchTab(firstVisibleTab);
    } else {
        // If no tabs, just switch to coil as fallback if it's there
        switchTab('coil');
    }
    
    updateFanModels();
    let fanModelEl = document.getElementById('fan_model');
    if (fanModelEl && fanModelEl.querySelector('option[value="FN050"]')) {
        fanModelEl.value = 'FN050';
        updateFanModes();
        let fanPressEl = document.getElementById('fan_pressure');
        if (fanPressEl && fanPressEl.querySelector('option[value="40"]')) {
            fanPressEl.value = '40';
            updateFanAirflow();
        }
    }
    checkConstraints();
    updateTotalN();
    togglePerfMode('std');
    toggleCircuitMode('passes');
    if (firstVisibleTab === 'psychro') {
        calculatePsychro();
    }
}



// ==========================================
// BẢO VỆ GIAO DIỆN CƠ BẢN (ANTI-INSPECT & ANTI-RIGHT-CLICK)
// ==========================================
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

document.addEventListener('keydown', function(e) {
    // F12
    if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
    }
    // Ctrl+Shift+I (Inspect)
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.keyCode === 73)) {
        e.preventDefault();
    }
    // Ctrl+Shift+J (Console)
    if (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j' || e.keyCode === 74)) {
        e.preventDefault();
    }
    // Ctrl+Shift+C (Element Inspect)
    if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c' || e.keyCode === 67)) {
        e.preventDefault();
    }
    // Ctrl+U (View Source)
    if (e.ctrlKey && (e.key === 'U' || e.key === 'u' || e.keyCode === 85)) {
        e.preventDefault();
    }
    // Ctrl+S (Save As)
    if (e.ctrlKey && (e.key === 'S' || e.key === 's' || e.keyCode === 83)) {
        e.preventDefault();
    }
    // Ctrl+P (Print)
    if (e.ctrlKey && (e.key === 'P' || e.key === 'p' || e.keyCode === 80)) {
        e.preventDefault();
    }
    // Ctrl+C (Copy)
    if (e.ctrlKey && (e.key === 'C' || e.key === 'c' || e.keyCode === 67) && !e.shiftKey) {
        const sel = window.getSelection();
        if (sel.rangeCount > 0) {
            let node = sel.anchorNode;
            while (node) {
                if (node.classList && node.classList.contains('history-card')) return; // Cho phép
                node = node.parentNode;
            }
        }
        if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            e.preventDefault();
        }
    }
});

// Chặn sự kiện Copy / Cut ngoại trừ trong thẻ Input
document.addEventListener('copy', function(e) {
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
        let node = sel.anchorNode;
        while (node) {
            if (node.classList && node.classList.contains('history-card')) return; // Cho phép
            node = node.parentNode;
        }
    }
    if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
    }
});
document.addEventListener('cut', function(e) {
    if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
    }
});

function logoutUser() {
    location.reload();
}

window.onclick = function(event) {
    if (!event.target.matches('.btn-gear')) {
        var dropdowns = document.getElementsByClassName("dropdown-menu");
        for (var i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}
