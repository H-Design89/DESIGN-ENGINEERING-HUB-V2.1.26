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
// CẤU HÌNH THÔNG SỐ ỐNG (TUBE SPECIFICATIONS)
// Ghi chú: Chuyển toàn bộ dữ liệu ống vào một Object (TUBE_SPECS) thay vì dùng if/else.
// Việc này giúp mã ngắn gọn hơn và dễ dàng bảo trì/thêm loại ống mới về sau.
// d_ngoai: Đường kính ngoài, d_lo: Đường kính lỗ, d_dt: Đường kính lỗ điện trở
// b_n: Bước ngang, b_d: Bước dọc, thick: Độ dày, h_rut: Hệ số rút, d_han: Chiều dài mối hàn
// ==========================================
let TUBE_SPECS = (window.GT_CONFIG && window.GT_CONFIG.TUBE_SPECS) ? window.GT_CONFIG.TUBE_SPECS : {};
let FIN_WEIGHT_COEFFS = (window.GT_CONFIG && window.GT_CONFIG.FIN_WEIGHT_COEFFS) ? window.GT_CONFIG.FIN_WEIGHT_COEFFS : {};

// Đã bỏ loadCustomData() do dữ liệu được nạp từ config.js tĩnh


// ==========================================
// GLOBAL STATE & DATA
// ==========================================
let isLFinManual = false;
let isGioManual = false;
let isReqFanManual = false;
let perfMode = 'kw'; 
let circuitMode = 'passes'; 
let debounceTimer; 

let lastCalculatedAreaNoHeater = 0;
let lastCalculatedAreaWithHeater = 0;

const VOL_DEFAULTS = {
    "D16_45":    { tubeThick: 0.48, uBendThick: 0.5, uBendLen: 110 },
    "D16_50":    { tubeThick: 0.48, uBendThick: 0.5, uBendLen: 110 },
    "D127_31":   { tubeThick: 0.4,  uBendThick: 0.4, uBendLen: 90 },
    "D127_50":   { tubeThick: 0.4,  uBendThick: 0.4, uBendLen: 90 },
    "D96":       { tubeThick: 0.4,  uBendThick: 0.4, uBendLen: 70 },
    "Inox16":    { tubeThick: 0.6,  uBendThick: 0.7, uBendLen: 110 },
    "Inox16_45": { tubeThick: 0.6,  uBendThick: 0.7, uBendLen: 110 },
    "Inox22":    { tubeThick: 0.8,  uBendThick: 0.8, uBendLen: 150 }
};

let userVolConfig = {
    isCustom: false,
    tubeThick: 0,
    ubends: [], // { qty: 0, thick: 0, len: 0 }
    headers: [] // { d: 0, thick: 0, len: 0 }
};

const FANS = {
    "ZA": {
        "FN040": { name: "FN040 Ø400", modes: { "Tam giác (Δ)": { 0:4400, 20:4200, 40:3900, 60:3600 }, "Sao (Y)": { 0:3600, 20:3300, 40:2700, 60:2000 }}},
        "FN045": { name: "FN045 Ø450", modes: { "Tam giác (Δ)": { 0:5400, 20:5200, 40:4800, 60:4400 }, "Sao (Y)": { 0:4300, 20:3800, 40:3000 }}},
        "FN050": { name: "FN050 Ø500", modes: { "Tam giác (Δ)": { 0:8000, 20:7800, 40:7500, 60:7200, 80:6900, 100:6500 }, "Sao (Y)": { 0:6600, 20:6200, 40:5900, 60:5400, 80:4800 }}},
        "FN056": { name: "FN056 Ø560", modes: { "Tam giác (Δ)": { 0:10300, 20:10000, 40:9700, 60:9400, 80:9000, 100:8500, 120:8000, 150:7000 }, "Sao (Y)": { 0:8000, 20:7500, 40:7000, 60:6000 }}},
        "FN063": { name: "FN063 Ø630", modes: { "Tam giác (Δ)": { 0:17700, 20:17200, 40:17000, 60:16500, 80:16200, 100:15900, 120:15500, 150:14800, 180:14000 }, "Sao (Y)": { 0:14200, 20:13800, 40:13300, 60:12900, 80:12100, 100:11500, 120:10500 }}}
    },
    "TQ": {
        "D300": { name: "YDWF Ø300", modes: { "Mặc định": { 0:1700, 20:1400, 40:780, 50:650 }}},
        "D350": { name: "YDWF Ø350", modes: { "Mặc định": { 0:2890, 20:2700, 40:2400, 60:2100 }}},
        "D400": { name: "YSWF Ø400", modes: { "Tam giác (Δ)": { 0:4000, 20:3800, 40:3500, 60:3200, 80:2700 }, "Sao (Y)": { 0:3800, 20:3400, 40:2700, 60:2400, 80:1200 }}},
        "D450": { name: "YSWF Ø450", modes: { "Tam giác (Δ)": { 0:4800, 20:4500, 40:4200, 60:3900, 80:3500 }, "Sao (Y)": { 0:4200, 20:3700, 40:3100, 60:2200, 80:1400 }}},
        "D500": { name: "YSWF Ø500", modes: { "Tam giác (Δ)": { 0:8000, 20:7700, 40:7500, 60:7100, 80:6700, 100:6500, 120:6000 }, "Sao (Y)": { 0:7300, 20:6700, 40:6300, 60:5800, 80:5300, 100:4700, 120:3800 }}},
        "D550": { name: "YSWF Ø550", modes: { "Tam giác (Δ)": { 0:8500, 20:8400, 40:8000, 60:7700, 80:7200, 100:6900, 120:6400, 150:5500 }, "Sao (Y)": { 0:7500, 20:7100, 40:6600, 60:5900, 80:5100, 100:4400, 120:3200 }}},
        "D600": { name: "YSWF Ø600", modes: { "Tam giác (Δ)": { 0:10400, 20:10100, 40:9800, 60:9500, 80:9000, 100:8600, 120:8100, 150:7200 }, "Sao (Y)": { 0:9100, 20:8600, 40:8000, 60:7500, 80:6800, 100:5800, 120:4300 }}},
        "D630": { name: "YSWF Ø630", modes: { "Tam giác (Δ)": { 0:15000, 20:14800, 40:14300, 60:14000, 80:13500, 100:13000, 120:12500, 150:11700, 180:10500 }, "Sao (Y)": { 0:14200, 20:13800, 40:13100, 60:12800, 80:12000, 100:11500, 120:10800, 150:9300 }}}
    },
    "KRUGER": {
        "TDA630": { name: "TDA Ø630", modes: { "Mặc định": { 80:15800, 120:14500, 150:13200 }}},
        "TDA710_3": { name: "TDA Ø710 (3kW)", modes: { "Mặc định": { 80:22400, 120:21500, 150:20800 }}},
        "TDA710_4": { name: "TDA Ø710 (4kW)", modes: { "Mặc định": { 80:25000, 120:24000, 150:23400 }}},
        "TDA800": { name: "TDA Ø800 (5.5kW)", modes: { "Mặc định": { 80:34000, 120:33200, 150:32000 }}}
    }
};

function switchTab(tabId) {
    document.querySelectorAll('.app-page').forEach(page => {
        page.classList.remove('active');
    });
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    document.getElementById('page-' + tabId).classList.add('active');
    if (event && event.currentTarget && event.currentTarget.classList && event.currentTarget.classList.contains('nav-tab')) {
        event.currentTarget.classList.add('active');
    }

    if(tabId === 'psychro') calculatePsychro();
}

function triggerDebounceCalc() {
    const resultCol = document.getElementById('result-container');
    resultCol.classList.add('updating');

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        syncMassSegments();
        calculateAll();
        resultCol.classList.remove('updating');
    }, 600);
}

// ==============================================
// LOGIC PSYCHROMETRIC CHART 
// ==============================================
function getPsyProps(T, RH) {
    let P_sat = 611.2 * Math.exp((17.62 * T) / (243.12 + T));
    let P_v = RH * P_sat;
    let w = 621.97 * (P_v / (101325 - P_v));
    let h = 1.006 * T + (w / 1000) * (2501 + 1.86 * T);
    let b = Math.log(Math.max(P_v, 0.001) / 611.2) / 17.62;
    let T_dp = (243.12 * b) / (1 - b);
    return { P_sat: P_sat, h: h, w: w, T_dp: T_dp };
}

function calculatePsychro() {
    let T1 = parseFloat(document.getElementById('psy_t1').value);
    let RH1 = parseFloat(document.getElementById('psy_rh1').value) / 100;
    
    if (!isNaN(T1) && !isNaN(RH1)) {
        let p1 = getPsyProps(T1, RH1);
        document.getElementById('psy_psat1').innerText = Math.round(p1.P_sat).toLocaleString();
        document.getElementById('psy_h1').innerText = p1.h.toFixed(2);
        document.getElementById('psy_w1').innerText = p1.w.toFixed(2);
        document.getElementById('psy_tdp1').innerText = p1.T_dp.toFixed(1);
    } else {
        document.getElementById('psy_psat1').innerText = "---";
        document.getElementById('psy_h1').innerText = "---";
        document.getElementById('psy_w1').innerText = "---";
        document.getElementById('psy_tdp1').innerText = "---";
    }

    let T2 = parseFloat(document.getElementById('psy_t2').value);
    let RH2 = parseFloat(document.getElementById('psy_rh2').value) / 100;

    if (!isNaN(T2) && !isNaN(RH2)) {
        let p2 = getPsyProps(T2, RH2);
        document.getElementById('psy_psat2').innerText = Math.round(p2.P_sat).toLocaleString();
        document.getElementById('psy_h2').innerText = p2.h.toFixed(2);
        document.getElementById('psy_w2').innerText = p2.w.toFixed(2);
        document.getElementById('psy_tdp2').innerText = p2.T_dp.toFixed(1);
    } else {
        document.getElementById('psy_psat2').innerText = "---";
        document.getElementById('psy_h2').innerText = "---";
        document.getElementById('psy_w2').innerText = "---";
        document.getElementById('psy_tdp2').innerText = "---";
    }
}

// ==============================================
// LOGIC COIL ENGINEERING MASTER
// ==============================================
function toggleLFinEdit() {
    isLFinManual = !isLFinManual;
    const lFinInput = document.getElementById('l_fin_input');
    const lSuDungInput = document.getElementById('l_su_dung');
    const btn = document.getElementById('btn_edit_lfin');
    
    if (isLFinManual) {
        lFinInput.removeAttribute('readonly');
        lFinInput.style.backgroundColor = '#fff';
        lFinInput.style.borderColor = 'var(--edit)';
        lSuDungInput.setAttribute('readonly', true);
        btn.innerText = '[Khóa lại]';
        btn.classList.add('active');
    } else {
        lFinInput.setAttribute('readonly', true);
        lFinInput.style.backgroundColor = '#e9ecef';
        lFinInput.style.borderColor = '#ccc';
        lSuDungInput.removeAttribute('readonly');
        btn.innerText = '[Edit]';
        btn.classList.remove('active');
    }
    triggerDebounceCalc();
}

function toggleGioEdit() {
    isGioManual = !isGioManual;
    const gioInput = document.getElementById('gio_1_quat');
    const btn = document.getElementById('btn_edit_gio');
    
    if (isGioManual) {
        gioInput.removeAttribute('readonly');
        gioInput.style.backgroundColor = '#fff';
        gioInput.style.borderColor = 'var(--edit)';
        btn.innerText = '[Theo Bảng]';
        btn.classList.add('active');
    } else {
        gioInput.setAttribute('readonly', true);
        gioInput.style.backgroundColor = '#e9ecef';
        gioInput.style.borderColor = '#ccc';
        btn.innerText = '[Edit]';
        btn.classList.remove('active');
        updateFanAirflow(); 
    }
    triggerDebounceCalc();
}

function toggleReqFanEdit() {
    isReqFanManual = !isReqFanManual;
    const reqFanInput = document.getElementById('req_so_quat');
    const btn = document.getElementById('btn_edit_req_fan');

    if (isReqFanManual) {
        reqFanInput.removeAttribute('readonly');
        reqFanInput.style.backgroundColor = '#fff';
        btn.innerText = '[Đồng bộ]';
        btn.classList.add('active');
    } else {
        reqFanInput.setAttribute('readonly', true);
        reqFanInput.style.backgroundColor = '#e9ecef';
        btn.innerText = '[Edit]';
        btn.classList.remove('active');
        syncReqFan();
    }
    triggerDebounceCalc();
}

function syncReqFan() {
    if (!isReqFanManual) {
        const mainFanQty = document.getElementById('so_quat').value;
        document.getElementById('req_so_quat').value = mainFanQty;
    }
}

function togglePerfMode(mode) {
    perfMode = mode;
    const kwInput = document.getElementById('perf_kw');
    const stdInput = document.getElementById('perf_std');
    const btnKw = document.getElementById('btn_edit_kw');
    const btnStd = document.getElementById('btn_edit_std');

    if (mode === 'kw') {
        kwInput.removeAttribute('readonly');
        kwInput.style.backgroundColor = '#fff';
        kwInput.style.color = '#3c4043';
        btnKw.innerText = '[Khóa lại]';
        btnKw.classList.add('active');

        stdInput.setAttribute('readonly', true);
        stdInput.style.backgroundColor = '#e9ecef';
        stdInput.style.color = 'var(--success)';
        btnStd.innerText = '[Edit]';
        btnStd.classList.remove('active');
    } else {
        stdInput.removeAttribute('readonly');
        stdInput.style.backgroundColor = '#fff';
        stdInput.style.color = '#3c4043';
        btnStd.innerText = '[Khóa lại]';
        btnStd.classList.add('active');

        kwInput.setAttribute('readonly', true);
        kwInput.style.backgroundColor = '#e9ecef';
        kwInput.style.color = 'var(--success)';
        btnKw.innerText = '[Edit]';
        btnKw.classList.remove('active');
    }
    triggerDebounceCalc();
}

function toggleCircuitMode(mode) {
    circuitMode = mode;
    const cirInput = document.getElementById('circuits_input');
    const passInput = document.getElementById('passes_input');
    const btnCir = document.getElementById('btn_edit_circuits');
    const btnPass = document.getElementById('btn_edit_passes');

    if (mode === 'circuits') {
        cirInput.removeAttribute('readonly');
        cirInput.style.backgroundColor = '#fff';
        btnCir.innerText = '[Khóa lại]';
        btnCir.classList.add('active');

        passInput.setAttribute('readonly', true);
        passInput.style.backgroundColor = '#e9ecef';
        btnPass.innerText = '[Edit]';
        btnPass.classList.remove('active');
    } else {
        passInput.removeAttribute('readonly');
        passInput.style.backgroundColor = '#fff';
        btnPass.innerText = '[Khóa lại]';
        btnPass.classList.add('active');

        cirInput.setAttribute('readonly', true);
        cirInput.style.backgroundColor = '#e9ecef';
        btnCir.innerText = '[Edit]';
        btnCir.classList.remove('active');
    }
    triggerDebounceCalc();
}

function updateFanModels() {
    const brand = document.getElementById('fan_brand').value;
    const modelSel = document.getElementById('fan_model');
    modelSel.innerHTML = "";
    for (let key in FANS[brand]) {
        modelSel.innerHTML += `<option value="${key}">${FANS[brand][key].name}</option>`;
    }
    updateFanModes();
}
function updateFanModes() {
    const brand = document.getElementById('fan_brand').value;
    const model = document.getElementById('fan_model').value;
    const modeSel = document.getElementById('fan_mode');
    modeSel.innerHTML = "";
    for (let mode in FANS[brand][model].modes) {
        modeSel.innerHTML += `<option value="${mode}">${mode}</option>`;
    }
    updateFanPressures();
}
function updateFanPressures() {
    const brand = document.getElementById('fan_brand').value;
    const model = document.getElementById('fan_model').value;
    const mode = document.getElementById('fan_mode').value;
    const pressSel = document.getElementById('fan_pressure');
    pressSel.innerHTML = "";
    const pressData = FANS[brand][model].modes[mode];
    for (let pa in pressData) {
        pressSel.innerHTML += `<option value="${pa}">${pa} Pa</option>`;
    }
    updateFanAirflow();
}
function updateFanAirflow() {
    if (!isGioManual) {
        const brand = document.getElementById('fan_brand').value;
        const model = document.getElementById('fan_model').value;
        const mode = document.getElementById('fan_mode').value;
        const pa = document.getElementById('fan_pressure').value;
        document.getElementById('gio_1_quat').value = FANS[brand][model].modes[mode][pa];
    }
    triggerDebounceCalc();
}

function checkConstraints() {
    userVolConfig.isCustom = false;
    
    const loaiOng = document.getElementById('loai_ong').value;
    const L_m = parseFloat(document.getElementById('l_su_dung').value) || 0;
    const methodSelect = document.getElementById('phuong_phap');
    const optBeco = document.getElementById('opt_beco');

    if (loaiOng.includes('Inox') || L_m > 2.8) {
        methodSelect.value = 'Cắt';
        optBeco.disabled = true;
    } else {
        optBeco.disabled = false;
        if (loaiOng === 'D16_50') methodSelect.value = 'Cắt';
        else methodSelect.value = 'Bẻ Co';
    }
    triggerDebounceCalc();
}

function updateTotalN() {
    let total = 0;
    document.querySelectorAll('.seg-n').forEach(input => {
        total += parseFloat(input.value) || 0;
    });
    document.getElementById('hang_ngang').value = total;
}

function addSegment() {
    const container = document.getElementById('segment-container');
    const row = document.createElement('div');
    row.className = 'segment-row';
    row.innerHTML = `
        <div><label>Số ống ngang</label><input type="number" class="seg-n" value="1" min="1" oninput="updateTotalN(); triggerDebounceCalc();"></div>
        <div><label>Khe lá (mm)</label><input type="number" class="seg-pitch" value="8" step="0.1" min="0.1" oninput="triggerDebounceCalc()"></div>
        <button class="btn-remove" onclick="removeSegment(this)" style="margin-top: 22px;">X</button>
    `;
    container.appendChild(row);
    updateTotalN();
    triggerDebounceCalc();
}

function removeSegment(btn) {
    btn.parentElement.remove();
    updateTotalN();
    triggerDebounceCalc();
}

function calculateAll() {
    const loaiOng = document.getElementById('loai_ong').value;
    const method = document.getElementById('phuong_phap').value;
    const C = parseFloat(document.getElementById('hang_doc').value) || 0;
    const total_N = parseFloat(document.getElementById('hang_ngang').value) || 0;
    
    // Ghi chú: Lấy thông số kỹ thuật của loại ống được chọn từ TUBE_SPECS
    const spec = TUBE_SPECS[loaiOng] || TUBE_SPECS["D16_45"]; // Mặc định fallback
    const { d_ngoai, d_lo, d_dt, b_n, b_d, thick, h_rut, d_han } = spec;

    const thickness_san = 6;
    const k_co = 50; 
    let L_mm = 0;
    let L_fin = 0;

    if (!isLFinManual) {
        L_mm = parseFloat(document.getElementById('l_su_dung').value) * 1000 || 0;
        if (method === "Cắt") {
            L_fin = L_mm - (L_mm * h_rut) - thickness_san - d_han;
        } else {
            L_fin = ((L_mm * 2 - k_co) / 2) - d_han - (L_mm * h_rut) - thickness_san;
        }
        L_fin = Math.floor(L_fin); 
        document.getElementById('l_fin_input').value = L_fin;
    } else {
        L_fin = Math.floor(parseFloat(document.getElementById('l_fin_input').value) || 0); 
        if (method === "Cắt") {
            L_mm = (L_fin + thickness_san + d_han) / (1 - h_rut);
        } else {
            L_mm = (L_fin + k_co/2 + d_han + thickness_san) / (1 - h_rut);
        }
        document.getElementById('l_su_dung').value = (L_mm / 1000).toFixed(3);
    }

    const L_m = L_mm / 1000;

    let total_S_no_heater = 0;
    let total_S_with_heater = 0;
    let sum_N_over_pitch = 0;
    const rows = document.querySelectorAll('.segment-row');
    
    rows.forEach(row => {
        const N_seg = parseFloat(row.querySelector('.seg-n').value) || 0;
        const pitch = parseFloat(row.querySelector('.seg-pitch').value) || 0;
        
        if (N_seg > 0 && pitch > 0) {
            sum_N_over_pitch += (N_seg / pitch);
            const S_bao = (N_seg * b_n) * (C * b_d);
            const S_lo_ong = (Math.PI * Math.pow(d_lo/2, 2)) * (N_seg * C);
            const S_lo_dt = (d_dt > 0) ? (Math.PI * Math.pow(d_dt/2, 2)) * ((N_seg * C) / 2) : 0;
            const S_con = (Math.PI * d_lo * pitch) * (N_seg * C);
            
            const S_la_khong = ((S_bao - S_lo_ong) * 2) + S_con;
            const S_la_co = ((S_bao - S_lo_ong - S_lo_dt) * 2) + S_con;
            
            const so_la = L_fin / pitch;
            total_S_no_heater += (S_la_khong * so_la);
            total_S_with_heater += (S_la_co * so_la);
        }
    });

    const avgPitchContainer = document.getElementById('avg-pitch-container');
    if (avgPitchContainer) {
        if (rows.length > 1 && sum_N_over_pitch > 0 && total_N > 0) {
            const avg_pitch = total_N / sum_N_over_pitch;
            document.getElementById('avg-pitch-val').innerText = `${total_N} x ${avg_pitch.toFixed(2)} mm`;
            avgPitchContainer.style.display = 'grid';
        } else {
            avgPitchContainer.style.display = 'none';
        }
    }

    lastCalculatedAreaNoHeater = total_S_no_heater / 1000000;
    lastCalculatedAreaWithHeater = (d_dt > 0) ? (total_S_with_heater / 1000000) : lastCalculatedAreaNoHeater;

    const perfSrcSelect = document.getElementById('perf_area_src');
    if (d_dt > 0) {
        perfSrcSelect.options[1].disabled = false;
    } else {
        perfSrcSelect.value = 'no_heater';
        perfSrcSelect.options[1].disabled = true;
    }

    const L_tong_ong = L_m * total_N * C;

    // --- Tính Thể tích chứa dịch ---
    let vol_liter = 0;
    const def = VOL_DEFAULTS[loaiOng] || VOL_DEFAULTS["D16_45"];
    let v_tubeThick = userVolConfig.isCustom ? userVolConfig.tubeThick : def.tubeThick;
    
    let v_ubends = [];
    if (userVolConfig.isCustom) {
        v_ubends = userVolConfig.ubends;
    } else {
        v_ubends = [{ qty: (C * total_N), thick: def.uBendThick, len: def.uBendLen }];
    }
    
    let v_headers = userVolConfig.isCustom ? userVolConfig.headers : [];

    // 1. Thể tích ống thẳng
    const d_trong_thang = d_ngoai - (v_tubeThick * 2);
    const v_straight = (d_trong_thang > 0) ? ((Math.PI * Math.pow(d_trong_thang/2, 2)) * (L_tong_ong * 1000)) / 1000000 : 0;
    
    // 2. Thể tích co (U-bends)
    let v_ubend_total = 0;
    v_ubends.forEach(u => {
        if (u.qty > 0 && u.len > 0) {
            const d_trong_ubend = d_ngoai - (u.thick * 2);
            if (d_trong_ubend > 0) {
                v_ubend_total += ((Math.PI * Math.pow(d_trong_ubend/2, 2)) * (u.qty * u.len)) / 1000000;
            }
        }
    });
    
    // 3. Thể tích ống gộp (Headers)
    let v_hdr_total = 0;
    v_headers.forEach(h => {
        if (h.d > 0 && h.len > 0) {
            const d_trong_h = h.d - (h.thick * 2);
            if (d_trong_h > 0) {
                v_hdr_total += ((Math.PI * Math.pow(d_trong_h/2, 2)) * h.len) / 1000000;
            }
        }
    });

    vol_liter = v_straight + v_ubend_total + v_hdr_total;
    // -------------------------------

    const q_fan = parseFloat(document.getElementById('gio_1_quat').value) || 0;
    const n_fan = parseFloat(document.getElementById('so_quat').value) || 0;
    const tong_gio = q_fan * n_fan;

    const height_m = (C * b_d) / 1000;
    const width_m = L_fin / 1000;
    const v_wind = (height_m > 0 && width_m > 0) ? (tong_gio / (height_m * width_m * 3600)) : 0;

    document.getElementById('res_tong_gio').innerText = tong_gio.toLocaleString();
    document.getElementById('res_v_gio').innerText = v_wind.toFixed(2);
    document.getElementById('res_vol').innerText = vol_liter.toFixed(2);
    document.getElementById('res_l_tong').innerText = L_tong_ong.toFixed(1);
    document.getElementById('res_l_fin').innerText = L_fin; 
    
    document.getElementById('res_s_khong_dt').innerText = lastCalculatedAreaNoHeater.toFixed(2);
    if (d_dt > 0) {
        document.getElementById('res_s_co_dt').innerText = lastCalculatedAreaWithHeater.toFixed(2);
    } else {
        document.getElementById('res_s_co_dt').innerText = "---";
    }

    calculateRequiredAirflow();
    calculatePerformance();
    calculateCircuitry();
}

function calculateRequiredAirflow() {
    syncReqFan();

    const target_v = parseFloat(document.getElementById('target_v_wind').value) || 0;
    const n_fan_req = parseFloat(document.getElementById('req_so_quat').value) || 1;

    const C = parseFloat(document.getElementById('hang_doc').value) || 0;
    const loaiOng = document.getElementById('loai_ong').value;
    
    // Ghi chú: Tận dụng trực tiếp thông số bước dọc b_d từ TUBE_SPECS thay vì chuỗi if/else dài dòng
    const spec = TUBE_SPECS[loaiOng] || TUBE_SPECS["D16_45"];
    let b_d = spec.b_d;

    const L_fin = parseFloat(document.getElementById('l_fin_input').value) || 0;
    
    const height_m = (C * b_d) / 1000;
    const width_m = L_fin / 1000;

    const req_total = target_v * height_m * width_m * 3600;
    const req_per_fan = req_total / n_fan_req;

    document.getElementById('req_total_val').innerText = Math.round(req_total).toLocaleString();
    document.getElementById('req_per_fan_val').innerText = Math.round(req_per_fan).toLocaleString();
}

function calculatePerformance() {
    const src = document.getElementById('perf_area_src').value;
    const area = (src === 'with_heater') ? lastCalculatedAreaWithHeater : lastCalculatedAreaNoHeater;
    
    const kwInput = document.getElementById('perf_kw');
    const stdInput = document.getElementById('perf_std');

    if (area <= 0) return;

    if (perfMode === 'kw') {
        const kw = parseFloat(kwInput.value);
        if (!isNaN(kw) && kw > 0) {
            const std = area / kw;
            stdInput.value = std.toFixed(2);
        } else {
            stdInput.value = "";
        }
    } else {
        const std = parseFloat(stdInput.value);
        if (!isNaN(std) && std > 0) {
            const kw = area / std;
            kwInput.value = kw.toFixed(2);
        } else {
            kwInput.value = "";
        }
    }
}

function calculateCircuitry() {
    const C = parseFloat(document.getElementById('hang_doc').value) || 0;
    const N = parseFloat(document.getElementById('hang_ngang').value) || 0;
    const total_tubes = N * C;
    const L_m = parseFloat(document.getElementById('l_su_dung').value) || 0;

    const circuitsInput = document.getElementById('circuits_input');
    const passesInput = document.getElementById('passes_input');
    const skippedEl = document.getElementById('skipped_tubes_val');
    const lenEl = document.getElementById('len_per_circuit_val');

    if (total_tubes <= 0) return;

    let circuits = 0;
    let passes = 0;
    let skipped = 0;

    if (circuitMode === 'circuits') {
        circuits = parseInt(circuitsInput.value);
        if (!isNaN(circuits) && circuits > 0) {
            passes = Math.floor(total_tubes / circuits);
            skipped = total_tubes % circuits;
            passesInput.value = passes;
        } else {
            passesInput.value = "";
        }
    } else {
        passes = parseInt(passesInput.value);
        if (!isNaN(passes) && passes > 0) {
            circuits = Math.floor(total_tubes / passes);
            skipped = total_tubes % passes;
            circuitsInput.value = circuits;
        } else {
            circuitsInput.value = "";
        }
    }

    if (!isNaN(passes) && passes > 0) {
        const len = passes * L_m;
        lenEl.innerText = len.toFixed(2);
        skippedEl.innerText = skipped;
        if(skipped > 0) {
            skippedEl.style.color = "var(--accent)";
            skippedEl.style.fontWeight = "bold";
        } else {
            skippedEl.style.color = "";
            skippedEl.style.fontWeight = "";
        }
    } else {
        lenEl.innerText = "-";
        skippedEl.innerText = "-";
    }
}

let lastCalculatedFinMass = 0;
let lastCalculatedTubeMass = 0;

function syncMassSegments() {
    const container = document.getElementById('mass-segments-container');
    const sourceRows = document.querySelectorAll('#segment-container .segment-row');
    const destRows = container.querySelectorAll('.mass-seg-row');
    
    for (let i = destRows.length; i < sourceRows.length; i++) {
        const row = document.createElement('div');
        row.className = 'mass-seg-row grid';
        row.style.gridTemplateColumns = '1fr 1.5fr 1fr';
        row.style.background = '#f8f9fa';
        row.style.padding = '12px';
        row.style.borderRadius = '8px';
        row.style.border = '1px solid #ddd';
        row.innerHTML = `
            <div class="input-group" style="margin-bottom: 0;">
                <label style="color: var(--primary);">Khe lá:</label>
                <div class="mass-seg-label" style="font-weight: bold; margin-top: 5px;">-</div>
            </div>
            <div class="input-group" style="margin-bottom: 0;">
                <label>Vật liệu cánh:</label>
                <select class="mass-seg-material" onchange="updateMassSegThickness(this); triggerDebounceCalc();"></select>
            </div>
            <div class="input-group" style="margin-bottom: 0;">
                <label>Độ dày (mm):</label>
                <select class="mass-seg-thick" onchange="triggerDebounceCalc();"></select>
            </div>
        `;
        container.appendChild(row);
    }
    
    const currentDestRows = container.querySelectorAll('.mass-seg-row');
    for (let i = sourceRows.length; i < currentDestRows.length; i++) {
        currentDestRows[i].remove();
    }
    
    const updatedDestRows = container.querySelectorAll('.mass-seg-row');
    const loaiOng = document.getElementById('loai_ong').value;
    
    sourceRows.forEach((sRow, index) => {
        const dRow = updatedDestRows[index];
        const n = sRow.querySelector('.seg-n').value || 0;
        const p = sRow.querySelector('.seg-pitch').value || 0;
        dRow.querySelector('.mass-seg-label').innerText = `${n} x ${p} mm`;
        
        populateMassSegOptions(dRow, loaiOng);
    });
    
    // Đồng bộ thông tin Loại ống
    document.getElementById('mass_tube_type').innerText = loaiOng;
    if (typeof isTubeMassManual === 'undefined' || !isTubeMassManual) {
        const spec = TUBE_SPECS[loaiOng] || TUBE_SPECS["D16_45"];
        document.getElementById('mass_tube_thick').value = spec.thick || 0;
        document.getElementById('mass_tube_coeff').value = spec.mass_per_m || 0;
    }
}

let isTubeMassManual = false;
function toggleTubeMassEdit() {
    isTubeMassManual = !isTubeMassManual;
    const thickIn = document.getElementById('mass_tube_thick');
    const coeffIn = document.getElementById('mass_tube_coeff');
    const btnEdit = document.getElementById('btn_edit_tube_mass');
    
    if (isTubeMassManual) {
        thickIn.disabled = false;
        coeffIn.disabled = false;
        thickIn.style.background = "#fff";
        coeffIn.style.background = "#fff";
        btnEdit.innerText = "[Lưu]";
        btnEdit.style.color = "var(--success)";
    } else {
        thickIn.disabled = true;
        coeffIn.disabled = true;
        thickIn.style.background = "#f0f0f0";
        coeffIn.style.background = "#f0f0f0";
        btnEdit.innerText = "[Edit]";
        btnEdit.style.color = "var(--accent)";
        // Re-sync with config
        syncMassSegments();
    }
    triggerDebounceCalc();
}

function populateMassSegOptions(row, loaiOng) {
    const matSelect = row.querySelector('.mass-seg-material');
    const thickSelect = row.querySelector('.mass-seg-thick');
    
    const currentMat = matSelect.value;
    const currentThick = thickSelect.value;
    
    let materials = new Set();
    for (let key in FIN_WEIGHT_COEFFS) {
        if (key.startsWith(loaiOng + '_')) {
            const rest = key.substring(loaiOng.length + 1);
            const lastUnderscore = rest.lastIndexOf('_');
            if (lastUnderscore !== -1) {
                materials.add(rest.substring(0, lastUnderscore));
            }
        }
    }
    
    if (materials.size === 0) {
        materials.add("Nhôm thường");
    }
    
    matSelect.innerHTML = '';
    materials.forEach(m => {
        matSelect.innerHTML += `<option value="${m}">${m}</option>`;
    });
    
    if (materials.has(currentMat)) {
        matSelect.value = currentMat;
    }
    
    updateMassSegThickness(matSelect, currentThick);
}

function updateMassSegThickness(matSelect, retainThick) {
    const row = matSelect.closest('.mass-seg-row');
    const thickSelect = row.querySelector('.mass-seg-thick');
    const loaiOng = document.getElementById('loai_ong').value;
    const mat = matSelect.value;
    
    const currentThick = typeof retainThick === 'string' ? retainThick : thickSelect.value;
    
    let thicks = new Set();
    const prefix = `${loaiOng}_${mat}_`;
    for (let key in FIN_WEIGHT_COEFFS) {
        if (key.startsWith(prefix)) {
            thicks.add(key.substring(prefix.length));
        }
    }
    
    if (thicks.size === 0) {
        thicks.add("0.15");
    }
    
    thickSelect.innerHTML = '';
    thicks.forEach(t => {
        thickSelect.innerHTML += `<option value="${t}">${t}</option>`;
    });
    
    if (thicks.has(currentThick)) {
        thickSelect.value = currentThick;
    }
}

function calculateMass() {
    const loaiOng = document.getElementById('loai_ong').value;
    const C = parseFloat(document.getElementById('hang_doc').value) || 0;
    const L_fin = parseFloat(document.getElementById('l_fin_input').value) || 0;
    
    let total_fin_mass = 0;
    const sourceRows = document.querySelectorAll('#segment-container .segment-row');
    const massRows = document.querySelectorAll('#mass-segments-container .mass-seg-row');
    
    let errorMsg = '';

    sourceRows.forEach((sRow, index) => {
        const mRow = massRows[index];
        if (!mRow) return;

        const N_seg = parseFloat(sRow.querySelector('.seg-n').value) || 0;
        const pitch = parseFloat(sRow.querySelector('.seg-pitch').value) || 0;
        
        const material = mRow.querySelector('.mass-seg-material').value;
        const thick = parseFloat(mRow.querySelector('.mass-seg-thick').value) || 0;

        if (N_seg > 0 && pitch > 0) {
            const key = `${loaiOng}_${material}_${thick}`;
            let coeff = FIN_WEIGHT_COEFFS[key];
            
            if (coeff === undefined) {
                coeff = 0;
                errorMsg = `Không tìm thấy hệ số khối lượng cho: ${loaiOng}, ${material}, dày ${thick}mm.\nVui lòng kiểm tra lại cấu hình trong trang Quản Trị.`;
            }

            const so_la = L_fin / pitch;
            const mass_seg = coeff * N_seg * C * so_la;
            total_fin_mass += mass_seg;
        }
    });

    if (errorMsg) {
        alert(errorMsg);
    }

    // Tính khối lượng ống
    const L_tong_ong = parseFloat(document.getElementById('res_l_tong').innerText) || 0;
    const mass_per_m = parseFloat(document.getElementById('mass_tube_coeff').value) || 0;
    
    let total_tube_mass = 0;
    if (mass_per_m > 0) {
        total_tube_mass = L_tong_ong * mass_per_m;
    }

    lastCalculatedFinMass = total_fin_mass;
    lastCalculatedTubeMass = total_tube_mass;

    document.getElementById('res_mass_fin').innerText = total_fin_mass.toFixed(2);
    document.getElementById('res_mass_tube').innerText = total_tube_mass.toFixed(2);
}

// ==============================================
// LOGIC THỂ TÍCH CHỨA DỊCH (VOLUME SETTINGS)
// ==============================================
function getVolDefaults() {
    const loaiOng = document.getElementById('loai_ong').value;
    return VOL_DEFAULTS[loaiOng] || VOL_DEFAULTS["D16_45"];
}

function openVolumeSettings() {
    const def = getVolDefaults();
    const C = parseFloat(document.getElementById('hang_doc').value) || 0;
    const N = parseFloat(document.getElementById('hang_ngang').value) || 0;
    
    if (!userVolConfig.isCustom) {
        document.getElementById('vol_tube_thick').value = def.tubeThick;
        
        const uContainer = document.getElementById('ubend-container');
        uContainer.innerHTML = '';
        addUBendRow(C * N, def.uBendThick, def.uBendLen);
        
        const container = document.getElementById('header-container');
        container.innerHTML = '';
        addHeaderPipe();
        addHeaderPipe();
    } else {
        document.getElementById('vol_tube_thick').value = userVolConfig.tubeThick;
        
        const uContainer = document.getElementById('ubend-container');
        uContainer.innerHTML = '';
        if (userVolConfig.ubends.length === 0) {
            addUBendRow(C * N, def.uBendThick, def.uBendLen);
        } else {
            userVolConfig.ubends.forEach(u => addUBendRow(u.qty, u.thick, u.len));
        }
        
        const container = document.getElementById('header-container');
        container.innerHTML = '';
        if (userVolConfig.headers.length === 0) {
            addHeaderPipe();
            addHeaderPipe();
        } else {
            userVolConfig.headers.forEach(h => {
                const row = document.createElement('div');
                row.className = 'header-row';
                row.innerHTML = `
                    <div><label>ĐK ngoài (mm)</label><input type="number" class="hdr-d" value="${h.d || ''}" min="0" step="0.1"></div>
                    <div><label>Độ dày (mm)</label><input type="number" class="hdr-thick" value="${h.thick || ''}" min="0" step="0.01"></div>
                    <div><label>Chiều dài (mm)</label><input type="number" class="hdr-len" value="${h.len || ''}" min="0" step="1"></div>
                    <button class="btn-remove" onclick="removeHeaderPipe(this)" style="margin-top: 15px;">X</button>
                `;
                container.appendChild(row);
            });
        }
    }
    
    document.getElementById('vol-modal').style.display = 'flex';
}

function closeVolumeSettings() {
    document.getElementById('vol-modal').style.display = 'none';
}

function addUBendRow(qty = '', thick = '', len = '') {
    const container = document.getElementById('ubend-container');
    const row = document.createElement('div');
    row.className = 'header-row';
    row.innerHTML = `
        <div><label>SL Co</label><input type="number" class="ub-qty" value="${qty}" min="0" step="1"></div>
        <div><label>Độ dày (mm)</label><input type="number" class="ub-thick" value="${thick}" min="0" step="0.01"></div>
        <div><label>Dài 1 co (mm)</label><input type="number" class="ub-len" value="${len}" min="0" step="1"></div>
        <button class="btn-remove" onclick="removeUBendRow(this)" style="margin-top: 15px;">X</button>
    `;
    container.appendChild(row);
}

function removeUBendRow(btn) {
    btn.parentElement.remove();
}

function addHeaderPipe() {
    const container = document.getElementById('header-container');
    const row = document.createElement('div');
    row.className = 'header-row';
    row.innerHTML = `
        <div><label>ĐK ngoài (mm)</label><input type="number" class="hdr-d" min="0" step="0.1"></div>
        <div><label>Độ dày (mm)</label><input type="number" class="hdr-thick" min="0" step="0.01"></div>
        <div><label>Chiều dài (mm)</label><input type="number" class="hdr-len" min="0" step="1"></div>
        <button class="btn-remove" onclick="removeHeaderPipe(this)" style="margin-top: 15px;">X</button>
    `;
    container.appendChild(row);
}

function removeHeaderPipe(btn) {
    btn.parentElement.remove();
}

function applyVolumeSettings() {
    userVolConfig.isCustom = true;
    userVolConfig.tubeThick = parseFloat(document.getElementById('vol_tube_thick').value) || 0;
    
    userVolConfig.ubends = [];
    document.querySelectorAll('#ubend-container .header-row').forEach(row => {
        const qty = parseFloat(row.querySelector('.ub-qty').value) || 0;
        const thick = parseFloat(row.querySelector('.ub-thick').value) || 0;
        const len = parseFloat(row.querySelector('.ub-len').value) || 0;
        if (qty > 0 || len > 0) {
            userVolConfig.ubends.push({ qty, thick, len });
        } else {
            userVolConfig.ubends.push({ qty: '', thick: '', len: '' }); // keep empty lines
        }
    });
    
    userVolConfig.headers = [];
    document.querySelectorAll('#header-container .header-row').forEach(row => {
        const d = parseFloat(row.querySelector('.hdr-d').value) || 0;
        const thick = parseFloat(row.querySelector('.hdr-thick').value) || 0;
        const len = parseFloat(row.querySelector('.hdr-len').value) || 0;
        if (d > 0 && len > 0) {
            userVolConfig.headers.push({ d, thick, len });
        } else {
            userVolConfig.headers.push({ d: '', thick: '', len: '' }); // keep empty lines
        }
    });
    
    closeVolumeSettings();
    triggerDebounceCalc();
}

function resetVolumeSettings() {
    userVolConfig.isCustom = false;
    userVolConfig.ubends = [];
    userVolConfig.headers = [];
    openVolumeSettings(); // Refresh inputs on UI to show defaults
    // triggerDebounceCalc(); // Don't trigger calc yet, let them hit Save if they want to apply, or we can just apply immediately.
    // Actually, setting isCustom = false means if we calculate now, it uses defaults. Let's do it immediately for better UX.
    triggerDebounceCalc();
}

// ==============================================
// LOGIC QUẢN TRỊ ADMIN
// ==============================================
function promptAdminLogin() {
    if (isAdminLoggedIn) {
        openAdminPage();
    } else {
        document.getElementById('admin_user').value = '';
        document.getElementById('admin_pass').value = '';
        document.getElementById('admin-error').style.display = 'none';
        document.getElementById('admin-login-modal').style.display = 'flex';
        setTimeout(() => document.getElementById('admin_user').focus(), 100);
    }
}

function closeAdminLogin() {
    document.getElementById('admin-login-modal').style.display = 'none';
}

function verifyAdminLogin() {
    const user = document.getElementById('admin_user').value;
    const pass = document.getElementById('admin_pass').value;
    
    let isValid = false;
    for (let acc of ADMIN_ACCOUNTS) {
        if (acc.user === user && acc.pass === pass) {
            isValid = true;
            break;
        }
    }
    
    if (isValid) {
        isAdminLoggedIn = true;
        closeAdminLogin();
        openAdminPage();
    } else {
        document.getElementById('admin-error').style.display = 'block';
    }
}

function openAdminPage() {
    switchTab('admin');
    
    // Load data into inputs
    const accContainer = document.getElementById('admin-accounts-container');
    accContainer.innerHTML = '';
    ADMIN_ACCOUNTS.forEach(acc => {
        addAdminAccountRow(acc.user, acc.pass);
    });
    document.getElementById('admin_master_change').dataset.val = MASTER_KEY_CHANGE_PIN;
    document.getElementById('admin_master_change').value = maskString(MASTER_KEY_CHANGE_PIN);
    
    document.getElementById('admin_master_keep').dataset.val = MASTER_KEY_KEEP_PIN;
    document.getElementById('admin_master_keep').value = maskString(MASTER_KEY_KEEP_PIN);
    
    const container = document.getElementById('admin-pins-container');
    container.innerHTML = '';
    ROTATING_PINS.forEach(pin => {
        addAdminPinRow(pin.hint, pin.code);
    });

    renderAdminTubeSpecs();
    renderAdminFinCoeffs();
}

function renderAdminTubeSpecs() {
    const container = document.getElementById('admin-tube-container');
    container.innerHTML = '';
    
    for (let key in TUBE_SPECS) {
        addAdminTubeSpecRow(key, TUBE_SPECS[key]);
    }
}

function addAdminTubeSpecRow(key = '', s = { d_ngoai: 0, d_lo: 0, d_dt: 0, b_n: 0, b_d: 0, thick: 0, h_rut: 0, d_han: 0, mass_per_m: 0 }) {
    const container = document.getElementById('admin-tube-container');
    const row = document.createElement('div');
    row.className = 'admin-spec-card';
    row.style.background = '#f8f9fa';
    row.style.padding = '8px 12px';
    row.style.borderRadius = '8px';
    row.style.border = '1px solid #ddd';
    
    row.innerHTML = `
        <details>
            <summary style="font-weight:bold; cursor:pointer; padding: 5px 0; outline: none; display: flex; justify-content: space-between; align-items: center;">
                <span>Khuôn ống: <span class="sum-key">${key || 'Mới'}</span></span>
                <button class="btn-remove" style="padding: 2px 8px;" onclick="this.closest('.admin-spec-card').remove(); event.preventDefault();">X</button>
            </summary>
            <div class="grid" style="grid-template-columns: 1fr 1fr; margin-top: 15px;">
                <div class="input-group"><label>Mã ống</label><input type="text" class="t-key" value="${key}" oninput="this.closest('details').querySelector('.sum-key').innerText = this.value || 'Mới'"></div>
                <div class="input-group"><label>D ngoài</label><input type="number" step="0.1" class="t-dn" value="${s.d_ngoai}"></div>
                <div class="input-group"><label>D lỗ</label><input type="number" step="0.1" class="t-dl" value="${s.d_lo}"></div>
                <div class="input-group"><label>D lỗ ĐT</label><input type="number" step="0.1" class="t-ddt" value="${s.d_dt}"></div>
                <div class="input-group"><label>Bước ngang</label><input type="number" step="0.1" class="t-bn" value="${s.b_n}"></div>
                <div class="input-group"><label>Bước dọc</label><input type="number" step="0.1" class="t-bd" value="${s.b_d}"></div>
                <div class="input-group"><label>Độ dày (mm)</label><input type="number" step="0.01" class="t-th" value="${s.thick}"></div>
                <div class="input-group"><label>Hệ số rút</label><input type="number" step="0.001" class="t-hr" value="${s.h_rut}"></div>
                <div class="input-group"><label>Dài mối hàn</label><input type="number" step="1" class="t-dh" value="${s.d_han}"></div>
                <div class="input-group"><label>Khối lượng (kg/1m ống)</label><input type="number" step="0.0001" class="t-massm" value="${s.mass_per_m || 0}"></div>
            </div>
        </details>
    `;
    container.appendChild(row);
}

function renderAdminFinCoeffs() {
    const container = document.getElementById('admin-fin-container');
    container.innerHTML = '';
    
    for (let key in FIN_WEIGHT_COEFFS) {
        const parts = key.split('_');
        let loaiOng = parts[0];
        
        // Cố gắng tìm mã ống chính xác nếu có chứa dấu gạch dưới (VD: D16_45)
        const possibleTubes = Object.keys(TUBE_SPECS).sort((a,b) => b.length - a.length);
        for(let t of possibleTubes) {
            if (key.startsWith(t + '_')) {
                loaiOng = t;
                break;
            }
        }
        
        const rest = key.substring(loaiOng.length + 1);
        const lastUnderscore = rest.lastIndexOf('_');
        const material = rest.substring(0, lastUnderscore);
        const thick = rest.substring(lastUnderscore + 1);
        const coeff = FIN_WEIGHT_COEFFS[key];
        
        addAdminFinCoeffRow(loaiOng, material, thick, coeff);
    }
}

function addAdminFinCoeffRow(loaiOng = '', material = '', thick = '', coeff = 0) {
    const container = document.getElementById('admin-fin-container');
    const row = document.createElement('div');
    row.className = 'admin-fin-card';
    row.style.background = '#f8f9fa';
    row.style.padding = '8px 12px';
    row.style.borderRadius = '8px';
    row.style.border = '1px solid #ddd';
    
    row.innerHTML = `
        <details>
            <summary style="font-weight:bold; cursor:pointer; padding: 5px 0; outline: none; display: flex; justify-content: space-between; align-items: center;">
                <span>Hệ số: <span class="sum-text">${loaiOng} - ${material} - ${thick}</span></span>
                <button class="btn-remove" style="padding: 2px 8px;" onclick="this.closest('.admin-fin-card').remove(); event.preventDefault();">X</button>
            </summary>
            <div class="grid" style="grid-template-columns: 1fr 1fr; margin-top: 15px;">
                <div class="input-group"><label>Mã ống (VD: D16_45)</label><input type="text" class="f-loai" value="${loaiOng}" oninput="updateFinSummary(this)"></div>
                <div class="input-group"><label>Vật liệu (VD: Nhôm thường)</label><input type="text" class="f-mat" value="${material}" oninput="updateFinSummary(this)"></div>
                <div class="input-group"><label>Độ dày (mm)</label><input type="number" step="0.01" class="f-th" value="${thick}" oninput="updateFinSummary(this)"></div>
                <div class="input-group"><label>Hệ số</label><input type="number" step="0.00001" class="f-co" value="${coeff}"></div>
            </div>
        </details>
    `;
    container.appendChild(row);
}

function updateFinSummary(el) {
    const card = el.closest('.admin-fin-card');
    const loai = card.querySelector('.f-loai').value || '?';
    const mat = card.querySelector('.f-mat').value || '?';
    const th = card.querySelector('.f-th').value || '?';
    card.querySelector('.sum-text').innerText = `${loai} - ${mat} - ${th}`;
}

function maskString(str) {
    if (!str) return '';
    if (str.length <= 2) return str;
    return str[0] + '*'.repeat(str.length - 2) + str[str.length - 1];
}

function addAdminPinRow(hint = '', code = '') {
    const container = document.getElementById('admin-pins-container');
    const row = document.createElement('div');
    row.className = 'header-row';
    row.style.gridTemplateColumns = '1fr 1fr 35px';
    const maskedCode = maskString(code);
    row.innerHTML = `
        <div><label>Gợi ý (Hint)</label><input type="text" class="pin-hint-in" value="${hint}"></div>
        <div><label>Mã PIN (Code)</label><input type="text" class="pin-code-in" data-val="${code}" value="${maskedCode}" onfocus="this.value = this.dataset.val || ''" onblur="this.dataset.val = this.value; this.value = maskString(this.value)"></div>
        <button class="btn-remove" onclick="removeAdminPinRow(this)" style="margin-top: 15px;">X</button>
    `;
    container.appendChild(row);
}

function removeAdminPinRow(btn) {
    btn.parentElement.remove();
}

function addAdminAccountRow(user = '', pass = '') {
    const container = document.getElementById('admin-accounts-container');
    const row = document.createElement('div');
    row.className = 'header-row admin-acc-card';
    row.style.gridTemplateColumns = '1fr 1fr 35px';
    const maskedPass = maskString(pass);
    row.innerHTML = `
        <div><label>Tài khoản</label><input type="text" class="acc-user-in" value="${user}"></div>
        <div><label>Mật khẩu</label><input type="text" class="acc-pass-in" data-val="${pass}" value="${maskedPass}" onfocus="this.value = this.dataset.val || ''" onblur="this.dataset.val = this.value; this.value = maskString(this.value)"></div>
        <button class="btn-remove" onclick="removeAdminAccountRow(this)" style="margin-top: 15px;">X</button>
    `;
    container.appendChild(row);
}

function removeAdminAccountRow(btn) {
    const container = document.getElementById('admin-accounts-container');
    if (container.querySelectorAll('.admin-acc-card').length <= 1) {
        alert("Phải có ít nhất 1 tài khoản quản trị để không bị khóa hệ thống!");
        return;
    }
    btn.parentElement.remove();
}

function saveAdminData() {
    const mChange = document.getElementById('admin_master_change');
    const mKeep = document.getElementById('admin_master_keep');
    
    // Nếu ô đang blur thì dataset.val sẽ chứa giá trị thực, nếu đang focus thì chính value là giá trị thực
    const newChange = mChange.dataset.val || mChange.value;
    const newKeep = mKeep.dataset.val || mKeep.value;
    
    let newPins = [];
    document.querySelectorAll('#admin-pins-container .header-row').forEach(row => {
        const hint = row.querySelector('.pin-hint-in').value;
        const codeInput = row.querySelector('.pin-code-in');
        const code = codeInput.dataset.val || codeInput.value;
        if (hint || code) {
            newPins.push({ hint, code });
        }
    });
    
    if (newPins.length === 0) {
        alert("Phải có ít nhất 1 mã PIN!");
        return;
    }
    
    if (!newChange || !newKeep) {
        alert("Không được để trống Master Key!");
        return;
    }
    
    let newAccounts = [];
    document.querySelectorAll('#admin-accounts-container .admin-acc-card').forEach(row => {
        const user = row.querySelector('.acc-user-in').value.trim();
        const passInput = row.querySelector('.acc-pass-in');
        const pass = passInput.dataset.val || passInput.value;
        if (user && pass) {
            newAccounts.push({ user, pass });
        }
    });
    
    if (newAccounts.length === 0) {
        alert("Danh sách tài khoản Admin không hợp lệ! Bắt buộc có ít nhất 1 tài khoản.");
        return;
    }
    
    const parsedTubes = {};
    document.querySelectorAll('#admin-tube-container .admin-spec-card').forEach(card => {
        const key = card.querySelector('.t-key').value.trim();
        if (key) {
            parsedTubes[key] = {
                d_ngoai: parseFloat(card.querySelector('.t-dn').value) || 0,
                d_lo: parseFloat(card.querySelector('.t-dl').value) || 0,
                d_dt: parseFloat(card.querySelector('.t-ddt').value) || 0,
                b_n: parseFloat(card.querySelector('.t-bn').value) || 0,
                b_d: parseFloat(card.querySelector('.t-bd').value) || 0,
                thick: parseFloat(card.querySelector('.t-th').value) || 0,
                h_rut: parseFloat(card.querySelector('.t-hr').value) || 0,
                d_han: parseFloat(card.querySelector('.t-dh').value) || 0,
                mass_per_m: parseFloat(card.querySelector('.t-massm').value) || 0
            };
        }
    });

    const parsedFins = {};
    document.querySelectorAll('#admin-fin-container .admin-fin-card').forEach(card => {
        const loai = card.querySelector('.f-loai').value.trim();
        const mat = card.querySelector('.f-mat').value.trim();
        const th = parseFloat(card.querySelector('.f-th').value) || 0;
        const co = parseFloat(card.querySelector('.f-co').value) || 0;
        if (loai && mat && th) {
            const key = `${loai}_${mat}_${th}`;
            parsedFins[key] = co;
        }
    });

    TUBE_SPECS = parsedTubes;
    FIN_WEIGHT_COEFFS = parsedFins;
    MASTER_KEY_CHANGE_PIN = newChange;
    MASTER_KEY_KEEP_PIN = newKeep;
    ROTATING_PINS = newPins;
    ADMIN_ACCOUNTS = newAccounts;
    
    // Lưu tạm vào biến nhớ
    window.GT_CONFIG = {
        MASTER_KEY_CHANGE_PIN: MASTER_KEY_CHANGE_PIN,
        MASTER_KEY_KEEP_PIN: MASTER_KEY_KEEP_PIN,
        ADMIN_ACCOUNTS: ADMIN_ACCOUNTS,
        ROTATING_PINS: ROTATING_PINS,
        TUBE_SPECS: TUBE_SPECS,
        FIN_WEIGHT_COEFFS: FIN_WEIGHT_COEFFS
    };
    
    // Tạo nội dung file config.js
    let configContent = "window.GT_CONFIG = " + JSON.stringify(window.GT_CONFIG, null, 4) + ";\n";
    
    // Tạo và tải file
    const dataStr = "data:text/javascript;charset=utf-8," + encodeURIComponent(configContent);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "config.js");
    document.body.appendChild(downloadAnchorNode); 
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    alert("Đã tạo file config.js! Vui lòng chép đè file này vào thư mục chứa mã nguồn trên server của bạn để cập nhật cấu hình cho tất cả người dùng.");
    
    // Nếu app đang khoá PIN, update lại cái gợi ý hiện tại nếu có
    const pinIndexStr = decodeData(localStorage.getItem(STORAGE_PREFIX + 'pi'));
    let pinIndex = parseInt(pinIndexStr || "0");
    if (pinIndex >= ROTATING_PINS.length) {
        pinIndex = 0;
        localStorage.setItem(STORAGE_PREFIX + 'pi', encodeData(pinIndex.toString()));
    }
    const currentData = ROTATING_PINS[pinIndex];
    if (document.getElementById('pin-hint-display')) {
        document.getElementById('pin-hint-display').innerText = currentData.hint + " - ****";
    }
}

// ==============================================
// LOGIC LƯU LỊCH SỬ THIẾT KẾ
// ==============================================
let savedDesigns = [];
try {
    const stored = localStorage.getItem(STORAGE_PREFIX + 'designs');
    if (stored) savedDesigns = JSON.parse(stored);
} catch(e) {}

// Gọi update khi vừa load
setTimeout(updateSavedCount, 500);

function updateSavedCount() {
    const countSpan = document.getElementById('saved-count');
    if (countSpan) {
        countSpan.innerText = savedDesigns.length;
    }
}

function saveCurrentDesign() {
    // Hiển thị modal để nhập thông tin bổ sung
    document.getElementById('save_company').value = '';
    document.getElementById('save_type').value = '';
    document.getElementById('save_qty').value = '';
    document.getElementById('save_moichat').value = '';
    document.getElementById('save_vanhanh').value = '';
    document.getElementById('save_tmc').value = '';
    document.getElementById('save_tr').value = '';
    document.getElementById('save_note').value = '';
    document.getElementById('save-prompt-modal').style.display = 'flex';
}

function cancelSaveDesign() {
    document.getElementById('save-prompt-modal').style.display = 'none';
}

function confirmSaveDesign() {
    document.getElementById('save-prompt-modal').style.display = 'none';
    
    let company = document.getElementById('save_company').value.trim() || '---';
    let type = document.getElementById('save_type').value || '---';
    let qty = document.getElementById('save_qty').value || '---';
    let moichat = document.getElementById('save_moichat').value.trim() || '---';
    let vanhanh = document.getElementById('save_vanhanh').value.trim() || '---';
    let tmc = document.getElementById('save_tmc').value.trim() || '---';
    let tr = document.getElementById('save_tr').value.trim() || '---';
    let note = document.getElementById('save_note').value.trim() || '---';
    
    let headerText = `Công ty: ${company}\nLoại dàn: ${type} | Số lượng: ${qty}\nMôi chất: ${moichat} | Vận hành: ${vanhanh}\nTmc: ${tmc} °C | Tr: ${tr} °C\nGhi chú: ${note}`;

    const selOng = document.getElementById('loai_ong');
    const loaiOngText = selOng.options[selOng.selectedIndex].text;
    const N = document.getElementById('hang_ngang').value || 0;
    const C = document.getElementById('hang_doc').value || 0;
    const L = document.getElementById('l_su_dung').value || 0;
    
    const soQuat = document.getElementById('so_quat').value || 0;
    const selFanModel = document.getElementById('fan_model');
    const fanModelText = selFanModel.options[selFanModel.selectedIndex]?.text || '';
    const fanPressure = document.getElementById('fan_pressure').value || 0;
    
    // Khe lá
    let kheLaArr = [];
    document.querySelectorAll('.segment-row').forEach(row => {
        const segN = row.querySelector('.seg-n').value;
        const segPitch = row.querySelector('.seg-pitch').value;
        if (segN && segPitch) kheLaArr.push(`${segN} x ${segPitch} mm`);
    });
    const kheLaStr = kheLaArr.length > 0 ? kheLaArr.join('; ') : '---';
    
    // Diện tích trao đổi nhiệt
    let dttdn = document.getElementById('res_s_co_dt').innerText;
    if (dttdn === '---' || !dttdn) dttdn = document.getElementById('res_s_khong_dt').innerText;
    
    const kw = document.getElementById('perf_kw').value || '0';
    const std = document.getElementById('perf_std').value || '0';
    
    const passes = document.getElementById('passes_input').value || 0;
    const lenCircuit = document.getElementById('len_per_circuit_val').innerText || 0;
    
    const vGio = document.getElementById('res_v_gio').innerText || 0;
    const tongGio = document.getElementById('res_tong_gio').innerText || 0;
    const theTich = document.getElementById('res_vol').innerText || 0;
    
    const massFin1 = parseFloat(document.getElementById('res_mass_fin').innerText) || 0;
    const massTube1 = parseFloat(document.getElementById('res_mass_tube').innerText) || 0;
    const qtyNum = parseFloat(qty) || 1;
    const totalMassFin = massFin1 * qtyNum;
    const totalMassTube = massTube1 * qtyNum;
    
    const design = {
        title: `Ống ${loaiOngText}`,
        header: headerText,
        line1: `Ngang ${N} ống cao ${C} ống dài ${L}m`,
        line2: `${soQuat} quạt ${fanModelText}`,
        line3: `Khe lá: ${kheLaStr}`,
        line4: `DTTĐN: ${dttdn} m2`,
        line5: `Công suất: ${kw} kW`,
        line6: `Tiêu chuẩn: ${std} m2/kW`,
        line7: `Pass đi: ${passes} ống ${lenCircuit}m`,
        line8: `Tốc độ gió: ${vGio} m/s (${fanPressure}Pa)`,
        line9: `Tổng LL gió: ${tongGio} m3/h`,
        line10: `Thể tích chứa dịch: ${theTich} Lít`,
        line11: `Khối lượng lá: ${massFin1.toFixed(2)} kg/bộ x ${qty} = ${totalMassFin.toFixed(2)} kg`,
        line12: `Khối lượng ống: ${massTube1.toFixed(2)} kg/bộ x ${qty} = ${totalMassTube.toFixed(2)} kg`
    };
    
    savedDesigns.push(design);
    localStorage.setItem(STORAGE_PREFIX + 'designs', JSON.stringify(savedDesigns));
    
    updateSavedCount();
    alert("Đã lưu thiết kế thành công!");
}

function openHistoryTab() {
    switchTab('history');
    renderSavedDesigns();
}

function renderSavedDesigns() {
    const container = document.getElementById('saved-designs-container');
    container.innerHTML = '';
    
    if (savedDesigns.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#666;">Chưa có thiết kế nào được lưu trong phiên.</p>';
        return;
    }
    
    // Hiển thị từ cũ đến mới
    savedDesigns.forEach((d, index) => {
        const originalIndex = index;
        const stt = index + 1;
        const card = document.createElement('div');
        card.className = 'history-card';
        
        // Render header
        let headerHTML = '';
        if (d.header) {
            headerHTML = `<div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px dashed #ccc; color: #5f6368; font-size: 0.9rem; white-space: pre-wrap;">${d.header}</div>`;
        }

        let bodyContent = d.bodyHTML || `
                ${headerHTML}
                <div>${d.line1}</div>
                <div>${d.line2}</div>
                <div>${d.line3}</div>
                <div>${d.line4}</div>
                <div>${d.line5}</div>
                <div>${d.line6}</div>
                <div>${d.line7}</div>
                <div>${d.line8}</div>
                ${d.line9 ? `<div>${d.line9}</div>` : ''}
                ${d.line10 ? `<div>${d.line10}</div>` : ''}
                ${d.line11 ? `<div style="color: #6a1b9a; font-weight: bold; margin-top: 5px;">${d.line11}</div>` : ''}
                ${d.line12 ? `<div style="color: #283593; font-weight: bold;">${d.line12}</div>` : ''}
        `;
        
        card.innerHTML = `
            <div style="font-weight: bold; color: var(--secondary); margin-bottom: 5px; font-size: 1.1rem; padding-right: 90px;">
                <span class="card-stt" style="color: var(--accent);">[${stt}] </span><span class="card-title" style="outline: none;">${d.title}</span>
            </div>
            <div class="card-content" style="color: #3c4043; line-height: 1.6; font-size: 0.95rem; outline: none;">${bodyContent}</div>
            <button class="btn-unlock" style="position: absolute; top: 10px; right: 55px; width: 45px; height: 35px; padding: 0; font-size: 0.8rem; border-radius: 4px;" onclick="editSavedDesign(this, ${originalIndex})">SỬA</button>
            <button class="btn-remove" style="position: absolute; top: 10px; right: 10px; width: 35px; height: 35px;" onclick="removeSavedDesign(${originalIndex})">X</button>
        `;
        container.appendChild(card);
    });
}

function editSavedDesign(btn, originalIndex) {
    const card = btn.closest('.history-card');
    const contentDiv = card.querySelector('.card-content');
    const titleDiv = card.querySelector('.card-title');
    
    if (btn.innerText === 'SỬA') {
        contentDiv.contentEditable = "true";
        titleDiv.contentEditable = "true";
        contentDiv.style.border = "1px dashed var(--accent)";
        titleDiv.style.border = "1px dashed var(--accent)";
        contentDiv.style.padding = "5px";
        titleDiv.style.padding = "5px";
        contentDiv.focus();
        btn.innerText = 'LƯU';
        btn.style.background = 'var(--success)';
    } else {
        contentDiv.contentEditable = "false";
        titleDiv.contentEditable = "false";
        contentDiv.style.border = "none";
        titleDiv.style.border = "none";
        contentDiv.style.padding = "0";
        titleDiv.style.padding = "0";
        btn.innerText = 'SỬA';
        btn.style.background = 'var(--primary)';
        
        if (savedDesigns[originalIndex]) {
            savedDesigns[originalIndex].title = titleDiv.innerHTML;
            savedDesigns[originalIndex].bodyHTML = contentDiv.innerHTML;
            localStorage.setItem(STORAGE_PREFIX + 'designs', JSON.stringify(savedDesigns));
        }
    }
}

function removeSavedDesign(index) {
    if (confirm("Bạn có chắc chắn muốn xóa thông tin thiết kế này?")) {
        savedDesigns.splice(index, 1);
        localStorage.setItem(STORAGE_PREFIX + 'designs', JSON.stringify(savedDesigns));
        updateSavedCount();
        renderSavedDesigns();
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
});
