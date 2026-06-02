// ==============================================
// LOGIC QUẢN TRỊ ADMIN
// ==============================================

function openAdminPage() {
    switchTab('admin');
    
    // Load data into inputs
    const accContainer = document.getElementById('admin-accounts-container');
    accContainer.innerHTML = '';
    ACCOUNTS.forEach(acc => {
        addAdminAccountRow(acc.user, acc.pass, acc.role, acc.tabs);
    });

    renderAdminTubeSpecs();
    renderAdminFinCoeffs();
    renderAdminFans();
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
        const coeffData = FIN_WEIGHT_COEFFS[key];
        let coeff = coeffData;
        let kho_nhom = '';
        if (typeof coeffData === 'object' && coeffData !== null) {
            coeff = coeffData.coeff;
            kho_nhom = coeffData.kho_nhom || '';
        }
        
        addAdminFinCoeffRow(loaiOng, material, thick, coeff, kho_nhom);
    }
}

function addAdminFinCoeffRow(loaiOng = '', material = '', thick = '', coeff = 0, kho_nhom = '') {
    const container = document.getElementById('admin-fin-container');
    const row = document.createElement('div');
    row.className = 'admin-fin-card';
    row.style.background = '#f8f9fa';
    row.style.padding = '8px 12px';
    row.style.borderRadius = '8px';
    row.style.border = '1px solid #ddd';
    
    let tubeOptions = `<option value="">-- Chọn Mã Ống --</option>`;
    for (let t in TUBE_SPECS) {
        tubeOptions += `<option value="${t}" ${t === loaiOng ? 'selected' : ''}>${t}</option>`;
    }
    if (loaiOng && !TUBE_SPECS[loaiOng]) {
        tubeOptions += `<option value="${loaiOng}" selected>${loaiOng} (Không xác định)</option>`;
    }
    
    row.innerHTML = `
        <details>
            <summary style="font-weight:bold; cursor:pointer; padding: 5px 0; outline: none; display: flex; justify-content: space-between; align-items: center;">
                <span>Hệ số: <span class="sum-text">${loaiOng} - ${material} - ${thick}</span></span>
                <button class="btn-remove" style="padding: 2px 8px;" onclick="this.closest('.admin-fin-card').remove(); event.preventDefault();">X</button>
            </summary>
            <div class="grid" style="grid-template-columns: 1fr 1fr; margin-top: 15px;">
                <div class="input-group"><label>Mã ống & Khuôn</label><select class="f-loai" onchange="updateFinSummary(this)">${tubeOptions}</select></div>
                <div class="input-group"><label>Vật liệu (VD: Nhôm thường)</label><input type="text" class="f-mat" value="${material}" oninput="updateFinSummary(this)"></div>
                <div class="input-group"><label>Độ dày (mm)</label><input type="number" step="0.01" class="f-th" value="${thick}" oninput="updateFinSummary(this)"></div>
                <div class="input-group"><label>Khổ nhôm (mm)</label><input type="number" step="1" class="f-kn" value="${kho_nhom}"></div>
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

function addAdminAccountRow(user = '', pass = '', role = 'user', tabs = ['coil']) {
    const container = document.getElementById('admin-accounts-container');
    const row = document.createElement('div');
    row.className = 'admin-acc-card';
    row.style.background = '#f8f9fa';
    row.style.padding = '12px';
    row.style.borderRadius = '8px';
    row.style.border = '1px solid #ddd';
    row.style.position = 'relative';

    const maskedPass = maskString(pass);
    const coilChecked = tabs.includes('coil') ? 'checked' : '';
    const psychroChecked = tabs.includes('psychro') ? 'checked' : '';
    
    row.innerHTML = `
        <button class="btn-remove" onclick="removeAdminAccountRow(this)" style="position: absolute; top: 12px; right: 12px;">X</button>
        <div class="grid" style="grid-template-columns: 1fr 1fr 1fr;">
            <div><label style="font-size: 0.85rem; color: #666;">Tài khoản</label><input type="text" class="acc-user-in input-field" value="${user}"></div>
            <div><label style="font-size: 0.85rem; color: #666;">Mật khẩu</label><input type="text" class="acc-pass-in input-field" data-val="${pass}" value="${maskedPass}" onfocus="this.value = this.dataset.val || ''" onblur="this.dataset.val = this.value; this.value = maskString(this.value)"></div>
            <div>
                <label style="font-size: 0.85rem; color: #666;">Phân quyền</label>
                <select class="acc-role-in input-field">
                    <option value="admin" ${role === 'admin' ? 'selected' : ''}>Admin (Tất cả quyền)</option>
                    <option value="user" ${role === 'user' ? 'selected' : ''}>User (Giới hạn)</option>
                </select>
            </div>
        </div>
        <div style="margin-top: 10px;">
            <label style="font-size: 0.85rem; color: #666; display: block; margin-bottom: 5px;">Quyền xem chức năng (Chỉ áp dụng cho User):</label>
            <div style="display: flex; gap: 15px;">
                <label style="display: flex; align-items: center; gap: 5px;"><input type="checkbox" class="acc-tab-coil" ${coilChecked}> DESIGN COIL</label>
                <label style="display: flex; align-items: center; gap: 5px;"><input type="checkbox" class="acc-tab-psychro" ${psychroChecked}> BẢNG TRA PSYCHRO</label>
            </div>
        </div>
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
    let newAccounts = [];
    let hasAdmin = false;
    document.querySelectorAll('#admin-accounts-container .admin-acc-card').forEach(row => {
        const user = row.querySelector('.acc-user-in').value.trim();
        const passInput = row.querySelector('.acc-pass-in');
        const pass = passInput.dataset.val || passInput.value;
        const role = row.querySelector('.acc-role-in').value;
        
        const tabs = [];
        if (row.querySelector('.acc-tab-coil').checked) tabs.push('coil');
        if (row.querySelector('.acc-tab-psychro').checked) tabs.push('psychro');
        
        if (user && pass) {
            newAccounts.push({ user, pass, role, tabs });
            if (role === 'admin') hasAdmin = true;
        }
    });
    
    if (newAccounts.length === 0) {
        alert("Danh sách tài khoản không hợp lệ! Bắt buộc có ít nhất 1 tài khoản.");
        return;
    }
    if (!hasAdmin) {
        alert("Cần có ít nhất 1 tài khoản Admin!");
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
        const kn = parseFloat(card.querySelector('.f-kn').value) || 0;
        const co = parseFloat(card.querySelector('.f-co').value) || 0;
        if (loai && mat && th) {
            const key = `${loai}_${mat}_${th}`;
            if (kn > 0) {
                parsedFins[key] = { coeff: co, kho_nhom: kn };
            } else {
                parsedFins[key] = co;
            }
        }
    });

    const parsedFans = {};
    document.querySelectorAll('#admin-fan-container .admin-fan-card').forEach(card => {
        const brand = card.querySelector('.f-brand').value.trim();
        const model = card.querySelector('.f-model').value.trim();
        const name = card.querySelector('.f-name').value.trim();
        const details = card.querySelector('.f-details').value.trim();
        
        if (brand && model) {
            if (!parsedFans[brand]) parsedFans[brand] = {};
            
            const modes = {};
            card.querySelectorAll('.fan-mode-card').forEach(modeCard => {
                const modeName = modeCard.querySelector('.mode-name').value.trim();
                if (modeName) {
                    const modeData = {};
                    modeCard.querySelectorAll('.pa-flow-row').forEach(row => {
                        const pa = row.querySelector('.pa-key').value.trim();
                        const flow = row.querySelector('.flow-val').value.trim();
                        if (pa !== '' && flow !== '') {
                            modeData[pa] = parseFloat(flow);
                        }
                    });
                    modes[modeName] = modeData;
                }
            });
            
            parsedFans[brand][model] = { name, details, modes };
        }
    });

    TUBE_SPECS = parsedTubes;
    FIN_WEIGHT_COEFFS = parsedFins;
    ACCOUNTS = newAccounts;
    
    // Lưu tạm vào biến nhớ
    window.GT_CONFIG = {
        ACCOUNTS: ACCOUNTS,
        TUBE_SPECS: TUBE_SPECS,
        FIN_WEIGHT_COEFFS: FIN_WEIGHT_COEFFS,
        FANS: parsedFans
    };
    
    // Cập nhật ngay trên bộ nhớ cho phần mềm chạy
    ADMIN_FANS = parsedFans;
    if(typeof FANS !== 'undefined') {
        FANS = parsedFans;
    }
    
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
}

// =====================================
// QUẢN LÝ QUẠT (FANS)
// =====================================
let ADMIN_FANS = (window.GT_CONFIG && window.GT_CONFIG.FANS) ? JSON.parse(JSON.stringify(window.GT_CONFIG.FANS)) : {};

function renderAdminFans() {
    const container = document.getElementById('admin-fan-container');
    container.innerHTML = '';
    
    for (let brand in ADMIN_FANS) {
        for (let model in ADMIN_FANS[brand]) {
            const fanData = ADMIN_FANS[brand][model];
            container.insertAdjacentHTML('beforeend', createFanCardHTML(brand, model, fanData));
        }
    }
}

function addAdminFanRow() {
    const container = document.getElementById('admin-fan-container');
    container.insertAdjacentHTML('afterbegin', createFanCardHTML('', '', { name: '', details: '', modes: { 'Mặc định': { 0: 0 } } }));
}

function createFanCardHTML(brand, model, fanData) {
    let modesHTML = '';
    for (let modeName in fanData.modes) {
        const modeData = fanData.modes[modeName];
        let paFlowHTML = '';
        
        let paKeys = Object.keys(modeData).map(Number).sort((a, b) => a - b);
        for (let pa of paKeys) {
            paFlowHTML += `
                <div class="pa-flow-row" style="display: flex; gap: 10px; margin-bottom: 5px; align-items: center;">
                    <input type="number" class="pa-key input-field" value="${pa}" placeholder="Pa" style="width: 80px;" title="Cột áp (Pa)">
                    <span>:</span>
                    <input type="number" class="flow-val input-field" value="${modeData[pa]}" placeholder="m³/h" style="width: 100px;" title="Lưu lượng (m³/h)">
                    <button class="btn-remove" onclick="this.parentElement.remove()" style="padding: 2px 8px;">X</button>
                </div>
            `;
        }
        
        modesHTML += `
            <div class="fan-mode-card" style="border: 1px solid #ccc; padding: 10px; margin-bottom: 10px; border-radius: 4px; background: #fafafa;">
                <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 10px;">
                    <label>Chế độ:</label>
                    <input type="text" class="mode-name input-field" value="${modeName}" style="width: 150px;">
                    <button class="btn-remove" onclick="this.parentElement.parentElement.remove()">Xóa chế độ</button>
                </div>
                <div class="pa-flow-container">
                    ${paFlowHTML}
                </div>
                <button class="btn-add" onclick="addPaFlowRow(this)" style="font-size: 0.9rem; padding: 4px 8px; margin-top: 5px;">+ Thêm mốc (Pa/m³)</button>
            </div>
        `;
    }

    return `
        <div class="admin-fan-card" style="background: #f4f6f8; padding: 15px; border-radius: 8px; border: 1px solid #c8d6e5; position: relative;">
            <button class="btn-remove" onclick="if(confirm('Xóa quạt này?')) this.parentElement.remove()" style="position: absolute; top: 10px; right: 10px;">X</button>
            
            <div style="display: grid; grid-template-columns: 100px 150px 1fr; gap: 10px; margin-bottom: 10px;">
                <div>
                    <label style="font-size: 0.85rem; color: #666;">Hãng</label>
                    <input type="text" class="f-brand input-field" value="${brand}" placeholder="VD: ZA">
                </div>
                <div>
                    <label style="font-size: 0.85rem; color: #666;">Model Code</label>
                    <input type="text" class="f-model input-field" value="${model}" placeholder="VD: FN040">
                </div>
                <div>
                    <label style="font-size: 0.85rem; color: #666;">Tên hiển thị</label>
                    <input type="text" class="f-name input-field" value="${fanData.name}" placeholder="VD: FN040 Ø400">
                </div>
            </div>
            
            <div style="margin-bottom: 10px;">
                <label style="font-size: 0.85rem; color: #666;">Thông số chi tiết (Nút i)</label>
                <input type="text" class="f-details input-field" value="${fanData.details || ''}" placeholder="VD: 0.26kW - 0.5A - 1340min">
            </div>
            
            <details style="background: #fff; padding: 10px; border-radius: 4px; border: 1px solid #ddd;">
                <summary style="cursor: pointer; font-weight: bold; color: var(--primary);">Các chế độ hoạt động (Tam giác/Sao...)</summary>
                <div class="modes-container" style="margin-top: 10px;">
                    ${modesHTML}
                </div>
                <button class="btn-add" onclick="addFanMode(this)" style="margin-top: 10px;">+ Thêm chế độ</button>
            </details>
        </div>
    `;
}

function addPaFlowRow(btnElement) {
    const container = btnElement.previousElementSibling;
    container.insertAdjacentHTML('beforeend', `
        <div class="pa-flow-row" style="display: flex; gap: 10px; margin-bottom: 5px; align-items: center;">
            <input type="number" class="pa-key input-field" value="0" placeholder="Pa" style="width: 80px;" title="Cột áp (Pa)">
            <span>:</span>
            <input type="number" class="flow-val input-field" value="0" placeholder="m³/h" style="width: 100px;" title="Lưu lượng (m³/h)">
            <button class="btn-remove" onclick="this.parentElement.remove()" style="padding: 2px 8px;">X</button>
        </div>
    `);
}

function addFanMode(btnElement) {
    const container = btnElement.previousElementSibling;
    container.insertAdjacentHTML('beforeend', `
        <div class="fan-mode-card" style="border: 1px solid #ccc; padding: 10px; margin-bottom: 10px; border-radius: 4px; background: #fafafa;">
            <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 10px;">
                <label>Chế độ:</label>
                <input type="text" class="mode-name input-field" value="Chế độ mới" style="width: 150px;">
                <button class="btn-remove" onclick="this.parentElement.parentElement.remove()">Xóa chế độ</button>
            </div>
            <div class="pa-flow-container">
                <div class="pa-flow-row" style="display: flex; gap: 10px; margin-bottom: 5px; align-items: center;">
                    <input type="number" class="pa-key input-field" value="0" placeholder="Pa" style="width: 80px;">
                    <span>:</span>
                    <input type="number" class="flow-val input-field" value="0" placeholder="m³/h" style="width: 100px;">
                    <button class="btn-remove" onclick="this.parentElement.remove()" style="padding: 2px 8px;">X</button>
                </div>
            </div>
            <button class="btn-add" onclick="addPaFlowRow(this)" style="font-size: 0.9rem; padding: 4px 8px; margin-top: 5px;">+ Thêm mốc (Pa/m³)</button>
        </div>
    `);
}
