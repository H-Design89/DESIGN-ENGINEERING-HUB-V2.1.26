// ==========================================
// HỆ THỐNG BẢO MẬT & ĐẾM NGÀY (DRM CLIENT)
// Ghi chú: Hệ thống này quản lý quyền truy cập bằng cách lưu thông tin vào localStorage.
// Đã thêm hàm encodeData/decodeData (mã hóa Base64) để làm khó những ai muốn xem/sửa hạn sử dụng bằng cách mở DevTools.
// ==========================================
const STORAGE_PREFIX = "_gt_sec_"; // Đổi tiền tố để khó nhận biết
function encodeData(data) { return btoa(data + "|gt_salt"); }
function decodeData(encodedData) {
    if (!encodedData) return null;
    try { return atob(encodedData).split("|gt_salt")[0]; } catch (e) { return null; }
}

let MASTER_KEY_CHANGE_PIN = (window.GT_CONFIG && window.GT_CONFIG.MASTER_KEY_CHANGE_PIN) ? window.GT_CONFIG.MASTER_KEY_CHANGE_PIN : "161289";
let MASTER_KEY_KEEP_PIN = (window.GT_CONFIG && window.GT_CONFIG.MASTER_KEY_KEEP_PIN) ? window.GT_CONFIG.MASTER_KEY_KEEP_PIN : "061189";
let ROTATING_PINS = (window.GT_CONFIG && window.GT_CONFIG.ROTATING_PINS) ? window.GT_CONFIG.ROTATING_PINS : [{ hint: "Mặc định", code: "1234" }];
let ADMIN_ACCOUNTS = (window.GT_CONFIG && window.GT_CONFIG.ADMIN_ACCOUNTS) ? window.GT_CONFIG.ADMIN_ACCOUNTS : [{ user: 'admin', pass: 'zodiac1612@' }];
let isAdminLoggedIn = false;

// Đã bỏ loadSecurityData() do dữ liệu được nạp từ config.js tĩnh

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000; 

function initSecuritySystem() {
    // Lấy dữ liệu và giải mã
    let startDate = decodeData(localStorage.getItem(STORAGE_PREFIX + 'sd'));
    let pinIndex = decodeData(localStorage.getItem(STORAGE_PREFIX + 'pi'));
    let isLockedOut = decodeData(localStorage.getItem(STORAGE_PREFIX + 'lo'));

    if (!startDate) {
        startDate = Date.now().toString();
        pinIndex = "0";
        isLockedOut = 'false';
        // Lưu trữ dữ liệu đã mã hóa
        localStorage.setItem(STORAGE_PREFIX + 'sd', encodeData(startDate));
        localStorage.setItem(STORAGE_PREFIX + 'pi', encodeData(pinIndex));
        localStorage.setItem(STORAGE_PREFIX + 'lo', encodeData(isLockedOut));
    }

    const now = Date.now();
    let lastCheckedTime = decodeData(localStorage.getItem(STORAGE_PREFIX + 'lt'));
    
    // Kiểm tra lùi ngày hệ thống (Clock Tampering)
    if (lastCheckedTime && now < parseInt(lastCheckedTime) && isLockedOut === 'false') {
        isLockedOut = 'true';
        localStorage.setItem(STORAGE_PREFIX + 'lo', encodeData('true'));
        alert("Cảnh báo bảo mật: Phát hiện dấu hiệu can thiệp/lùi thời gian hệ thống! Hệ thống đã tự động khóa.");
    } else {
        localStorage.setItem(STORAGE_PREFIX + 'lt', encodeData(now.toString()));
    }

    const elapsed = now - parseInt(startDate);
    if (elapsed > THIRTY_DAYS_MS && isLockedOut === 'false') {
        isLockedOut = 'true';
        localStorage.setItem(STORAGE_PREFIX + 'lo', encodeData('true'));
    }

    if (isLockedOut === 'true') {
        document.getElementById('ui-regular-pin').style.display = 'none';
        document.getElementById('ui-master-key').style.display = 'block';
        document.getElementById('lock-box-container').classList.add('master-mode');
        document.getElementById('lock-title').innerText = "HỆ THỐNG BỊ KHÓA";
    } else {
        document.getElementById('ui-regular-pin').style.display = 'block';
        document.getElementById('ui-master-key').style.display = 'none';
        document.getElementById('lock-box-container').classList.remove('master-mode');
        document.getElementById('lock-title').innerText = "GT-DESIGN SECURE";
        
        let pIndex = parseInt(pinIndex);
        if (isNaN(pIndex) || pIndex >= ROTATING_PINS.length || pIndex < 0) {
            pIndex = 0; // Fallback an toàn
            localStorage.setItem(STORAGE_PREFIX + 'pi', encodeData("0"));
        }
        
        const currentData = ROTATING_PINS[pIndex];
        document.getElementById('pin-hint-display').innerText = currentData.hint + " - ****";
    }
}

initSecuritySystem();

function checkRegularPIN() {
    const pinInput = document.getElementById('pin-input').value;
    const pinIndexStr = decodeData(localStorage.getItem(STORAGE_PREFIX + 'pi'));
    let pinIndex = parseInt(pinIndexStr || "0");
    if (isNaN(pinIndex) || pinIndex >= ROTATING_PINS.length || pinIndex < 0) {
        pinIndex = 0;
    }
    
    const expectedPin = ROTATING_PINS[pinIndex].code;

    if (pinInput === expectedPin) {
        unlockApp();
    } else {
        document.getElementById('pin-error').style.display = 'block';
        document.getElementById('pin-input').value = "";
    }
}

function checkMasterKey() {
    const masterInput = document.getElementById('master-input').value;
    
    if (masterInput === MASTER_KEY_CHANGE_PIN) {
        // Ghi chú: Khi nhập đúng MASTER_KEY đổi PIN, khởi tạo lại chu kỳ và mã hóa lại, đổi sang PIN tiếp theo
        localStorage.setItem(STORAGE_PREFIX + 'sd', encodeData(Date.now().toString()));
        const currentPinStr = decodeData(localStorage.getItem(STORAGE_PREFIX + 'pi'));
        let nextIndex = (parseInt(currentPinStr || "0") + 1) % ROTATING_PINS.length;
        localStorage.setItem(STORAGE_PREFIX + 'pi', encodeData(nextIndex.toString()));
        localStorage.setItem(STORAGE_PREFIX + 'lo', encodeData('false'));
        
        document.getElementById('master-error').style.display = 'none';
        document.getElementById('master-input').value = "";
        initSecuritySystem();
    } else if (masterInput === MASTER_KEY_KEEP_PIN) {
        // Ghi chú: Khi nhập đúng MASTER_KEY giữ PIN, khởi tạo lại chu kỳ, KHÔNG đổi mã PIN
        localStorage.setItem(STORAGE_PREFIX + 'sd', encodeData(Date.now().toString()));
        localStorage.setItem(STORAGE_PREFIX + 'lo', encodeData('false'));
        
        document.getElementById('master-error').style.display = 'none';
        document.getElementById('master-input').value = "";
        initSecuritySystem();
    } else {
        document.getElementById('master-error').style.display = 'block';
        document.getElementById('master-input').value = "";
    }
}

function unlockApp() {
    document.getElementById('lock-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
    
    updateFanModels();
    checkConstraints();
    updateTotalN();
    togglePerfMode('kw');
    toggleCircuitMode('passes');
    calculatePsychro();
}

document.getElementById('pin-input').addEventListener('keypress', function(e) { if (e.key === 'Enter') checkRegularPIN(); });
document.getElementById('master-input').addEventListener('keypress', function(e) { if (e.key === 'Enter') checkMasterKey(); });



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
});
