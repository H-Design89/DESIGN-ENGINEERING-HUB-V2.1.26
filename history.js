// ==============================================
// LOGIC LƯU LỊCH SỬ THIẾT KẾ
// ==============================================
const STORAGE_PREFIX = "_gt_sec_";
let savedDesigns = [];
try {
    const stored = localStorage.getItem(STORAGE_PREFIX + 'designs');
    if (stored) savedDesigns = JSON.parse(stored);
} catch (e) { }

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
    document.getElementById('save_rh').value = '';
    if (document.getElementById('save_tach_am')) document.getElementById('save_tach_am').checked = false;
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
    let tachAmSave = document.getElementById('save_tach_am') ? document.getElementById('save_tach_am').checked : false;
    let typeDisplay = tachAmSave && type !== '---' ? type + " (Tách ẩm)" : type;

    const formatTemp = (val) => {
        if (!val || val === '---') return val;
        if (!isNaN(val) && val.trim() !== '') {
            let num = parseFloat(val);
            if (num > 0 && !val.startsWith('+')) return '+' + val;
        }
        return val;
    };

    let qty = document.getElementById('save_qty').value || '---';
    let moichat = document.getElementById('save_moichat').value.trim() || '---';
    let vanhanh = document.getElementById('save_vanhanh').value.trim() || '---';
    let tmc = formatTemp(document.getElementById('save_tmc').value.trim()) || '---';
    let tmcOutEl = document.getElementById('save_tmc_out');
    let tmc_out = (tmcOutEl && tmcOutEl.closest('.input-group').style.display !== 'none') ? formatTemp(tmcOutEl.value.trim()) : '';
    let tr = formatTemp(document.getElementById('save_tr').value.trim()) || '---';
    let rh = document.getElementById('save_rh').value.trim() || '---';
    let note = document.getElementById('save_note').value.trim() || '---';

    let tmcStr = tmc_out ? `Tmc: ${tmc} °C | Tmc ra: ${tmc_out} °C` : `Tmc: ${tmc} °C`;
    let headerText = `Công ty: ${company}\nLoại dàn: ${typeDisplay} | Số lượng: ${qty}\nMôi chất: ${moichat} | Vận hành: ${vanhanh}\n${tmcStr} | Tr: ${tr} °C | RH phòng: ${rh} %\nGhi chú: ${note}`;

    const selOng = document.getElementById('loai_ong');
    const loaiOngText = selOng.options[selOng.selectedIndex].text;
    const N = document.getElementById('hang_ngang').value || 0;
    const C = document.getElementById('hang_doc').value || 0;
    let numL = parseFloat(document.getElementById('l_su_dung').value.replace(/,/g, '.')) || 0;
    const L = Number.isInteger(numL) ? numL.toFixed(1) : numL.toString();

    const lFinModeEl = document.querySelector('input[name="l_fin_mode"]:checked');
    const lFinModeShort = (lFinModeEl && lFinModeEl.value === 'standard') ? 'S' : 'D';

    const soQuat = document.getElementById('so_quat').value || 0;
    const fanBrandVal = document.getElementById('fan_brand').value;
    const fanModelVal = document.getElementById('fan_model').value;
    let fanModelText = "";
    const FANS_DB = (window.GT_CONFIG && window.GT_CONFIG.FANS) ? window.GT_CONFIG.FANS : null;
    if (FANS_DB && FANS_DB[fanBrandVal] && FANS_DB[fanBrandVal][fanModelVal]) {
        fanModelText = FANS_DB[fanBrandVal][fanModelVal].name;
    } else {
        const selFanModel = document.getElementById('fan_model');
        fanModelText = selFanModel.options[selFanModel.selectedIndex]?.text || '';
    }
    const fanPressure = document.getElementById('fan_pressure').value || 0;

    const selFanMode = document.getElementById('fan_mode');
    let fanModeText = selFanMode ? selFanMode.value : "";
    if (fanModeText) {
        fanModeText = fanModeText.replace(/\s*\([^)]*\)/g, '').trim();
    }
    let modeShort = fanModeText ? ` - ${fanModeText}` : "";

    // Khe lá
    let kheLaArr = [];
    document.querySelectorAll('.segment-row').forEach(row => {
        const segN = row.querySelector('.seg-n').value;
        const segPitch = row.querySelector('.seg-pitch').value;
        if (segN && segPitch) kheLaArr.push(`${segN}x${segPitch} mm`);
    });
    let kheLaStr = kheLaArr.length > 0 ? kheLaArr.join('; ') : '---';
    const avgPitchEl = document.getElementById('avg-pitch-val');
    const avgPitchContainer = document.getElementById('avg-pitch-container');
    if (avgPitchEl && avgPitchEl.innerText !== '-' && avgPitchContainer && avgPitchContainer.style.display !== 'none') {
        const avgMatch = avgPitchEl.innerText.match(/x\s*([\d\.]+)\s*mm/);
        if (avgMatch) {
            let avgValue = parseFloat(avgMatch[1]);
            let avgTrunc = Math.round(avgValue * 100) / 100;
            kheLaStr += ` (TB: ${avgTrunc} mm)`;
        }
    }

    // Diện tích trao đổi nhiệt theo đánh giá hiệu suất
    let dttdn = "";
    const perfAreaSrc = document.getElementById('perf_area_src').value;
    if (perfAreaSrc === 'with_heater') {
        dttdn = document.getElementById('res_s_co_dt').innerText;
        if (dttdn === '---' || !dttdn) dttdn = document.getElementById('res_s_khong_dt').innerText; // Fallback
    } else {
        dttdn = document.getElementById('res_s_khong_dt').innerText;
    }

    const kw = document.getElementById('perf_kw').value || '0';
    const std = document.getElementById('perf_std').value || '0';

    const passes = document.getElementById('passes_input').value || 0;
    const lenCircuit = document.getElementById('len_per_circuit_val').innerText || 0;

    const vGio = document.getElementById('res_v_gio').innerText || 0;
    const tongGio = document.getElementById('res_tong_gio').innerText || 0;
    const theTich = document.getElementById('res_vol').innerText || 0;

    const massFin1 = parseFloat(document.getElementById('res_mass_fin').innerText.replace(/,/g, '')) || 0;
    const massTube1 = parseFloat(document.getElementById('res_mass_tube').innerText.replace(/,/g, '')) || 0;
    const qtyNum = parseFloat(qty) || 1;
    const totalMassFin = massFin1 * qtyNum;
    const totalMassTube = massTube1 * qtyNum;

    const design = {
        title: `Ống ${loaiOngText} <span style="font-size: 0.85rem; color: #000; font-weight: normal;">[${lFinModeShort}]</span>`,
        header: headerText,
        line1: `Ngang ${N} ống cao ${C} ống dài ${L}m`,
        line2: `${soQuat} quạt ${fanModelText}${modeShort}`,
        line3: `Khe lá: ${kheLaStr}`,
        line4: `DTTĐN: ${dttdn} m2`,
        line5: `Công suất: ${kw} kW`,
        line6: `Tiêu chuẩn: ${std} m2/kW`,
        line7: `Pass đi: ${passes} ống ${lenCircuit}m`,
        line8: `Tốc độ gió: ${vGio} m/s (${fanPressure}Pa)`,
        line9: `Tổng LL gió: ${tongGio} m3/h`,
        line10: `Thể tích chứa dịch: ${theTich} Lít`,
        line11: `Khối lượng lá: ${massFin1.toLocaleString('en-US', { maximumFractionDigits: 2 })} kg/bộ x ${qty} = ${totalMassFin.toLocaleString('en-US', { maximumFractionDigits: 2 })} kg`,
        line12: `Khối lượng ống: ${massTube1.toLocaleString('en-US', { maximumFractionDigits: 2 })} kg/bộ x ${qty} = ${totalMassTube.toLocaleString('en-US', { maximumFractionDigits: 2 })} kg`,
        createdAt: new Date().toLocaleString('vi-VN'),
        updatedAt: null
    };

    savedDesigns.push(design);
    localStorage.setItem(STORAGE_PREFIX + 'designs', JSON.stringify(savedDesigns));

    updateSavedCount();
}

function openHistoryTab() {
    switchTab('history');
    renderSavedDesigns();
    setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
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
            headerHTML = `<div style="color: #5f6368; font-size: 0.9rem; white-space: pre-wrap;">${d.header}</div><div style="color: #999; letter-spacing: 2px; margin: 4px 0;">----------</div>`;
        }

        let modelHTML = d.modelCode ? `<div style="font-weight: bold; color: var(--secondary); margin-bottom: 8px;">Model: ${d.modelCode}</div>` : '';

        let bodyContent = d.bodyHTML || `
                ${headerHTML}
                ${modelHTML}
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
            <div style="font-weight: bold; color: var(--secondary); margin-bottom: 5px; font-size: 1.1rem; padding-right: 310px;">
                <span class="card-stt" style="color: var(--accent);">[${stt}] </span><span class="card-title" style="outline: none;">${d.title}</span>
            </div>
            <div class="card-content" style="color: #3c4043; line-height: 1.6; font-size: 0.95rem; outline: none;">${bodyContent}</div>
            <div style="text-align: right; margin-top: 10px; font-size: 0.75rem; color: #999; user-select: none; border-top: 1px dashed #eee; padding-top: 5px;">
                Đã lưu: ${d.createdAt || 'N/A'} ${d.updatedAt ? `| Sửa lần cuối: ${d.updatedAt}` : ''}
            </div>
            <button class="btn-unlock" style="position: absolute; top: 10px; right: 200px; width: 95px; height: 35px; padding: 0; font-size: 0.8rem; border-radius: 4px; background: var(--secondary);" onclick="openExportModal(${originalIndex})">XUẤT TSKT</button>
            <button class="btn-unlock" style="position: absolute; top: 10px; right: 105px; width: 85px; height: 35px; padding: 0; font-size: 0.8rem; border-radius: 4px; background: var(--success);" onmouseover="this.style.background='#0b7a44'" onmouseout="this.style.background='var(--success)'" onclick="openModelGenerator(${originalIndex})">TẠO MODEL</button>
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
            savedDesigns[originalIndex].updatedAt = new Date().toLocaleString('vi-VN');
            localStorage.setItem(STORAGE_PREFIX + 'designs', JSON.stringify(savedDesigns));
            renderSavedDesigns(); // Re-render to show updated time
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

function openModelGenerator(index) {
    const d = savedDesigns[index];
    if (!d) return;

    // 1. Loại thiết bị [01]
    let loaiDan = ""; // Bỏ giá trị mặc định "TD"
    if (d.header) {
        if (d.header.includes("FCU")) loaiDan = "FCU";
        else if (d.header.includes("Dàn lạnh")) loaiDan = "TD";
        else if (d.header.includes("đông gió")) loaiDan = "CD";
        else if (d.header.includes("Dàn ngưng")) loaiDan = "DN";
        else if (d.header.includes("Dàn coil")) loaiDan = "DC";
    }

    // 2. Kính ống & Vật liệu ống -> Loại khuôn [03]
    let loaiKhuon = "";
    if (d.title) {
        let titleUpper = d.title.toUpperCase();
        if (titleUpper.includes("D9.6") && titleUpper.includes("25.4X22")) loaiKhuon = "1";
        else if (titleUpper.includes("D12.7") && titleUpper.includes("31.75X27.5")) loaiKhuon = "2";
        else if (titleUpper.includes("D12.7") && titleUpper.includes("50X25")) loaiKhuon = "3";
        else if (titleUpper.includes("D16 ĐỒNG") && titleUpper.includes("45X45")) loaiKhuon = "4";
        else if (titleUpper.includes("D16 ĐỒNG") && titleUpper.includes("50X50")) loaiKhuon = "5";
        else if (titleUpper.includes("D16 INOX") && titleUpper.includes("45X45")) loaiKhuon = "6";
        else if (titleUpper.includes("D16 INOX") && titleUpper.includes("50X50")) loaiKhuon = "7";
    }

    // 4. Môi chất [04]
    let moiChat = "";
    if (d.header) {
        let mcMatch = d.header.match(/Môi chất:\s*([^\n|]+)/i);
        if (mcMatch) {
            let mcVal = mcMatch[1].toLowerCase();
            if (mcVal.includes("nh3") || mcVal.includes("ammonia")) moiChat = "A";
            else if (mcVal.includes("nước") || mcVal.includes("nuoc") || mcVal.includes("water")) moiChat = "W";
            else if (mcVal.includes("glycol")) moiChat = "G";
            else if (mcVal.includes("r") || mcVal.includes("freon")) moiChat = "R";
        }
    }

    // 5. Vận hành [05]
    let vanHanh = "";
    if (d.header) {
        let vhLower = d.header.toLowerCase();
        if (vhLower.includes("bầu đổ") || vhLower.includes("dịch tràn")) vanHanh = "G";
        else if (vhLower.includes("bơm dịch")) vanHanh = "P";
        else if (vhLower.includes("lvs")) vanHanh = "L";
        else if (vhLower.includes("tiết lưu") || vhLower.includes("van")) vanHanh = "X";
    }

    // 6. Số lượng quạt [06], 7. Loại quạt [07], 8. ĐK Quạt [08]
    let loaiQuat = "Z";
    let soLuongQuat = "1";
    let dkQuat = "50";
    let dkQuatNum = 500;

    if (d.line2 && d.line2.includes("quạt")) {
        let slMatch = d.line2.match(/^(\d+)\s+quạt/);
        if (slMatch) soLuongQuat = slMatch[1];

        if (d.line2.includes("FN")) loaiQuat = "Z";
        else if (d.line2.includes("TDA")) loaiQuat = "KR";
        else if (d.line2.includes("YSWF") || d.line2.includes("YDWF")) loaiQuat = "M";

        let dkMatch = d.line2.match(/Ø(\d+)/);
        if (dkMatch) {
            dkQuatNum = parseInt(dkMatch[1]);
            dkQuat = (dkQuatNum / 10).toString();
        } else {
            let fnMatch = d.line2.match(/FN0(\d{2})/);
            if (fnMatch) {
                dkQuatNum = parseInt(fnMatch[1]) * 10;
                dkQuat = (dkQuatNum / 10).toString();
            } else {
                let tdaMatch = d.line2.match(/TDA(\d{3})/);
                if (tdaMatch) {
                    dkQuatNum = parseInt(tdaMatch[1]);
                    dkQuat = (dkQuatNum / 10).toString();
                }
            }
        }
    }

    // 10. Cấu hình ống
    let ngang = 0, cao = 0, dai = 0;
    if (d.line1) {
        let ngangMatch = d.line1.match(/Ngang\s+([\d\.]+)/);
        let caoMatch = d.line1.match(/cao\s+([\d\.]+)/);
        let daiMatch = d.line1.match(/dài\s+([\d\.]+)/);

        if (ngangMatch) ngang = parseInt(ngangMatch[1]);
        if (caoMatch) cao = parseInt(caoMatch[1]);
        if (daiMatch) dai = parseFloat(daiMatch[1]);
    }
    let dai_mm = Math.round(dai * 1000);

    // 11. Khe lá
    let kheLa = "";
    if (d.line3) {
        let tbMatch = d.line3.match(/\(TB:\s*([\d\.]+)\s*mm\)/);
        if (tbMatch) {
            let tbValue = parseFloat(tbMatch[1]);
            let tbTruncated = Math.floor(tbValue * 10) / 10;
            kheLa = tbTruncated.toString();
        } else {
            let pitches = [];
            let pitchRegex = /x\s*([\d\.]+)/g;
            let match;
            while ((match = pitchRegex.exec(d.line3)) !== null) {
                pitches.push(parseFloat(match[1]));
            }
            if (pitches.length > 0) {
                if (pitches.length === 1) {
                    kheLa = pitches[0].toString();
                } else {
                    let sum = pitches.reduce((a, b) => a + b, 0);
                    let avg = sum / pitches.length;
                    let avgTruncated = Math.floor(avg * 10) / 10;
                    kheLa = avgTruncated.toString();
                }
            } else {
                let kheLaStr = d.line3.replace(/Khe lá:/gi, '').replace(/mm/gi, '').trim();
                let numbers = kheLaStr.match(/[\d\.]+/g);
                if (numbers && numbers.length > 0) {
                    kheLa = numbers[numbers.length - 1]; // Lấy số cuối cùng nếu không có 'x'
                }
            }
        }
    }

    // Validation Rule -> [12] Chuẩn thiết kế & [10] String
    let isStandard = false;
    let chuan = "G";
    if (["3", "5", "7"].includes(loaiKhuon) || ["4", "6"].includes(loaiKhuon)) {
        let s50 = (window.GT_CONFIG && window.GT_CONFIG.STANDARD_COILS) ? window.GT_CONFIG.STANDARD_COILS : {
            "400": { cao: 10, dai_1_quat: 750, dai_3_quat: 2300 },
            "450": { cao: 12, dai_1_quat: 850, dai_3_quat: 2550 },
            "500": { cao: 14, dai_1_quat: 1000, dai_3_quat: 3000 },
            "560": { cao: 16, dai_1_quat: 1150, dai_3_quat: 3400 },
            "600": { cao: 16, dai_1_quat: 1150 },
            "630": { cao: 18, dai_1_quat: 1275, dai_3_quat: 3700 }
        };
        let s45 = {
            "400": { cao: 12, dai_1_quat: 750, dai_3_quat: 2300 },
            "450": { cao: 14, dai_1_quat: 850, dai_3_quat: 2550 },
            "500": { cao: 16, dai_1_quat: 1000, dai_3_quat: 3000 },
            "560": { cao: 18, dai_1_quat: 1150, dai_3_quat: 3400 },
            "600": { cao: 18, dai_1_quat: 1150 },
            "630": { cao: 20, dai_1_quat: 1275, dai_3_quat: 3700 }
        };

        let standardCoils = ["3", "5", "7"].includes(loaiKhuon) ? s50 : s45;
        let dkStr = dkQuatNum.toString();
        let qty = parseInt(soLuongQuat) || 1;
        if (standardCoils[dkStr]) {
            let sData = standardCoils[dkStr];
            let expectedDai = (qty === 3 && sData.dai_3_quat) ? sData.dai_3_quat : (sData.dai_1_quat * qty);
            if (cao === sData.cao && dai_mm === expectedDai) {
                isStandard = true;
            }
        }
    }

    // Tạm thời Inox D22 (chưa có khuôn) cũng gán là không chuẩn
    if (!isStandard) {
        chuan = "S";
    }

    let dai_m = dai_mm / 1000;
    let daiStr = Number.isInteger(dai_m) ? dai_m.toFixed(1) : dai_m.toString();
    let ngangStr = isStandard ? ngang.toString() : `${ngang}${cao}${daiStr}`;

    document.getElementById('model-history-index').value = index;

    // Đặt lại các trường chưa parse được thành rỗng để bắt buộc chọn
    document.getElementById('model-vat-lieu-la').value = "";
    document.getElementById('model-xa-da').value = loaiDan === "FCU" ? "A" : "";

    let hasTachAm = d.header && d.header.includes("(Tách ẩm)");
    if (document.getElementById('model-tach-am')) document.getElementById('model-tach-am').checked = hasTachAm;

    // Gán các giá trị dropdown cho modal
    document.getElementById('model-loai-dan').value = loaiDan;
    document.getElementById('model-moi-chat').value = moiChat;
    document.getElementById('model-van-hanh').value = vanHanh;
    document.getElementById('model-chuan').value = "";

    // Gán thông tin hiển thị phụ
    document.getElementById('model-ong-quat').value = `Khuôn: ${loaiKhuon || '?'} | Quạt: ${soLuongQuat}x${loaiQuat} D${dkQuatNum} | Kích thước Coil: ${cao}x${dai_mm}`;

    window.currentModelData = { loaiKhuon, soLuongQuat, loaiQuat, dkQuat, ngangStr, kheLa };

    isModelManual = false;
    let finalInput = document.getElementById('model-final-preview');
    let btnEdit = document.getElementById('btn_edit_model');
    if (finalInput && btnEdit) {
        finalInput.setAttribute('readonly', true);
        finalInput.style.backgroundColor = '#f1f3f4';
        finalInput.style.borderColor = 'var(--primary)';
        btnEdit.innerText = '[Edit]';
        btnEdit.classList.remove('active');
    }

    updateModelPreview();
    document.getElementById('model-generator-modal').style.display = 'flex';
}

let isModelManual = false;

function toggleModelEdit() {
    isModelManual = !isModelManual;
    const input = document.getElementById('model-final-preview');
    const btn = document.getElementById('btn_edit_model');
    if (isModelManual) {
        input.removeAttribute('readonly');
        input.style.backgroundColor = '#fff';
        input.style.borderColor = 'var(--edit)';
        btn.innerText = '[Khóa lại]';
        btn.classList.add('active');
    } else {
        input.setAttribute('readonly', true);
        input.style.backgroundColor = '#f1f3f4';
        input.style.borderColor = 'var(--primary)';
        btn.innerText = '[Edit]';
        btn.classList.remove('active');
        updateModelPreview();
    }
}

function updateModelPreview() {
    if (isModelManual) return;
    let data = window.currentModelData;
    if (!data) return;

    let loaiDan = document.getElementById('model-loai-dan').value;
    let vatLieuLa = document.getElementById('model-vat-lieu-la').value;
    let moiChat = document.getElementById('model-moi-chat').value;
    let vanHanh = document.getElementById('model-van-hanh').value;
    let xaDa = document.getElementById('model-xa-da').value;
    let chuan = document.getElementById('model-chuan').value;
    let tachAm = document.getElementById('model-tach-am') ? document.getElementById('model-tach-am').checked : false;

    let part1 = loaiDan; // [01]
    if (tachAm && part1) {
        part1 += ".RH";
    }
    let part2 = vatLieuLa + data.loaiKhuon + "." + moiChat + vanHanh; // [02][03].[04][05]

    let part3 = "";
    if (data.soLuongQuat || data.loaiQuat || data.dkQuat) {
        part3 = data.soLuongQuat + data.loaiQuat + data.dkQuat; // [06][07][08]
    }

    let part4 = xaDa + data.ngangStr + "/" + data.kheLa + (chuan ? "/" + chuan : ""); // [09][10]/[11]/[12]

    if (loaiDan === "DC") {
        part3 = ""; // Dàn coil không có quạt
        xaDa = "";  // Dàn coil không xả đá
        part4 = data.ngangStr + "/" + data.kheLa + (chuan ? "/" + chuan : "");
    }

    let finalModel = `${part1} - ${part2}`;
    if (part3) {
        finalModel += ` - ${part3}`;
    }
    finalModel += ` - ${part4}`;

    document.getElementById('model-final-preview').value = finalModel;
}

function closeModelGenerator() {
    document.getElementById('model-generator-modal').style.display = 'none';
}

function saveGeneratedModel() {
    let index = document.getElementById('model-history-index').value;
    let finalModel = document.getElementById('model-final-preview').value;

    if (savedDesigns[index]) {
        // Cập nhật thẻ bodyHTML nếu đã từng lưu model trước đó hoặc thêm mới
        let oldBody = savedDesigns[index].bodyHTML;
        if (oldBody) {
            if (oldBody.includes('Model:') || oldBody.includes('MODEL:')) {
                savedDesigns[index].bodyHTML = oldBody.replace(/Model:\s*[^<]+<\/div>/i, `Model: ${finalModel}</div>`);
            } else {
                const separator = '----------</div>';
                if (oldBody.includes(separator)) {
                    savedDesigns[index].bodyHTML = oldBody.replace(separator, separator + `\n                <div style="font-weight: bold; color: var(--secondary); margin-bottom: 8px;">Model: ${finalModel}</div>`);
                } else {
                    savedDesigns[index].bodyHTML = `<div style="font-weight: bold; color: var(--secondary); margin-bottom: 8px;">Model: ${finalModel}</div>\n` + oldBody;
                }
            }
        }

        savedDesigns[index].modelCode = finalModel;
        localStorage.setItem(STORAGE_PREFIX + 'designs', JSON.stringify(savedDesigns));
        renderSavedDesigns();
    }
    closeModelGenerator();
}

function copyModelCode() {
    const modelInput = document.getElementById('model-final-preview');
    if (!modelInput || !modelInput.value) return;

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(modelInput.value).then(() => {
            showCopyToast();
        }).catch(err => {
            fallbackCopy(modelInput);
        });
    } else {
        fallbackCopy(modelInput);
    }
}

function fallbackCopy(inputElement) {
    inputElement.removeAttribute('readonly');
    inputElement.select();
    inputElement.setSelectionRange(0, 99999);
    try {
        document.execCommand("copy");
        showCopyToast();
    } catch (e) { }
    inputElement.setAttribute('readonly', 'true');
}

function showCopyToast() {
    const copyBtn = document.querySelector('button[onclick="copyModelCode()"]');
    if (copyBtn) {
        const originalText = copyBtn.innerText;
        copyBtn.innerText = 'COPIED!';
        copyBtn.style.background = 'var(--success)';
        setTimeout(() => {
            copyBtn.innerText = originalText;
            copyBtn.style.background = '';
        }, 1500);
    }
}

// ==============================================
// XUẤT THÔNG SỐ KỸ THUẬT (PDF)
// ==============================================
function toggleDefrostFields() {
    const type = document.getElementById('exp_defrost_type').value;
    const wrapKw = document.getElementById('wrap_defrost_kw');
    const wrapTray = document.getElementById('wrap_water_tray');

    if (type === 'Điện trở') {
        wrapKw.style.display = '';
        wrapTray.style.display = 'none';
    } else if (type === 'Nước') {
        wrapKw.style.display = 'none';
        wrapTray.style.display = '';
    } else {
        wrapKw.style.display = 'none';
        wrapTray.style.display = 'none';
    }
}

function openExportModal(index) {
    const d = savedDesigns[index];
    if (!d) return;

    document.getElementById('exp_history_index').value = index;

    // Parse header to extract basic parameters
    let qty = "", moichat = "", vanhanh = "", tmc = "", tmc_out = "", tr = "", rh = "";
    let customerName = "", projectName = "Dàn lạnh"; // Default fallback
    if (d.header) {
        let qMatch = d.header.match(/Số lượng:\s*(\d+)/); if (qMatch) qty = qMatch[1];
        let mMatch = d.header.match(/Môi chất:\s*([^|]*)/); if (mMatch) moichat = mMatch[1].trim();
        let vMatch = d.header.match(/Vận hành:\s*(.*)/); if (vMatch) vanhanh = vMatch[1].trim();
        let tmcMatch = d.header.match(/Tmc:\s*([^\s|]+)/); if (tmcMatch) tmc = tmcMatch[1];
        let tmcOutMatch = d.header.match(/Tmc ra:\s*([^\s|]+)/); if (tmcOutMatch) tmc_out = tmcOutMatch[1];
        let trMatch = d.header.match(/Tr:\s*([^\s|]+)/); if (trMatch) tr = trMatch[1];
        let rhMatch = d.header.match(/RH phòng:\s*([^\s|]+)/); if (rhMatch) rh = rhMatch[1];

        let cMatch = d.header.match(/Công ty:\s*(.*)/);
        if (cMatch && cMatch[1].trim() !== '---') customerName = cMatch[1].trim();

        let pMatch = d.header.match(/Loại dàn:\s*([^|]*)/);
        if (pMatch && pMatch[1].trim() !== '---') projectName = pMatch[1].trim();
    }

    let isFCU = projectName.toUpperCase() === "FCU" || projectName.toUpperCase().includes("FCU");
    let defaultCasing = isFCU ? "Inox 304 (dán cách nhiệt)" : "Inox 304";
    let defaultFloor = isFCU ? "AlMg alloy" : "Nhôm";
    let defaultFin = isFCU ? "AlMg alloy" : "Nhôm";
    let defaultFilter = isFCU ? "Có" : "";

    if (d.exportData) {
        document.getElementById('exp_qty').value = d.exportData.qty || qty;
        document.getElementById('exp_moichat').value = d.exportData.moichat || moichat;
        document.getElementById('exp_vanhanh').value = d.exportData.vanhanh || vanhanh;
        document.getElementById('exp_tmc').value = d.exportData.tmc || tmc;
        document.getElementById('exp_tmc_out').value = d.exportData.tmc_out || tmc_out;
        document.getElementById('exp_tr').value = d.exportData.tr || tr;
        document.getElementById('exp_rh').value = d.exportData.rh || rh;

        document.getElementById('exp_date').value = d.exportData.date || "";
        document.getElementById('exp_customer').value = d.exportData.customer || customerName;
        document.getElementById('exp_project').value = d.exportData.project || projectName;
        document.getElementById('exp_t_out').value = d.exportData.t_out || "";
        document.getElementById('exp_rh_out').value = d.exportData.rh_out || "";
        document.getElementById('exp_water_flow').value = d.exportData.water_flow || "";
        document.getElementById('exp_airflow').value = d.exportData.airflow || "";
        document.getElementById('exp_pressure').value = d.exportData.pressure || "";
        document.getElementById('exp_vwind').value = d.exportData.vwind || "";
        document.getElementById('exp_casing').value = d.exportData.casing || defaultCasing;
        document.getElementById('exp_floor_mat').value = d.exportData.floor_mat || defaultFloor;
        document.getElementById('exp_fin_mat').value = d.exportData.fin_mat || defaultFin;
        document.getElementById('exp_filter').value = d.exportData.filter || defaultFilter;
        document.getElementById('exp_air_guide').value = d.exportData.air_guide || "";
        document.getElementById('exp_test_pressure').value = d.exportData.test_pressure || "20";
        document.getElementById('exp_fan_guard').value = d.exportData.fan_guard || "Inox 304";
        document.getElementById('exp_defrost_type').value = d.exportData.defrost_type || "Không";
        document.getElementById('exp_defrost_kw').value = d.exportData.defrost_kw || "0";
        document.getElementById('exp_water_tray').value = d.exportData.water_tray || "";
        document.getElementById('exp_inlet').value = d.exportData.inlet || "";
        document.getElementById('exp_outlet').value = d.exportData.outlet || "";
        document.getElementById('exp_conn_side').value = d.exportData.conn_side || "Trái / Phải";
        document.getElementById('exp_dim_h').value = d.exportData.dim_h || "";
        document.getElementById('exp_dim_l').value = d.exportData.dim_l || "";
        document.getElementById('exp_dim_t').value = d.exportData.dim_t || "";
        document.getElementById('exp_dim_c').value = d.exportData.dim_c || "";
        document.getElementById('exp_dim_t1').value = d.exportData.dim_t1 || "";
        document.getElementById('exp_dim_e').value = d.exportData.dim_e || "";
        document.getElementById('exp_dim_e1').value = d.exportData.dim_e1 || "";
        document.getElementById('exp_dim_e2').value = d.exportData.dim_e2 || "";
        document.getElementById('exp_dim_e3').value = d.exportData.dim_e3 || "";
        document.getElementById('exp_drawing').value = d.exportData.drawing || "";

        document.getElementById('exp_drawing').setAttribute('data-fan-qty', d.exportData.fanQty || "2");
        toggleDefrostFields();
        document.getElementById('export-tskt-modal').style.display = 'flex';
        if (typeof updateDrawingPreview === 'function') updateDrawingPreview();
        return;
    }


    // Khởi tạo các giá trị mặc định cho Modal
    document.getElementById('exp_qty').value = qty;
    document.getElementById('exp_moichat').value = moichat;
    document.getElementById('exp_vanhanh').value = vanhanh;
    document.getElementById('exp_tmc').value = tmc;
    document.getElementById('exp_tmc_out').value = tmc_out;
    document.getElementById('exp_tr').value = tr;
    document.getElementById('exp_rh').value = rh;
    document.getElementById('exp_customer').value = customerName;
    document.getElementById('exp_project').value = projectName;

    // Auto-fill today's date
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    document.getElementById('exp_date').value = `TPHCM, ngày ${dd} tháng ${mm} năm ${yyyy}`;

    document.getElementById('exp_t_out').value = "";
    document.getElementById('exp_rh_out').value = "";
    document.getElementById('exp_water_flow').value = "";

    let airflowStr = "", pressureStr = "", vwindStr = "";
    if (d.line9) { let aMatch = d.line9.match(/Tổng LL gió:\s*([\d,\.]+)/); if (aMatch) airflowStr = aMatch[1]; }
    if (d.line8) {
        let pMatch = d.line8.match(/\(([^)]+)\)/); if (pMatch) pressureStr = pMatch[1].replace('Pa', '').trim();
        let vMatch = d.line8.match(/Tốc độ gió:\s*([\d\.]+)/); if (vMatch) vwindStr = vMatch[1];
    }

    document.getElementById('exp_airflow').value = airflowStr;
    document.getElementById('exp_pressure').value = pressureStr;
    document.getElementById('exp_vwind').value = vwindStr;

    document.getElementById('exp_casing').value = defaultCasing;
    document.getElementById('exp_floor_mat').value = defaultFloor;
    document.getElementById('exp_fin_mat').value = defaultFin;
    document.getElementById('exp_filter').value = defaultFilter;
    document.getElementById('exp_air_guide').value = "";
    document.getElementById('exp_test_pressure').value = "20";
    document.getElementById('exp_fan_guard').value = "Inox 304";

    document.getElementById('exp_defrost_type').value = "Không";
    document.getElementById('exp_water_tray').value = "";
    toggleDefrostFields();

    document.getElementById('exp_inlet').value = "";
    document.getElementById('exp_outlet').value = "";
    document.getElementById('exp_dim_h').value = "";
    document.getElementById('exp_dim_l').value = "";
    document.getElementById('exp_dim_t').value = "";
    document.getElementById('exp_dim_c').value = "";
    document.getElementById('exp_dim_t1').value = "";

    let auto_E = "";
    if (d.line1) {
        let daiMatch = d.line1.match(/dài\s+([\d\.]+)/);
        if (daiMatch) {
            let L_val = parseFloat(daiMatch[1]).toString();
            if (window.GT_CONFIG && window.GT_CONFIG.STANDARD_E_DIMENSIONS && window.GT_CONFIG.STANDARD_E_DIMENSIONS[L_val]) {
                auto_E = window.GT_CONFIG.STANDARD_E_DIMENSIONS[L_val];
            }
        }
    }
    document.getElementById('exp_dim_e').value = auto_E;
    document.getElementById('exp_dim_e1').value = "";
    document.getElementById('exp_dim_e2').value = "";
    document.getElementById('exp_dim_e3').value = "";

    let fanQty = "2";
    if (d.line2) {
        let fMatch = d.line2.match(/^(\d+)\s+quạt/);
        if (fMatch) fanQty = fMatch[1];
    }

    document.getElementById('exp_drawing').setAttribute('data-fan-qty', fanQty);

    // Không chọn trước hình ảnh, người dùng phải vào Thư viện để chọn
    document.getElementById('exp_drawing').value = "";

    if (d.header && d.header.toLowerCase().includes('đông gió')) {
        document.getElementById('exp_defrost_type').value = "Điện trở";
        document.getElementById('exp_defrost_kw').value = "21.8";
    } else {
        document.getElementById('exp_defrost_type').value = "Không";
        document.getElementById('exp_defrost_kw').value = "0";
    }

    let wrapWaterFlow = document.getElementById('wrap_exp_water_flow');
    let isFCU_check = projectName.toUpperCase().includes("FCU");
    let isBomDich_check = vanhanh.toLowerCase().includes("bơm dịch") || vanhanh.toLowerCase().includes("bom dich");
    if (isFCU_check && isBomDich_check) {
        wrapWaterFlow.style.display = '';
        let lblWaterFlow = document.getElementById('lbl_exp_water_flow');
        let isWater_check = moichat.toLowerCase().includes('nước') || moichat.toLowerCase().includes('nuoc') || moichat.toLowerCase().includes('water') || moichat.toLowerCase() === 'w';
        if (isWater_check) {
            lblWaterFlow.innerText = "Lưu lượng nước cấp (m³/h):";
        } else {
            lblWaterFlow.innerText = "Lưu lượng môi chất cấp (m³/h):";
        }
    } else {
        wrapWaterFlow.style.display = 'none';
    }

    document.getElementById('export-tskt-modal').style.display = 'flex';
    if (typeof updateDrawingPreview === 'function') updateDrawingPreview();
}

function closeExportModal() {
    document.getElementById('export-tskt-modal').style.display = 'none';
}

function generateTechSpecAndPrint() {
    const index = document.getElementById('exp_history_index').value;
    const d = savedDesigns[index];
    if (!d) return;

    d.exportData = {
        qty: document.getElementById('exp_qty').value,
        moichat: document.getElementById('exp_moichat').value,
        vanhanh: document.getElementById('exp_vanhanh').value,
        tmc: document.getElementById('exp_tmc').value,
        tmc_out: document.getElementById('exp_tmc_out').value,
        tr: document.getElementById('exp_tr').value,
        rh: document.getElementById('exp_rh').value,
        date: document.getElementById('exp_date').value,
        customer: document.getElementById('exp_customer').value,
        project: document.getElementById('exp_project').value,
        t_out: document.getElementById('exp_t_out').value,
        rh_out: document.getElementById('exp_rh_out').value,
        water_flow: document.getElementById('exp_water_flow').value,
        airflow: document.getElementById('exp_airflow').value,
        pressure: document.getElementById('exp_pressure').value,
        vwind: document.getElementById('exp_vwind').value,
        casing: document.getElementById('exp_casing').value,
        filter: document.getElementById('exp_filter').value,
        floor_mat: document.getElementById('exp_floor_mat').value,
        fin_mat: document.getElementById('exp_fin_mat').value,
        test_pressure: document.getElementById('exp_test_pressure').value,
        fan_guard: document.getElementById('exp_fan_guard').value,
        air_guide: document.getElementById('exp_air_guide').value,
        defrost_type: document.getElementById('exp_defrost_type').value,
        defrost_kw: document.getElementById('exp_defrost_kw').value,
        water_tray: document.getElementById('exp_water_tray').value,
        inlet: document.getElementById('exp_inlet').value,
        outlet: document.getElementById('exp_outlet').value,
        conn_side: document.getElementById('exp_conn_side').value,
        dim_h: document.getElementById('exp_dim_h').value,
        dim_l: document.getElementById('exp_dim_l').value,
        dim_t: document.getElementById('exp_dim_t').value,
        dim_c: document.getElementById('exp_dim_c').value,
        dim_t1: document.getElementById('exp_dim_t1').value,
        dim_e: document.getElementById('exp_dim_e').value,
        dim_e1: document.getElementById('exp_dim_e1').value,
        dim_e2: document.getElementById('exp_dim_e2').value,
        dim_e3: document.getElementById('exp_dim_e3').value,
        drawing: document.getElementById('exp_drawing').value,
        fanQty: document.getElementById('exp_drawing').getAttribute('data-fan-qty') || "2"
    };
    localStorage.setItem(STORAGE_PREFIX + 'designs', JSON.stringify(savedDesigns));

    // Date
    document.getElementById('pr_date').innerText = document.getElementById('exp_date').value || "";

    // Header Data
    let qty = document.getElementById('exp_qty').value || "-";
    let moichat = document.getElementById('exp_moichat').value || "-";
    let vanhanh = document.getElementById('exp_vanhanh').value || "-";
    let tmc = document.getElementById('exp_tmc').value || "-";
    let tmc_out = document.getElementById('exp_tmc_out').value || "";
    let tr = document.getElementById('exp_tr').value || "-";
    let rh = document.getElementById('exp_rh').value || "-";

    document.getElementById('pr_customer').innerText = document.getElementById('exp_customer').value || "-";
    document.getElementById('pr_project').innerText = document.getElementById('exp_project').value || "-";
    document.getElementById('pr_qty').innerText = qty;
    document.getElementById('pr_moichat').innerText = moichat;
    document.getElementById('pr_vanhanh').innerText = vanhanh;
    document.getElementById('pr_tmc').innerText = tmc;

    let kw = "-";
    if (d.line5) {
        let kwMatch = d.line5.match(/Công suất:\s*([\d\.]+)/);
        if (kwMatch) kw = kwMatch[1];
    }
    document.getElementById('pr_kw').innerText = kw;
    document.getElementById('pr_tong_gio').innerText = document.getElementById('exp_airflow').value || "-";
    document.getElementById('pr_v_gio').innerText = document.getElementById('exp_vwind').value || "-";

    let t_out_val = document.getElementById('exp_t_out').value;
    let rh_out_val = document.getElementById('exp_rh_out').value;
    let t_out_str = t_out_val ? t_out_val + (rh_out_val ? ` (RH: ${rh_out_val}%)` : "") : "-";
    document.getElementById('pr_t_out').innerText = t_out_str;

    let lblTmcOut = document.getElementById('lbl_pr_tmc_out');
    let unitTmcOut = document.getElementById('unit_pr_tmc_out');
    let valTmcOut = document.getElementById('pr_tmc_out');

    let lblLeftTr = document.getElementById('lbl_pr_left_tr');
    let unitLeftTr = document.getElementById('unit_pr_left_tr');
    let valLeftTr = document.getElementById('val_pr_left_tr');

    let isWater = moichat.toLowerCase().includes('nước') || moichat.toLowerCase().includes('nuoc');
    let lblTmc = document.getElementById('lbl_pr_tmc');
    if (lblTmc) lblTmc.innerText = isWater ? "Nhiệt độ nước vào" : "Nhiệt độ bay hơi";

    let isFCU_print = document.getElementById('exp_project').value.toUpperCase().includes("FCU");
    let vanhanhVal = document.getElementById('exp_vanhanh').value.toLowerCase();
    let isBomDich_print = vanhanhVal.includes("bơm dịch") || vanhanhVal.includes("bom dich");
    let hasWaterFlow = isFCU_print && isBomDich_print;

    // Reset Left Tr
    if (lblLeftTr) lblLeftTr.innerText = "";
    if (unitLeftTr) unitLeftTr.innerText = "";
    if (valLeftTr) valLeftTr.innerText = "";

    if (tmc_out) {
        if (lblTmcOut) lblTmcOut.innerText = isWater ? "Nhiệt độ nước ra" : "Nhiệt độ môi chất ra";
        if (unitTmcOut) unitTmcOut.innerText = "°C";
        if (valTmcOut) valTmcOut.innerText = tmc_out;
        
        document.getElementById('pr_row_tr').style.display = 'table-row';
        document.getElementById('lbl_pr_tr').innerText = "Nhiệt độ phòng";
        document.getElementById('unit_pr_tr').innerText = "°C";
        document.getElementById('pr_tr').innerText = `${tr} (RH: ${rh}%)`;
        
        if (hasWaterFlow) {
            lblLeftTr.innerText = isWater ? "Lưu lượng nước cấp" : "Lưu lượng môi chất cấp";
            unitLeftTr.innerText = "m³/h";
            valLeftTr.innerText = document.getElementById('exp_water_flow').value || "-";
        }
    } else {
        if (hasWaterFlow) {
            // No TmcOut but has WaterFlow -> hide TmcOut row content, show Tr row with both
            if (lblTmcOut) lblTmcOut.innerText = "";
            if (unitTmcOut) unitTmcOut.innerText = "";
            if (valTmcOut) valTmcOut.innerText = "";
            
            document.getElementById('pr_row_tr').style.display = 'table-row';
            lblLeftTr.innerText = isWater ? "Lưu lượng nước cấp" : "Lưu lượng môi chất cấp";
            unitLeftTr.innerText = "m³/h";
            valLeftTr.innerText = document.getElementById('exp_water_flow').value || "-";
            
            document.getElementById('lbl_pr_tr').innerText = "Nhiệt độ phòng";
            document.getElementById('unit_pr_tr').innerText = "°C";
            document.getElementById('pr_tr').innerText = `${tr} (RH: ${rh}%)`;
        } else {
            // No TmcOut, No WaterFlow
            if (lblTmcOut) lblTmcOut.innerText = "Nhiệt độ phòng";
            if (unitTmcOut) unitTmcOut.innerText = "°C";
            if (valTmcOut) valTmcOut.innerText = `${tr} (RH: ${rh}%)`;
            document.getElementById('pr_row_tr').style.display = 'none';
        }
    }
    document.getElementById('pr_model').innerText = d.modelCode || "N/A";

    // Coil Data
    let khela = "-", area = "-", vol = "-";
    if (d.line3) {
        khela = d.line3.replace('Khe lá: ', '')
            .replace(/mm/gi, '')
            .replace(/\s+/g, '')
            .replace(/;/g, '; ');
    }
    if (d.line4) { let sMatch = d.line4.match(/([\d\.]+)/); if (sMatch) area = sMatch[1]; }
    if (d.line10) {
        let voMatch = d.line10.match(/([\d\.]+)/);
        if (voMatch) {
            let vNum = parseFloat(voMatch[1]);
            vol = isNaN(vNum) ? voMatch[1] : vNum.toFixed(1);
        }
    }

    let tubeMat = d.title.includes("INOX") ? "Inox" : (d.title.includes("ĐỒNG") ? "Đồng" : "Đồng");

    document.getElementById('pr_tube_mat').innerText = tubeMat;
    document.getElementById('pr_fin_mat').innerText = document.getElementById('exp_fin_mat').value || "-";

    // User Input Modal Data
    let casingVal = document.getElementById('exp_casing').value;
    let prCasing = document.getElementById('pr_casing');
    prCasing.innerText = casingVal || "-";
    if (casingVal.includes("dán cách nhiệt")) {
        prCasing.style.transform = "translateX(-35px)";
        prCasing.style.whiteSpace = "nowrap";
    } else {
        prCasing.style.transform = "none";
        prCasing.style.whiteSpace = "normal";
    }

    // Dynamically assigned below

    document.getElementById('pr_floor_mat').innerText = document.getElementById('exp_floor_mat').value || "-";
    document.getElementById('pr_khela').innerText = khela;
    document.getElementById('pr_area').innerText = area;
    document.getElementById('pr_vol').innerText = vol;

    document.getElementById('pr_test_pressure').innerText = document.getElementById('exp_test_pressure').value || "-";
    document.getElementById('pr_fan_guard').innerText = document.getElementById('exp_fan_guard').value || "-";

    let airGuideVal = document.getElementById('exp_air_guide').value;
    if (!airGuideVal || airGuideVal.trim() === "" || airGuideVal.trim() === "-") {
        document.getElementById('pr_air_guide_row').style.display = 'none';
    } else {
        document.getElementById('pr_air_guide_row').style.display = 'table-row';
        document.getElementById('pr_air_guide').innerText = airGuideVal;
    }

    let inletVal = document.getElementById('exp_inlet').value;
    let outletVal = document.getElementById('exp_outlet').value;
    let prInlet = document.getElementById('pr_inlet');
    let prOutlet = document.getElementById('pr_outlet');

    prInlet.innerText = inletVal;
    if (inletVal.includes("Inox răng ngoài")) {
        prInlet.style.whiteSpace = "nowrap";
        prInlet.style.textAlign = "right";
        prInlet.style.transform = "none";
    } else {
        prInlet.style.whiteSpace = "normal";
        prInlet.style.textAlign = "left";
        prInlet.style.transform = "none";
    }

    prOutlet.innerText = outletVal;
    if (outletVal.includes("Inox răng ngoài")) {
        prOutlet.style.whiteSpace = "nowrap";
        prOutlet.style.textAlign = "right";
        prOutlet.style.transform = "none";
    } else {
        prOutlet.style.whiteSpace = "normal";
        prOutlet.style.textAlign = "left";
        prOutlet.style.transform = "none";
    }
    document.getElementById('pr_conn_side').innerText = document.getElementById('exp_conn_side').value;
    const isFCU = document.getElementById('exp_project').value.toUpperCase().includes("FCU");
    let filterVal = document.getElementById('exp_filter').value;
    const defrostType = document.getElementById('exp_defrost_type').value;
    let defrostKw = document.getElementById('exp_defrost_kw').value;

    let rightItems = [];
    if (isFCU) {
        if (filterVal && filterVal.trim() !== "" && filterVal.trim() !== "-") {
            rightItems.push({ lbl: "Lưới lọc bụi", unit: "", val: filterVal });
        }
        if (defrostType !== "Không" && defrostType !== "") {
            rightItems.push({ lbl: "Xả đá", unit: "", val: defrostType });
            if (defrostType === "Điện trở") {
                rightItems.push({ lbl: "∑ Công suất điện trở", unit: "kW", val: defrostKw });
            }
        }
    } else {
        rightItems.push({ lbl: "Xả đá", unit: "", val: defrostType || "Không" });
        if (defrostType === "Điện trở") {
            rightItems.push({ lbl: "∑ Công suất điện trở", unit: "kW", val: defrostKw });
        }
        if (filterVal && filterVal.trim() !== "" && filterVal.trim() !== "-") {
            rightItems.push({ lbl: "Lưới lọc bụi", unit: "", val: filterVal });
        }
    }

    if (rightItems[0]) {
        document.getElementById('pr_filter_lbl').innerText = rightItems[0].lbl;
        document.getElementById('pr_filter_lbl').nextElementSibling.innerText = rightItems[0].unit;
        document.getElementById('pr_filter').innerText = rightItems[0].val;
    } else {
        document.getElementById('pr_filter_lbl').innerText = "";
        document.getElementById('pr_filter_lbl').nextElementSibling.innerText = "";
        document.getElementById('pr_filter').innerText = "";
    }

    if (rightItems[1]) {
        document.getElementById('pr_defrost_type_row').style.display = 'table-row';
        document.getElementById('pr_defrost_type_lbl').innerText = rightItems[1].lbl;
        document.getElementById('pr_defrost_type_lbl').nextElementSibling.innerText = rightItems[1].unit;
        document.getElementById('pr_defrost_type').innerText = rightItems[1].val;
    } else {
        document.getElementById('pr_defrost_type_row').style.display = 'none';
    }

    if (rightItems[2]) {
        document.getElementById('pr_defrost_kw_row').style.display = 'table-row';
        document.getElementById('pr_defrost_kw_label').innerText = rightItems[2].lbl;
        document.getElementById('pr_defrost_kw_label').nextElementSibling.innerText = rightItems[2].unit;
        document.getElementById('pr_defrost_kw').innerText = rightItems[2].val;
    } else {
        document.getElementById('pr_defrost_kw_row').style.display = 'none';
    }

    const waterTrayText = document.getElementById('pr_water_tray_text');
    if (waterTrayText) {
        if (defrostType === 'Nước') {
            const trayHeight = document.getElementById('exp_water_tray').value;
            waterTrayText.innerText = `(Máng xả nước cao ${trayHeight}mm)`;
        } else {
            waterTrayText.innerText = '';
        }
    }

    // Fan Data
    let fanQty = "-", fanModel = "-";
    if (d.line2) {
        let fMatch = d.line2.match(/^(\d+)\s+quạt\s+(.*)/);
        if (fMatch) {
            fanQty = fMatch[1];
            let fullStr = fMatch[2].trim();
            let hzMatch = fullStr.match(/^(.*?Hz\))/);
            if (hzMatch) {
                fanModel = hzMatch[1];
            } else {
                fanModel = fullStr.split(' - ')[0];
            }
        }
    }

    let fanBrand = "---", fanKw = "-", fanA = "-", fanRpm = "-", fanDb = "-", fanDia = "-";
    if (fanModel.includes("FN")) fanBrand = "ZIEHL-ABEGG";
    else if (fanModel.includes("YSWF") || fanModel.includes("YDWF")) fanBrand = "MAER";
    else if (fanModel.includes("TDA")) fanBrand = "KRUGER";

    // Extract diameter from model if possible
    let diaMatch = fanModel.match(/(\d{3})/);
    if (diaMatch) {
        fanDia = diaMatch[1];
        if (fanDia.startsWith('0')) {
            fanDia = (parseInt(fanDia, 10) * 10).toString();
        }
    }

    // Extract details from GT_CONFIG.FANS
    if (window.GT_CONFIG && window.GT_CONFIG.FANS) {
        let configKey = "";
        if (fanBrand === "ZIEHL-ABEGG") configKey = "ZA";
        else if (fanBrand === "MAER") configKey = "TQ";
        else if (fanBrand === "KRUGER") configKey = "KRUGER";

        let allFansObj = window.GT_CONFIG.FANS[configKey] || {};
        let baseModel = fanModel.split(' ')[0];
        let foundFan = Object.values(allFansObj).find(f => {
            if (f.name && fanModel.includes(f.name)) return true;
            if (f.details && f.details.includes(baseModel)) return true;
            return false;
        });

        if (foundFan && foundFan.details) {
            let detailStr = foundFan.details;
            let isStar = d.line2 && d.line2.toLowerCase().includes("sao");

            // Cập nhật lại fanModel thành tên đầy đủ cho bản in PDF
            fanModel = detailStr.split(' - ')[0];
            fanModel = fanModel.replace(/\s*\(cánh[^)]+\)/gi, '');

            // Regex to match "0.26/0.18kW" or "1.1kW"
            let pMatch = detailStr.match(/([\d\.\/]+)\s*kW/i);
            if (pMatch) {
                let parts = pMatch[1].split('/');
                fanKw = (isStar && parts.length > 1) ? parts[1] : parts[0];
            }

            // Regex to match "0.5/0.29A" or "2.5A"
            let aMatch = detailStr.match(/([\d\.\/]+)\s*A/);
            if (aMatch) {
                let parts = aMatch[1].split('/');
                fanA = (isStar && parts.length > 1) ? parts[1] : parts[0];
            }

            // Regex to match "1340/1020min" or "1400rpm"
            let rpmMatch = detailStr.match(/([\d\/]+)\s*(?:rpm|min)/i);
            if (rpmMatch) {
                let parts = rpmMatch[1].split('/');
                fanRpm = (isStar && parts.length > 1) ? parts[1] : parts[0];
                if (!isNaN(fanRpm)) {
                    fanRpm = parseInt(fanRpm, 10).toLocaleString('en-US');
                }
            }

            // Regex to match "70dB" or "78dB/75dB"
            let dbMatch = detailStr.match(/([\d\.]+(?:dB\/[\d\.]+)?)\s*dB/i);
            if (dbMatch) {
                let parts = dbMatch[1].replace(/dB/ig, '').split('/');
                fanDb = (isStar && parts.length > 1) ? parts[1] : parts[0];
            }
        }
    }

    // Format fan stats if there are multiple fans
    if (parseInt(fanQty) > 1) {
        if (fanKw !== "-") fanKw = `${fanKw} x ${fanQty}`;
        if (fanA !== "-") fanA = `${fanA} x ${fanQty}`;
    }

    document.getElementById('pr_fan_full').innerText = fanModel;
    document.getElementById('pr_fan_qty').innerText = fanQty;
    document.getElementById('pr_fan_kw').innerText = fanKw;
    document.getElementById('pr_fan_a').innerText = fanA;
    document.getElementById('pr_fan_rpm').innerText = fanRpm;
    document.getElementById('pr_fan_db').innerText = fanDb;
    document.getElementById('pr_fan_dia').innerText = fanDia;
    document.getElementById('pr_fan_guard').innerText = document.getElementById('exp_fan_guard').value || "-";

    // Dimensions
    document.getElementById('pr_dim_h').innerText = document.getElementById('exp_dim_h').value || "-";
    document.getElementById('pr_dim_l').innerText = document.getElementById('exp_dim_l').value || "-";
    document.getElementById('pr_dim_t').innerText = document.getElementById('exp_dim_t').value || "-";
    document.getElementById('pr_dim_c').innerText = document.getElementById('exp_dim_c').value || "-";
    document.getElementById('pr_dim_t1').innerText = document.getElementById('exp_dim_t1').value || "-";
    document.getElementById('pr_dim_e').innerText = document.getElementById('exp_dim_e').value || "-";
    document.getElementById('pr_dim_e1').innerText = document.getElementById('exp_dim_e1').value || "-";
    document.getElementById('pr_dim_e2').innerText = document.getElementById('exp_dim_e2').value || "-";
    document.getElementById('pr_dim_e3').innerText = document.getElementById('exp_dim_e3').value || "-";

    const showE1E2 = document.getElementById('wrap_dim_e1').style.display !== 'none';
    const showE3 = document.getElementById('wrap_dim_e3').style.display !== 'none';

    // Mặc định hiển thị lại hàng 3
    const prDimRow3 = document.getElementById('pr_dim_row_3');
    if (prDimRow3) prDimRow3.style.display = '';

    if (!showE1E2) {
        // Chỉ có E -> Cho T và E qua cột 3 (thay thế E1, E2) và ẩn hàng 3
        document.getElementById('lbl_pr_dim_e1').innerText = "T";
        document.getElementById('unit_pr_dim_e1').innerText = "mm";
        document.getElementById('pr_dim_e1').innerText = document.getElementById('exp_dim_t').value || "-";

        document.getElementById('lbl_pr_dim_e2').innerText = "E";
        document.getElementById('unit_pr_dim_e2').innerText = "mm";
        document.getElementById('pr_dim_e2').innerText = document.getElementById('exp_dim_e').value || "-";

        if (prDimRow3) prDimRow3.style.display = 'none';

        // Đảm bảo hiển thị cột 3
        document.getElementById('lbl_pr_dim_e1').style.visibility = 'visible';
        document.getElementById('unit_pr_dim_e1').style.visibility = 'visible';
        document.getElementById('pr_dim_e1').style.visibility = 'visible';

        document.getElementById('lbl_pr_dim_e2').style.visibility = 'visible';
        document.getElementById('unit_pr_dim_e2').style.visibility = 'visible';
        document.getElementById('pr_dim_e2').style.visibility = 'visible';

    } else {
        // Có E1, E2 -> Giữ nguyên vị trí E1, E2 ở cột 3, hàng 3 hiển thị bình thường chứa T và E
        document.getElementById('lbl_pr_dim_e1').innerText = "E1";
        document.getElementById('unit_pr_dim_e1').innerText = "mm";
        document.getElementById('pr_dim_e1').innerText = document.getElementById('exp_dim_e1').value || "-";

        document.getElementById('lbl_pr_dim_e2').innerText = "E2";
        document.getElementById('unit_pr_dim_e2').innerText = "mm";
        document.getElementById('pr_dim_e2').innerText = document.getElementById('exp_dim_e2').value || "-";

        // Đảm bảo hiển thị E1, E2
        document.getElementById('lbl_pr_dim_e1').style.visibility = 'visible';
        document.getElementById('unit_pr_dim_e1').style.visibility = 'visible';
        document.getElementById('pr_dim_e1').style.visibility = 'visible';

        document.getElementById('lbl_pr_dim_e2').style.visibility = 'visible';
        document.getElementById('unit_pr_dim_e2').style.visibility = 'visible';
        document.getElementById('pr_dim_e2').style.visibility = 'visible';

        // Cập nhật lại T và E ở hàng 3
        const lblT = document.getElementById('lbl_pr_dim_t');
        if (lblT) lblT.innerText = "T";
        const unitT = document.getElementById('unit_pr_dim_t');
        if (unitT) unitT.innerText = "mm";

        const lblE = document.getElementById('lbl_pr_dim_e');
        if (lblE) lblE.innerText = "E";
        const unitE = document.getElementById('unit_pr_dim_e');
        if (unitE) unitE.innerText = "mm";

        // Ẩn/hiện E3 dựa vào showE3
        document.getElementById('lbl_pr_dim_e3').style.visibility = showE3 ? 'visible' : 'hidden';
        document.getElementById('unit_pr_dim_e3').style.visibility = showE3 ? 'visible' : 'hidden';
        document.getElementById('pr_dim_e3').style.visibility = showE3 ? 'visible' : 'hidden';

        // Hide row completely if T, E, and E3 are all empty/hidden
        let valT = document.getElementById('exp_dim_t').value.trim();
        let valE = document.getElementById('exp_dim_e').value.trim();
        if (!showE3 && !valT && !valE) {
            if (prDimRow3) prDimRow3.style.display = 'none';
        }
    }

    // Drawing Image
    const selectedDrawing = document.getElementById('exp_drawing').value;
    const imgEl = document.getElementById('pr_drawing_img');
    const phEl = document.getElementById('pr_drawing_placeholder');
    const fileInput = document.getElementById('exp_drawing_file');

    if (window.tempDrawingUrl && fileInput.files[0] && fileInput.files[0].name === selectedDrawing) {
        imgEl.src = window.tempDrawingUrl;
        imgEl.style.display = 'inline-block';
        phEl.style.display = 'none';
    } else if (selectedDrawing) {
        imgEl.src = 'assets/drawings/' + selectedDrawing;
        imgEl.style.display = 'inline-block';
        phEl.style.display = 'none';
    } else {
        imgEl.src = '';
        imgEl.style.display = 'none';
        phEl.style.display = 'block';
    }

    closeExportModal();

    // Let DOM update and print
    setTimeout(() => {
        const originalTitle = document.title;
        let modelCode = d.modelCode || "Unknown_Model";
        
        // Lấy ngày hiện tại
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        let dateStr = `${dd}-${mm}-${yyyy}`;
        
        document.title = `${modelCode} (${dateStr})`;
        
        window.print();
        
        document.title = originalTitle;
    }, 300);
}

function updateDrawingPreview() {
    const selectedDrawing = document.getElementById('exp_drawing').value;
    const label = document.getElementById('selected_drawing_name');
    const previewContainer = document.getElementById('preview_drawing_container');
    const previewImg = document.getElementById('preview_drawing_img');

    let showE1E2 = false;
    let showE3 = false;

    if (selectedDrawing) {
        let drawingName = selectedDrawing.split('/').pop();
        label.innerText = "Đã chọn: " + drawingName;
        
        if (previewContainer && previewImg) {
            const fileInput = document.getElementById('exp_drawing_file');
            if (window.tempDrawingUrl && fileInput.files[0] && fileInput.files[0].name === selectedDrawing) {
                previewImg.src = window.tempDrawingUrl;
            } else {
                previewImg.src = 'assets/drawings/' + selectedDrawing;
            }
            previewContainer.style.display = 'block';
        }

        let lowerName = drawingName.toLowerCase();
        let fanQty = parseInt(document.getElementById('exp_drawing').getAttribute('data-fan-qty') || "1", 10);

        if (fanQty === 1) {
            showE1E2 = false;
            showE3 = false;
        } else if (fanQty === 2) {
            if (lowerName.includes('mau 1') || lowerName.includes('mau 3') || lowerName.includes('mẫu 1') || lowerName.includes('mẫu 3')) {
                showE1E2 = true;
                showE3 = false;
            } else {
                showE1E2 = false;
                showE3 = false;
            }
        } else if (fanQty === 3) {
            if (lowerName.includes('mau 1') || lowerName.includes('mau 3') || lowerName.includes('mẫu 1') || lowerName.includes('mẫu 3')) {
                showE1E2 = true;
                showE3 = true;
            } else {
                showE1E2 = false;
                showE3 = false;
            }
        } else if (fanQty === 4) {
            showE1E2 = true;
            showE3 = false;
        } else {
            showE1E2 = true;
            showE3 = true;
        }
    } else {
        label.innerText = "Chưa chọn bản vẽ";
    }

    document.getElementById('wrap_dim_e1').style.display = showE1E2 ? '' : 'none';
    document.getElementById('wrap_dim_e2').style.display = showE1E2 ? '' : 'none';
    document.getElementById('wrap_dim_e3').style.display = showE3 ? '' : 'none';

    if (typeof autoCalculateE === 'function') autoCalculateE();
}

function autoCalculateE() {
    const eInput = document.getElementById('exp_dim_e');
    const e1Input = document.getElementById('exp_dim_e1');
    const e2Input = document.getElementById('exp_dim_e2');
    const e3Input = document.getElementById('exp_dim_e3');

    if (!eInput || !e1Input || !e2Input || !e3Input) return;

    let eVal = parseFloat(eInput.value);

    // Nếu giá trị E không hợp lệ hoặc bị xóa trống, ta cũng xóa trống E1, E2, E3 (nếu muốn)
    // Nhưng có thể giữ nguyên nếu ng dùng nhập thủ công.
    // Tuy nhiên, tính năng autoCalculateE sẽ luôn ghi đè dựa trên E hiện tại nếu E hợp lệ.

    const showE1E2 = document.getElementById('wrap_dim_e1').style.display !== 'none';
    const showE3 = document.getElementById('wrap_dim_e3').style.display !== 'none';

    if (!isNaN(eVal) && eInput.value.trim() !== "") {
        if (showE3) {
            // Hiển thị cả 3 -> chia 3
            let part = eVal / 3;
            let rounded = Math.round(part);
            e1Input.value = rounded;
            e2Input.value = rounded;
            e3Input.value = rounded;
        } else if (showE1E2) {
            // Chỉ hiển thị E1, E2 -> chia 2
            let part = eVal / 2;
            let rounded = Math.round(part);
            e1Input.value = rounded;
            e2Input.value = rounded;
            e3Input.value = "";
        } else {
            // Không hiển thị E1, E2, E3
            e1Input.value = "";
            e2Input.value = "";
            e3Input.value = "";
        }
    } else {
        // E rỗng -> Xoá trắng
        e1Input.value = "";
        e2Input.value = "";
        e3Input.value = "";
    }
}

function openDrawingGallery() {
    let expEl = document.getElementById('exp_drawing');
    let fanQty = expEl.getAttribute('data-fan-qty') || "2";

    let projectType = (document.getElementById('exp_project').value || "").toLowerCase();
    let isFCU = projectType.includes("fcu");

    let library = (window.GT_CONFIG && window.GT_CONFIG.DRAWINGS) ? window.GT_CONFIG.DRAWINGS : [];

    // Tìm các bản vẽ theo số quạt và loại dàn (FCU hoặc Dàn lạnh)
    let filtered = library.filter(name => {
        let nameLower = name.toLowerCase();
        let matchesFan = nameLower.includes(`${fanQty} quat`);
        let matchesType = isFCU ? nameLower.includes("fcu") : nameLower.includes("dan lanh");
        return matchesFan && matchesType;
    });

    if (filtered.length === 0) {
        filtered = library; // Hiển thị tất cả nếu lọc không có
    }

    let gridHtml = '';
    window.tempSelectedGalleryDrawing = null;
    if (filtered.length > 0) {
        filtered.forEach(name => {
            let displayName = name.split('/').pop();
            gridHtml += `
                <div class="gallery-item" style="cursor:pointer; border: 3px solid transparent; border-radius:8px; padding:8px; text-align:center; transition:0.2s;" 
                     onclick="selectDrawingThumbnail(this, '${name}')">
                    <img src="assets/drawings/${name}" style="width:100%; height:200px; object-fit:contain; background:#fff; border:1px solid #ddd; border-radius:4px;" onerror="this.parentElement.style.display='none'">
                    <div style="font-size:13px; margin-top:8px; color:#333; word-break:break-word; font-weight:bold;">${displayName}</div>
                </div>
            `;
        });
    } else {
        gridHtml = `<div style="grid-column: 1/-1; text-align:center; padding: 20px; color:#999;">Thư viện trống. Hãy thêm danh sách tên file vào config.js</div>`;
    }

    document.getElementById('gallery_grid').innerHTML = gridHtml;
    document.getElementById('drawing-gallery-modal').style.display = 'flex';
}

function selectDrawingThumbnail(el, name) {
    window.tempSelectedGalleryDrawing = name;
    let items = document.querySelectorAll('.gallery-item');
    items.forEach(item => {
        item.style.borderColor = 'transparent';
        item.style.background = 'transparent';
    });
    el.style.borderColor = 'var(--primary)';
    el.style.background = '#e8f0fe';
}

function confirmDrawingSelection() {
    if (window.tempSelectedGalleryDrawing) {
        document.getElementById('exp_drawing').value = window.tempSelectedGalleryDrawing;
        updateDrawingPreview();
        document.getElementById('drawing-gallery-modal').style.display = 'none';
    } else {
        alert("Vui lòng click chọn một hình ảnh bản vẽ trước khi xác nhận!");
    }
}
