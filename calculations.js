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
        document.getElementById('psy_psat1').innerText = Math.round(p1.P_sat).toLocaleString('en-US');
        document.getElementById('psy_h1').innerText = Number(p1.h.toFixed(2));
        document.getElementById('psy_w1').innerText = Number(p1.w.toFixed(2));
        document.getElementById('psy_tdp1').innerText = Number(p1.T_dp.toFixed(1));
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
        document.getElementById('psy_psat2').innerText = Math.round(p2.P_sat).toLocaleString('en-US');
        document.getElementById('psy_h2').innerText = Number(p2.h.toFixed(2));
        document.getElementById('psy_w2').innerText = Number(p2.w.toFixed(2));
        document.getElementById('psy_tdp2').innerText = Number(p2.T_dp.toFixed(1));
    } else {
        document.getElementById('psy_psat2').innerText = "---";
        document.getElementById('psy_h2').innerText = "---";
        document.getElementById('psy_w2').innerText = "---";
        document.getElementById('psy_tdp2').innerText = "---";
    }
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

    const lFinMode = document.querySelector('input[name="l_fin_mode"]:checked') ? document.querySelector('input[name="l_fin_mode"]:checked').value : 'standard';
    
    let calc_method = method;
    let h_rut_calc = h_rut;
    let d_han_calc = d_han;
    
    if (lFinMode === 'standard') {
        calc_method = "Cắt";
        h_rut_calc = 0.015; // Của Inox 16
        d_han_calc = 70;    // Của Inox 16
    }

    if (!isLFinManual) {
        L_mm = parseFloat(document.getElementById('l_su_dung').value.replace(/,/g, '.')) * 1000 || 0;
        if (calc_method === "Cắt") {
            L_fin = L_mm - (L_mm * h_rut_calc) - thickness_san - d_han_calc;
        } else {
            L_fin = ((L_mm * 2 - k_co) / 2) - d_han_calc - (L_mm * h_rut_calc) - thickness_san;
        }
        L_fin = Math.floor(L_fin); 
        document.getElementById('l_fin_input').value = parseFloat(L_fin).toLocaleString('en-US');
    } else {
        L_fin = Math.floor(parseFloat(document.getElementById('l_fin_input').value.replace(/,/g, '')) || 0); 
        if (calc_method === "Cắt") {
            L_mm = (L_fin + thickness_san + d_han_calc) / (1 - h_rut_calc);
        } else {
            L_mm = (L_fin + k_co/2 + d_han_calc + thickness_san) / (1 - h_rut_calc);
        }
        document.getElementById('l_su_dung').value = Number((L_mm / 1000).toFixed(3));
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
            document.getElementById('avg-pitch-val').innerText = `${total_N} x ${Number(avg_pitch.toFixed(2))} mm`;
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

    const q_fan = parseFloat(document.getElementById('gio_1_quat').value.replace(/,/g, '')) || 0;
    const n_fan = parseFloat(document.getElementById('so_quat').value) || 0;
    const tong_gio = q_fan * n_fan;

    const height_m = (C * b_d) / 1000;
    const width_m = L_fin / 1000;
    const v_wind = (height_m > 0 && width_m > 0) ? (tong_gio / (height_m * width_m * 3600)) : 0;

    document.getElementById('res_tong_gio').innerText = tong_gio.toLocaleString('en-US');
    document.getElementById('res_v_gio').innerText = Number(v_wind.toFixed(2));
    document.getElementById('res_vol').innerText = Number(vol_liter.toFixed(2));
    document.getElementById('res_l_tong').innerText = Number(L_tong_ong.toFixed(1));
    document.getElementById('res_l_fin').innerText = L_fin; 
    
    document.getElementById('res_s_khong_dt').innerText = Number((Math.trunc(lastCalculatedAreaNoHeater * 10) / 10).toFixed(1));
    if (d_dt > 0) {
        document.getElementById('res_s_co_dt').innerText = Number((Math.trunc(lastCalculatedAreaWithHeater * 10) / 10).toFixed(1));
    } else {
        document.getElementById('res_s_co_dt').innerText = "---";
    }

    calculateRequiredAirflow();
    calculatePerformance();
    calculateCircuitry();
    if (typeof calculateHeaterPower === 'function') calculateHeaterPower();
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

    const L_fin = parseFloat(document.getElementById('l_fin_input').value.replace(/,/g, '')) || 0;
    
    const height_m = (C * b_d) / 1000;
    const width_m = L_fin / 1000;

    const req_total = target_v * height_m * width_m * 3600;
    const req_per_fan = req_total / n_fan_req;

    document.getElementById('req_total_val').innerText = Math.round(req_total).toLocaleString('en-US');
    document.getElementById('req_per_fan_val').innerText = Math.round(req_per_fan).toLocaleString('en-US');
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
            stdInput.value = Number((Math.trunc(std * 10) / 10).toFixed(1));
        } else {
            stdInput.value = "";
        }
    } else {
        const std = parseFloat(stdInput.value);
        if (!isNaN(std) && std > 0) {
            const kw = area / std;
            kwInput.value = Number((Math.trunc(kw * 10) / 10).toFixed(1));
        } else {
            kwInput.value = "";
        }
    }
}

function calculateCircuitry() {
    const C = parseFloat(document.getElementById('hang_doc').value) || 0;
    const N = parseFloat(document.getElementById('hang_ngang').value) || 0;
    const total_tubes = N * C;
    const L_m = parseFloat(document.getElementById('l_su_dung').value.replace(/,/g, '.')) || 0;

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
        lenEl.innerText = Number((Math.trunc(len * 10) / 10).toFixed(1));
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
    const L_fin = parseFloat(document.getElementById('l_fin_input').value.replace(/,/g, '')) || 0;
    
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
            let coeffData = FIN_WEIGHT_COEFFS[key];
            let coeff = coeffData;
            if (typeof coeffData === 'object' && coeffData !== null) {
                coeff = coeffData.coeff || 0;
            }
            
            if (coeff === undefined || coeff === 0) {
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

    document.getElementById('res_mass_fin').innerText = total_fin_mass.toLocaleString('en-US', { maximumFractionDigits: 2 });
    document.getElementById('res_mass_tube').innerText = total_tube_mass.toLocaleString('en-US', { maximumFractionDigits: 2 });
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
// LOGIC ĐIỆN TRỞ SƯỞI MIỆNG QUẠT (ADMIN ONLY)
// ==============================================
const HEATER_DATA = {
    "standard": {
        400: 600, 450: 600, 500: 600, 550: 800, 560: 800, 600: 800, 630: 800
    },
    "slc": {
        400: 215, 450: 252, 500: 279, 560: 313, 600: 351, 630: 351
    }
};

function calculateHeaterPower() {
    const adminHeater = document.getElementById('admin_heater_section');
    if (!adminHeater || adminHeater.style.display === 'none') return;

    const diameter = parseInt(document.getElementById('heater_fan_diameter').value) || 0;
    const type = document.getElementById('heater_type').value; // "standard" or "slc"
    const fanCount = parseFloat(document.getElementById('heater_fan_count').value) || 0;

    let perFanPower = 0;
    if (diameter > 0 && HEATER_DATA[type] && HEATER_DATA[type][diameter] !== undefined) {
        perFanPower = HEATER_DATA[type][diameter];
    }

    const totalKw = (perFanPower * fanCount) / 1000;

    if (perFanPower > 0) {
        document.getElementById('heater_per_fan').value = perFanPower.toLocaleString('en-US');
    } else {
        document.getElementById('heater_per_fan').value = "N/A";
    }

    if (totalKw > 0) {
        document.getElementById('heater_total_kw').value = Number(totalKw.toFixed(2)).toLocaleString('en-US');
    } else {
        document.getElementById('heater_total_kw').value = "N/A";
    }
}

