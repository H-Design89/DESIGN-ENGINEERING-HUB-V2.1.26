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

let FANS = (window.GT_CONFIG && window.GT_CONFIG.FANS) ? window.GT_CONFIG.FANS : {};
function switchTab(tabId) {
    document.querySelectorAll('.app-page').forEach(page => {
        page.classList.remove('active');
    });
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    const page = document.getElementById('page-' + tabId);
    if (page) page.classList.add('active');

    const tabBtn = document.querySelector(`.nav-tab[onclick="switchTab('${tabId}')"]`);
    if (tabBtn) tabBtn.classList.add('active');

    if(tabId === 'psychro' && typeof calculatePsychro === 'function') calculatePsychro();
}

let isAutoFilling = false;

function triggerDebounceCalc() {
    const resultCol = document.getElementById('result-container');
    resultCol.classList.add('updating');

    if (!isAutoFilling) {
        let autofillInput = document.getElementById('auto_fill_model');
        if (autofillInput && autofillInput.value) {
            autofillInput.value = '';
            enableAutoFillBtn();
        }
    }

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        syncMassSegments();
        calculateAll();
        resultCol.classList.remove('updating');
    }, 600);
}

function enableAutoFillBtn() {
    let btn = document.querySelector('button[onclick="fillFormFromModel()"]');
    if (btn) {
        btn.innerText = "GENERATE DATA";
        btn.style.background = "var(--primary)";
        btn.style.pointerEvents = "auto";
        btn.style.opacity = "1";
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

window.updateLFinModeUI = function() {
    const isStandard = document.getElementById('mode_standard').checked;
    const lblStd = document.getElementById('lbl_mode_standard');
    const lblCoil = document.getElementById('lbl_mode_coil');
    
    if (isStandard) {
        lblStd.style.background = 'var(--primary)';
        lblStd.style.color = 'white';
        lblCoil.style.background = 'transparent';
        lblCoil.style.color = '#555';
    } else {
        lblCoil.style.background = 'var(--primary)';
        lblCoil.style.color = 'white';
        lblStd.style.background = 'transparent';
        lblStd.style.color = '#555';
    }
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
window.targetPressure = "40";

function updateFanPressures() {
    const brand = document.getElementById('fan_brand').value;
    const model = document.getElementById('fan_model').value;
    const mode = document.getElementById('fan_mode').value;
    const pressSel = document.getElementById('fan_pressure');
    
    if (pressSel.value) {
        window.targetPressure = pressSel.value;
    }

    pressSel.innerHTML = "";
    const pressData = FANS[brand][model].modes[mode];
    let hasTarget = false;
    
    for (let pa in pressData) {
        if (pa === window.targetPressure) hasTarget = true;
        pressSel.innerHTML += `<option value="${pa}">${pa} Pa</option>`;
    }
    
    if (hasTarget) {
        pressSel.value = window.targetPressure;
    } else if (pressData["40"]) {
        pressSel.value = "40";
        window.targetPressure = "40";
    } else if (pressSel.options.length > 0) {
        window.targetPressure = pressSel.options[0].value;
    }

    updateFanAirflow();
}
function updateFanAirflow() {
    if (!isGioManual) {
        const brand = document.getElementById('fan_brand').value;
        const model = document.getElementById('fan_model').value;
        const mode = document.getElementById('fan_mode').value;
        const pressSel = document.getElementById('fan_pressure');
        const pa = pressSel.value;
        if (pa) {
            window.targetPressure = pa;
        }
        let val = parseFloat(FANS[brand][model].modes[mode][pa]) || 0;
        document.getElementById('gio_1_quat').value = val.toLocaleString('en-US');
    }
    triggerDebounceCalc();
}

function checkConstraints() {
    userVolConfig.isCustom = false;
    
    const loaiOng = document.getElementById('loai_ong').value;
    const L_m = parseFloat(document.getElementById('l_su_dung').value.replace(/,/g, '.')) || 0;
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

// ==========================================
// KHỞI TẠO DANH SÁCH ỐNG (INIT)
// ==========================================
function populateLoaiOng() {
    const select = document.getElementById('loai_ong');
    if (!select) return;
    
    const currentValue = select.value;
    const TUBE_NAMES = {
        "D16_45": "D16 ĐỒNG (45x45)",
        "D16_50": "D16 ĐỒNG (50x50)",
        "D127_31": "D12.7 ĐỒNG (31.75x27.5)",
        "D127_50": "D12.7 ĐỒNG (50x25)",
        "D96": "D9.6 ĐỒNG (25.4x22)",
        "Inox16": "D16 INOX (50x50)",
        "Inox16_45": "D16 INOX (45x45)",
        "Inox22": "D22 INOX (60x51.96)"
    };
    
    select.innerHTML = '';
    for (let key in TUBE_SPECS) {
        let displayName = TUBE_NAMES[key] || key;
        let option = document.createElement('option');
        option.value = key;
        option.innerText = displayName;
        select.appendChild(option);
    }
    
    if (TUBE_SPECS[currentValue]) {
        select.value = currentValue;
    }
}


// ==========================================
// THÔNG TIN CHI TIẾT QUẠT
// ==========================================
function showFanDetails() {
    const brand = document.getElementById('fan_brand').value;
    const model = document.getElementById('fan_model').value;
    
    if (brand && model && FANS[brand] && FANS[brand][model]) {
        const fan = FANS[brand][model];
        document.getElementById('fan-info-title').innerText = fan.name;
        
        let detailsStr = fan.details || '';
        let parts = detailsStr.split(' - ');
        let htmlStr = '<ul style="list-style-type: none; padding: 0; margin: 0;">';
        
        parts.forEach(part => {
            htmlStr += `<li style="margin-bottom: 8px; padding-left: 20px; position: relative;">
                            <span style="color: var(--primary); font-weight: bold; position: absolute; left: 0;">✓</span> 
                            ${part.trim()}
                        </li>`;
        });
        htmlStr += '</ul>';
        
        document.getElementById('fan-info-content').innerHTML = detailsStr ? htmlStr : '<i>Chưa có thông số chi tiết</i>';
        document.getElementById('fan-info-modal').style.display = 'flex';
    } else {
        alert('Vui lòng chọn Hãng và Model quạt hợp lệ trước!');
    }
}

// ==========================================
// TỰ ĐỘNG ĐIỀN TỪ MÃ MODEL
// ==========================================
function fillFormFromModel() {
    const code = document.getElementById('auto_fill_model').value.trim();
    if (!code) {
        alert("Vui lòng nhập mã Model.");
        return;
    }
    
    isAutoFilling = true;
    
    if (typeof decodeModelStr !== 'function') {
        alert("Không tìm thấy hàm dịch mã. Vui lòng thử lại.");
        isAutoFilling = false;
        return;
    }
    
    let decoded = decodeModelStr(code);
    
    function showDecodeError() {
        let btn = document.querySelector('button[onclick="fillFormFromModel()"]');
        if (btn) {
            btn.innerText = "KHÔNG NHẬN DIỆN ĐƯỢC";
            btn.style.background = "#f57c00"; // Vàng cam báo lỗi
            btn.style.pointerEvents = "none";
            btn.style.opacity = "1";
        }
        setTimeout(() => { isAutoFilling = false; }, 100);
    }

    if (decoded.error) {
        showDecodeError();
        return;
    }
    
    let raw = decoded.rawData;
    if (!raw || !raw.khuon) {
        showDecodeError();
        return;
    }

    // Map Khuôn -> loai_ong
    let moldMap = {
        "1": "D96",
        "2": "D127_31",
        "3": "D127_50",
        "4": "D16_45",
        "5": "D16_50",
        "6": "Inox16_45",
        "7": "Inox16"
    };
    
    if (raw.khuon && moldMap[raw.khuon]) {
        let selOng = document.getElementById('loai_ong');
        if (selOng) selOng.value = moldMap[raw.khuon];
    }
    
    // Quạt
    if (raw.loaiQuat) {
        let selBrand = document.getElementById('fan_brand');
        if (raw.loaiQuat === "ZA") selBrand.value = "ZA";
        else if (raw.loaiQuat === "TQ" || raw.loaiQuat === "MAER") selBrand.value = "TQ";
        else if (raw.loaiQuat === "KRUGER" || raw.loaiQuat === "KR") selBrand.value = "KRUGER";
        
        updateFanModels(); 
        
        let selModel = document.getElementById('fan_model');
        if (raw.dkQuat && selModel) {
            for (let i = 0; i < selModel.options.length; i++) {
                if (selModel.options[i].innerText.includes(raw.dkQuat) || selModel.options[i].value.includes(raw.dkQuat)) {
                    selModel.selectedIndex = i;
                    break;
                }
            }
        }
        updateFanModes();
    }
    
    if (raw.soQuat !== undefined) {
        let soQuatInput = document.getElementById('so_quat');
        if (soQuatInput) {
            soQuatInput.value = raw.soQuat;
            syncReqFan();
        }
    }
    
    // Kích thước (Cao, Ngang, Dài)
    if (raw.cao !== undefined && !isNaN(raw.cao)) {
        let hangDocInput = document.getElementById('hang_doc');
        if (hangDocInput) hangDocInput.value = raw.cao;
    }
    
    if (raw.dai !== undefined && !isNaN(raw.dai)) {
        let lSuDungInput = document.getElementById('l_su_dung');
        if (lSuDungInput) lSuDungInput.value = Number(raw.dai).toFixed(2);
    }
    
    // Khe lá
    if (raw.kheLa !== undefined && !isNaN(raw.kheLa)) {
        let container = document.getElementById('segment-container');
        if (container) {
            container.innerHTML = `
                <div class="segment-row">
                    <div><label>Số ống ngang</label><input type="number" class="seg-n" min="1" value="${raw.ngang || 6}" oninput="updateTotalN(); triggerDebounceCalc();"></div>
                    <div><label>Khe lá (mm)</label><input type="number" class="seg-pitch" min="0.1" value="${raw.kheLa}" step="0.1" oninput="triggerDebounceCalc()"></div>
                    <button class="btn-remove" onclick="removeSegment(this)" style="margin-top: 22px;">X</button>
                </div>
            `;
            updateTotalN();
        }
    } else if (raw.ngang !== undefined && !isNaN(raw.ngang)) {
         let segNs = document.querySelectorAll('.seg-n');
         if(segNs.length === 1) {
             segNs[0].value = raw.ngang;
             updateTotalN();
         }
    }
    
    checkConstraints();
    triggerDebounceCalc();
    
    let btn = document.querySelector('button[onclick="fillFormFromModel()"]');
    if (btn) {
        btn.innerText = "ĐÃ ĐIỀN!";
        btn.style.background = "#9e9e9e";
        btn.style.pointerEvents = "none";
        btn.style.opacity = "0.7";
    }
    
    setTimeout(() => {
        isAutoFilling = false;
    }, 100);
}
