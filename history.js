// ==============================================
// LOGIC LƯU LỊCH SỬ THIẾT KẾ
// ==============================================
const STORAGE_PREFIX = "_gt_sec_";
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
    
    let qty = document.getElementById('save_qty').value || '---';
    let moichat = document.getElementById('save_moichat').value.trim() || '---';
    let vanhanh = document.getElementById('save_vanhanh').value.trim() || '---';
    let tmc = document.getElementById('save_tmc').value.trim() || '---';
    let tr = document.getElementById('save_tr').value.trim() || '---';
    let rh = document.getElementById('save_rh').value.trim() || '---';
    let note = document.getElementById('save_note').value.trim() || '---';
    
    let headerText = `Công ty: ${company}\nLoại dàn: ${typeDisplay} | Số lượng: ${qty}\nMôi chất: ${moichat} | Vận hành: ${vanhanh}\nTmc: ${tmc} °C | Tr: ${tr} °C | RH phòng: ${rh} %\nGhi chú: ${note}`;

    const selOng = document.getElementById('loai_ong');
    const loaiOngText = selOng.options[selOng.selectedIndex].text;
    const N = document.getElementById('hang_ngang').value || 0;
    const C = document.getElementById('hang_doc').value || 0;
    let numL = parseFloat(document.getElementById('l_su_dung').value.replace(/,/g, '.')) || 0;
    const L = Number.isInteger(numL) ? numL.toFixed(1) : numL.toString();
    
    const soQuat = document.getElementById('so_quat').value || 0;
    const selFanModel = document.getElementById('fan_model');
    const fanModelText = selFanModel.options[selFanModel.selectedIndex]?.text || '';
    const fanPressure = document.getElementById('fan_pressure').value || 0;
    
    const selFanMode = document.getElementById('fan_mode');
    let fanModeText = selFanMode ? selFanMode.value : "";
    let modeShort = fanModeText ? ` - ${fanModeText}` : "";
    
    // Khe lá
    let kheLaArr = [];
    document.querySelectorAll('.segment-row').forEach(row => {
        const segN = row.querySelector('.seg-n').value;
        const segPitch = row.querySelector('.seg-pitch').value;
        if (segN && segPitch) kheLaArr.push(`${segN} x ${segPitch} mm`);
    });
    const kheLaStr = kheLaArr.length > 0 ? kheLaArr.join('; ') : '---';
    
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
        title: `Ống ${loaiOngText}`,
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
            <div style="font-weight: bold; color: var(--secondary); margin-bottom: 5px; font-size: 1.1rem; padding-right: 210px;">
                <span class="card-stt" style="color: var(--accent);">[${stt}] </span><span class="card-title" style="outline: none;">${d.title}</span>
            </div>
            <div class="card-content" style="color: #3c4043; line-height: 1.6; font-size: 0.95rem; outline: none;">${bodyContent}</div>
            <div style="text-align: right; margin-top: 10px; font-size: 0.75rem; color: #999; user-select: none; border-top: 1px dashed #eee; padding-top: 5px;">
                Đã lưu: ${d.createdAt || 'N/A'} ${d.updatedAt ? `| Sửa lần cuối: ${d.updatedAt}` : ''}
            </div>
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
        let pitchMatch = d.line3.match(/([\d\.]+)\s*mm/);
        if (pitchMatch) kheLa = pitchMatch[1];
    }

    // Validation Rule -> [12] Chuẩn thiết kế & [10] String
    let isStandard = false;
    let chuan = "G";
    if (["3", "5", "7"].includes(loaiKhuon)) {
        let standardCoils = (window.GT_CONFIG && window.GT_CONFIG.STANDARD_COILS) ? window.GT_CONFIG.STANDARD_COILS : {
            "400": { cao: 10, dai_1_quat: 750, dai_3_quat: 2300 },
            "450": { cao: 12, dai_1_quat: 850, dai_3_quat: 2550 },
            "500": { cao: 14, dai_1_quat: 1000, dai_3_quat: 3000 },
            "560": { cao: 16, dai_1_quat: 1150, dai_3_quat: 3400 },
            "600": { cao: 16, dai_1_quat: 1150 },
            "630": { cao: 18, dai_1_quat: 1275, dai_3_quat: 3700 }
        };
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

    let ngangStr = isStandard ? ngang.toString() : `${ngang}${cao}${dai_mm / 1000}`;

    document.getElementById('model-history-index').value = index;
    
    // Đặt lại các trường chưa parse được thành rỗng để bắt buộc chọn
    document.getElementById('model-vat-lieu-la').value = "";
    document.getElementById('model-xa-da').value = "";
    
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
    if(finalInput && btnEdit) {
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
    } catch(e) {}
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
