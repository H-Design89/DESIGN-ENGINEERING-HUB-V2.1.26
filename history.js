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
