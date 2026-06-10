// ==========================================
// TÍNH NĂNG DỊCH MÃ MODEL (MODEX)
// ==========================================

const DICT_LOAI_DAN = { "FCU": "FCU", "CD": "Đông gió", "TD": "Dàn lạnh", "DN": "Dàn ngưng", "DC": "Dàn coil" };
const DICT_VAT_LIEU = { "N": "Nhôm thường", "S": "Inox 304", "M": "Nhôm Magie", "C": "Đồng", "E": "Nhôm Epoxy", "H": "Nhôm Hydrophylic" };
const DICT_KHUON = { "1": "D9.6 (25.4x22)", "2": "D12.7 (31.75x27.5)", "3": "D12.7 (50x25)", "4": "D16 Đồng (45x45)", "5": "D16 Đồng (50x50)", "6": "D16 Inox (45x45)", "7": "D16 Inox (50x50)" };
const DICT_MOI_CHAT = { "R": "Freon", "A": "NH3", "W": "Nước", "G": "Glycol" };
const DICT_VAN_HANH = { "X": "Tiết lưu", "P": "Bơm dịch", "G": "Bầu đổ/Dịch tràn", "L": "LVS" };
const DICT_QUAT = { "Z": "Ziehl-Abegg", "KR": "Kruger", "M": "Maer" };
const DICT_XA_DA = { "E": "Điện trở", "H": "Gas nóng", "A": "Gió", "W": "Nước" };
const DICT_CHUAN = { "G": "Chuẩn G", "Y": "Yêu cầu KH", "S": "Đặc biệt", "T": "Chuẩn T" };

let currentModexMode = 'gt';

function switchModexTab(mode) {
    currentModexMode = mode;
    
    const tabGt = document.getElementById('tab-model-gt');
    const tabG = document.getElementById('tab-model-g');
    const tabK = document.getElementById('tab-model-k');
    
    if (tabGt) { tabGt.classList.remove('active'); tabGt.style.background = '#e0e0e0'; tabGt.style.color = '#333'; }
    if (tabG) { tabG.classList.remove('active'); tabG.style.background = '#e0e0e0'; tabG.style.color = '#333'; }
    if (tabK) { tabK.classList.remove('active'); tabK.style.background = '#e0e0e0'; tabK.style.color = '#333'; }
    
    const activeTab = document.getElementById('tab-model-' + mode);
    if (activeTab) {
        activeTab.classList.add('active');
        // Let CSS handle the active state background, but we reset inline style just in case
        activeTab.style.background = '';
        activeTab.style.color = '';
    }
    
    const input = document.getElementById('modex-input');
    if (input) {
        if (mode === 'gt') input.placeholder = "VD: TD - N6.RX - 3Z50 - E6/7/S";
        else if (mode === 'g') input.placeholder = "VD: S-GCHVRD 090 2 0 F / 1 1 A - 60";
        else if (mode === 'k') input.placeholder = "VD: SPBE 05 2 D - EC";
        input.value = '';
    }
    
    const resultContainer = document.getElementById('modex-result-container');
    if (resultContainer) resultContainer.style.display = 'none';
    onModexInputChange();
}

function onModexInputChange() {
    const btn = document.getElementById('btn-modex-generate');
    if (btn) {
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        btn.disabled = false;
    }
}

function decodeModelUI() {
    const input = document.getElementById('modex-input').value.trim();
    const resultContainer = document.getElementById('modex-result-container');
    const resultGrid = document.getElementById('modex-result-grid');
    const errorDiv = document.getElementById('modex-error');
    const btn = document.getElementById('btn-modex-generate');
    
    if (!input) {
        alert("Vui lòng nhập mã Model cần dịch!");
        return;
    }
    
    if (btn) {
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
        btn.disabled = true;
    }
    
    let parsed;
    if (currentModexMode === 'gt') {
        parsed = decodeModelStr(input);
    } else if (currentModexMode === 'g') {
        parsed = decodeGuntner(input);
    } else if (currentModexMode === 'k') {
        parsed = decodeKelvion(input);
    }
    
    resultContainer.style.display = 'block';
    
    if (parsed.error && typeof parsed.error === 'string') {
        errorDiv.innerText = parsed.error;
        errorDiv.style.display = 'block';
        resultGrid.innerHTML = '';
    } else {
        errorDiv.style.display = 'none';
        resultGrid.innerHTML = '';
        parsed.data.forEach(item => {
            const card = document.createElement('div');
            card.style.background = item.error ? '#ffebee' : '#f8f9fa';
            card.style.border = item.error ? '1px solid #ef5350' : '1px solid #ddd';
            card.style.padding = '15px';
            card.style.borderRadius = '8px';
            card.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
            
            card.innerHTML = `
                <div style="font-size: 0.85rem; color: #888; margin-bottom: 8px; font-weight: bold;">${item.label}</div>
                <div style="font-size: 1.15rem; font-weight: bold; color: ${item.error ? '#d32f2f' : (item.value === '---' ? '#999' : 'var(--primary)')};">${item.value}</div>
            `;
            resultGrid.appendChild(card);
        });
    }
}

function decodeModelStr(code) {
    code = code.trim().toUpperCase().replace(/\s+/g, '');
    
    // Khởi tạo 12 thẻ với giá trị rỗng '---'
    let output = [
        { label: "[01] LOẠI THIẾT BỊ", value: "---" },
        { label: "[02] VẬT LIỆU LÁ", value: "---" },
        { label: "[03] KHUÔN ỐNG", value: "---" },
        { label: "[04] MÔI CHẤT", value: "---" },
        { label: "[05] VẬN HÀNH", value: "---" },
        { label: "[06] SỐ LƯỢNG QUẠT", value: "---" },
        { label: "[07] THƯƠNG HIỆU QUẠT", value: "---" },
        { label: "[08] KÍCH THƯỚC QUẠT", value: "---" },
        { label: "[09] XẢ ĐÁ", value: "---" },
        { label: "[10] KÍCH THƯỚC COIL", value: "---" },
        { label: "[11] KHE LÁ", value: "---" },
        { label: "[12] TIÊU CHUẨN", value: "---" }
    ];

    let parts = code.split('-');
    if (parts.length < 2) {
        return { error: "Mã Model không đúng định dạng (cần ít nhất 2 hoặc 3 phần chia bởi dấu '-')" };
    }
    
    let part1 = parts[0]; 
    let loaiDanText = DICT_LOAI_DAN[part1] || "Không xác định";
    output[0].value = `${part1} : ${loaiDanText}`;
    
    let part2 = parts[1]; 
    let p2match = part2.match(/^([A-Z])(\d)\.([A-Z])([A-Z])$/);
    if (p2match) {
        let vatLieuText = DICT_VAT_LIEU[p2match[1]] || "Không xác định";
        let khuonText = DICT_KHUON[p2match[2]] || "Không xác định";
        let moiChatText = DICT_MOI_CHAT[p2match[3]] || "Không xác định";
        let vanHanhText = DICT_VAN_HANH[p2match[4]] || "Không xác định";
        
        output[1].value = `${p2match[1]} : ${vatLieuText}`;
        output[2].value = `${p2match[2]} : ${khuonText}`;
        output[3].value = `${p2match[3]} : ${moiChatText}`;
        output[4].value = `${p2match[4]} : ${vanHanhText}`;
    } else {
        output[1].value = "Lỗi định dạng";
        output[1].error = true;
    }
    
    let isDC = (part1 === "DC");
    let part3 = "";
    let part4 = "";
    
    if (isDC) {
        if (parts[2]) part4 = parts[2];
    } else {
        if (parts[2]) part3 = parts[2]; 
        if (parts[3]) {
            part4 = parts.slice(3).join('-'); 
        }
    }
    
    let fanQty = 1;
    let fanDkStr = "";
    
    if (!isDC && part3) {
        let p3match = part3.match(/^(\d+)([A-Z]+)(\d+)$/);
        if (p3match) {
            fanQty = parseInt(p3match[1]) || 1;
            fanDkStr = (parseInt(p3match[3]) * 10).toString();
            let quatText = DICT_QUAT[p3match[2]] || p3match[2];
            
            output[5].value = `${fanQty} quạt`;
            output[6].value = `${quatText}`;
            output[7].value = `Ø${fanDkStr}`;
        } else {
            output[5].value = part3;
            output[5].error = true;
        }
    }
    
    if (part4) {
        let p4parts = part4.split('/');
        let mainDims = p4parts[0]; 
        
        let xada = "";
        let dims = mainDims;
        
        if (!isDC && mainDims.length > 0) {
            if (/^[a-zA-Z]/.test(mainDims)) {
                xada = mainDims.charAt(0);
                dims = mainDims.substring(1);
                let xaDaText = DICT_XA_DA[xada] || "Không xác định";
                output[8].value = `${xada} : ${xaDaText}`;
            } else {
                dims = mainDims;
            }
        }
        
        let dimStr = "---";
        let ngangVal = 0;
        if (dims.includes('X')) {
            dimStr = dims.toLowerCase().replace(/x/g, ' x ');
            let xMatch = dims.match(/^(\d+)/i);
            if (xMatch) ngangVal = parseInt(xMatch[1]);
        } else if (dims.length > 0 && dims.length <= 3 && !dims.includes('.')) {
            ngangVal = parseInt(dims) || 0;
            let standardCoils = (window.GT_CONFIG && window.GT_CONFIG.STANDARD_COILS) ? window.GT_CONFIG.STANDARD_COILS : {};
            if (fanDkStr && standardCoils[fanDkStr]) {
                let sData = standardCoils[fanDkStr];
                let expectedDai = (fanQty === 3 && sData.dai_3_quat) ? sData.dai_3_quat : (sData.dai_1_quat * fanQty);
                dimStr = `Ngang ${dims}, Cao ${sData.cao}, Dài ${expectedDai / 1000}m`;
            } else {
                dimStr = `Ngang ${dims}, Cao/Dài: ---`;
            }
        } else if (dims.length > 0) {
            let dimMatch = dims.match(/^(\d{1,2})(\d{2})(\d+\.\d+)$/);
            if (!dimMatch) {
                dimMatch = dims.match(/^(\d{1,2})(\d{1})(\d+\.\d+)$/);
            }
            if (dimMatch) {
                ngangVal = parseInt(dimMatch[1]);
                dimStr = `Ngang ${dimMatch[1]}, Cao ${dimMatch[2]}, Dài ${dimMatch[3]}m`;
            } else {
                dimStr = `Chuỗi: ${dims}`;
            }
        }
        
        if (dimStr !== "---") {
            output[9].value = dimStr;
        }
        
        if (p4parts[1]) {
            let kheLaVal = p4parts[1];
            let kheLaNum = parseFloat(kheLaVal.replace(',', '.')) || 0;
            let isDecimal = kheLaVal.includes('.') || kheLaVal.includes(',');
            
            if (ngangVal > 6 && (isDecimal || kheLaNum > 11)) {
                output[10].value = `${kheLaVal} mm<br><span style="font-size: 0.75rem; color: #e65100; font-weight: normal; font-style: italic; margin-top: 5px; display: inline-block;">(Lưu ý: Có thể là tổ hợp khe lá)</span>`;
            } else {
                output[10].value = `${kheLaVal} mm`;
            }
        }
        if (p4parts[2]) {
            let chuanText = DICT_CHUAN[p4parts[2]] || "Không xác định";
            output[11].value = `${p4parts[2]} : ${chuanText}`;
        }
    }
    
    return { data: output };
}

// =====================================
// GIẢI MÁ KELVION KÜBA (MARKET PLUS SP)
// =====================================
function decodeKelvion(code) {
    code = code.trim().toUpperCase().replace(/\s+/g, '');
    let output = [];
    
    if (!code.startsWith('SP')) {
        return { error: true, data: [{ label: "Lỗi", value: "Mã Kelvion Küba dòng Market Plus SP phải bắt đầu bằng 'SP'." }] };
    }
    
    output.push({ label: "[01] Dòng sản phẩm", value: "SP : Dàn lạnh thương mại Market Plus" });
    
    let regex = /^SP([AB])?([EH])?(\d{2})([1-5])([A-Z])(-EC)?$/;
    let match = code.match(regex);
    
    if (!match) {
        return { error: true, data: [{ label: "Lỗi", value: "Mã không đúng định dạng dòng SP của Kelvion Küba." }] };
    }
    
    let finSpacing = match[1];
    let defrost = match[2];
    let size = match[3];
    let fanQty = match[4];
    let generation = match[5];
    let isEC = match[6];
    
    let finText = finSpacing === 'A' ? '4.5 mm' : (finSpacing === 'B' ? '7.0 mm' : 'Không xác định');
    output.push({ label: "[02] Khe lá (Fin spacing)", value: `${finSpacing || ''} : ${finText}` });
    
    let defrostText = 'Bằng gió tự nhiên (Air)';
    if (defrost === 'E') defrostText = 'Bằng điện trở (Electric)';
    else if (defrost === 'H') defrostText = 'Bằng gas nóng (Hot gas)';
    output.push({ label: "[03] Xả đá (Defrost)", value: `${defrost || 'Mặc định'} : ${defrostText}` });
    
    let fanDiam = "Không xác định";
    let sizeNum = parseInt(size);
    if (sizeNum === 1 || sizeNum === 2) fanDiam = "Ø 250 mm";
    else if (sizeNum === 3 || sizeNum === 4) fanDiam = "Ø 300 mm";
    else if (sizeNum === 5 || sizeNum === 6) fanDiam = "Ø 400 mm";
    else if (sizeNum === 7 || sizeNum === 8) fanDiam = "Ø 500 mm";
    
    output.push({ label: "[04] Kích cỡ dàn & Quạt", value: `${size} : ${fanDiam}` });
    output.push({ label: "[05] Số lượng quạt", value: `${fanQty} quạt` });
    
    let genText = generation === 'D' ? 'Ống đồng D12.7, tim lỗ 50x25' : 'Không xác định';
    output.push({ label: "[06] Thế hệ sản phẩm", value: `${generation} : ${genText}` });
    
    let fanTech = isEC ? "Công nghệ EC (Tiết kiệm điện)" : "Công nghệ AC tiêu chuẩn";
    output.push({ label: "[07] Công nghệ quạt", value: isEC ? "-EC : " + fanTech : "Mặc định : " + fanTech });
    
    return { data: output };
}

// =====================================
// GIẢI MÁ GÜNTNER
// =====================================
function getTubeRows(char) {
    if (!char) return 'Không xác định';
    let code = char.toUpperCase().charCodeAt(0);
    if (code >= 65 && code <= 78) {
        return `${char} : ${code - 64} hàng`;
    }
    return char;
}

function decodeGuntner(code) {
    code = code.trim().toUpperCase().replace(/\s+/g, '');
    let output = [];
    
    let isSpecial = false;
    if (code.startsWith('S-')) {
        isSpecial = true;
        code = code.substring(2);
        output.push({ label: "[00] Thiết kế", value: "S- : Sản phẩm thiết kế đặc biệt (Special Design)" });
    }
    
    if (!code.startsWith('G')) {
        return { error: true, data: [{ label: "Lỗi", value: "Mã Güntner phải bắt đầu bằng chữ 'G'." }] };
    }
    
    if (code.startsWith('GCH') || code.startsWith('GCV') || code.startsWith('GCD') || code.startsWith('GC0')) {
        return decodeGuntnerCondenser(code, output);
    } else if (code.startsWith('GHN')) {
        return decodeGuntnerGHN(code, output);
    } else if (code.startsWith('GA')) {
        if (code.match(/^G[A-Z][A-Z]C/)) {
            return decodeGuntnerCompact(code, output);
        } else {
            return decodeGuntnerAirCooler(code, output);
        }
    } else {
        return { error: true, data: [{ label: "Lỗi", value: "Không nhận diện được dòng sản phẩm Güntner." }] };
    }
}

function decodeGuntnerCondenser(code, output) {
    let match = code.match(/^G(C)(.)(.)(.)(.)(\d{3})(\d)(.)(.)\/(\d+)(\d+)([A-Z])-(\d+)/);
    if (!match) return { error: true, data: [{ label: "Lỗi", value: "Không đúng định dạng Condenser/Fluid Cooler của Güntner." }] };
    
    output.push({ label: "[01] Chức năng", value: `${match[1]} : Condenser / Fluid Cooler` });
    let posDict = { 'H': 'Horizontal', 'V': 'Vertical', 'D': 'Diagonal', '0': 'No coil' };
    output.push({ label: "[02] Vị trí cuộn dây", value: `${match[2]} : ${posDict[match[2]] || 'Không xác định'}` });
    let lineDict = { 'C': 'COMPACT', 'V': 'VARIO', 'A': 'APPLICATION' };
    output.push({ label: "[03] Dòng sản phẩm", value: `${match[3]} : ${lineDict[match[3]] || 'Không xác định'}` });
    let fluidDict = { 'R': 'Refrigerants', 'C': 'CO2', 'A': 'Ammonia', 'F': 'Fluids', 'W': 'Water' };
    output.push({ label: "[04] Chất tải lạnh", value: `${match[4]} : ${fluidDict[match[4]] || 'Không xác định'}` });
    let modeDict = { 'D': 'Dry', 'E': 'Evaporative', 'H': 'Hybrid', 'P': 'HydroPad', 'S': 'HydroSpray' };
    output.push({ label: "[05] Chế độ vận hành", value: `${match[5]} : ${modeDict[match[5]] || 'Không xác định'}` });
    output.push({ label: "[06] Đường kính quạt", value: `${match[6]} : Ø ${parseInt(match[6])} cm` });
    output.push({ label: "[07] Phiên bản & Mô-đun", value: `Version ${match[7]}, Module ${match[8]}` });
    output.push({ label: "[08] Công nghệ trao đổi nhiệt", value: `${match[9]} : ${match[9] === 'F' ? 'Finoox' : (match[9] === 'M' ? 'Microox' : 'Không xác định')}` });
    output.push({ label: "[09] Cấu hình quạt", value: `${match[10]} hàng x ${match[11]} quạt/hàng` });
    output.push({ label: "[10] Công nghệ quạt", value: `${match[12]} : ${match[12] === 'A' ? 'AC' : (match[12] === 'E' ? 'EC' : 'Không xác định')}` });
    output.push({ label: "[11] Mức áp suất âm thanh", value: `${match[13]} : ${match[13]} dB(A) tại 10m` });
    
    return { data: output };
}

function decodeGuntnerAirCooler(code, output) {
    let match = code.match(/^G(A)(.)(.)(.)(.)(\d{3})\.(\d)([A-Z])([A-Z])\/(\d+)([A-Z])-(\d+)\.([A-Z])/);
    if (!match) return { error: true, data: [{ label: "Lỗi", value: "Không đúng định dạng Air Cooler của Güntner." }] };
    
    output.push({ label: "[01] Chức năng", value: `${match[1]} : Air cooler / Evaporator` });
    let casingDict = { 'S': 'Slim', 'C': 'Cubic', 'D': 'Dual', 'I': 'Insulated', 'F': 'Floor mounted' };
    output.push({ label: "[02] Loại vỏ", value: `${match[2]} : ${casingDict[match[2]] || 'Không xác định'}` });
    let lineDict = { 'C': 'COMPACT', 'V': 'VARIO', 'A': 'APPLICATION' };
    output.push({ label: "[03] Dòng sản phẩm", value: `${match[3]} : ${lineDict[match[3]] || 'Không xác định'}` });
    let fluidDict = { 'W': 'Water', 'R': 'Refrigerants', 'C': 'CO2', 'A': 'Ammonia' };
    output.push({ label: "[04] Chất tải lạnh", value: `${match[4]} : ${fluidDict[match[4]] || 'Không xác định'}` });
    let modeDict = { 'P': 'Pump', 'X': 'DX', 'G': 'Gravity' };
    output.push({ label: "[05] Chế độ vận hành", value: `${match[5]} : ${modeDict[match[5]] || 'Không xác định'}` });
    output.push({ label: "[06] Đường kính quạt", value: `${match[6]} : Ø ${parseInt(match[6])} cm` });
    output.push({ label: "[07] Phiên bản", value: `Version ${match[7]}` });
    output.push({ label: "[08] Số hàng ống theo hướng gió", value: getTubeRows(match[8]) });
    let finPatDict = { 'F': '12.7 tim 50x25', 'N': '16 tim 50x50', 'S': 'D22 tim 60x60', 'H': '9.6 tim 25x22', 'T': 'D22 tim 60x52' };
    output.push({ label: "[09] Kiểu cánh tản nhiệt", value: `${match[9]} : ${finPatDict[match[9]] || 'Không xác định'}` });
    output.push({ label: "[10] Số lượng quạt", value: `${match[10]} quạt` });
    output.push({ label: "[11] Công nghệ quạt", value: `${match[11]} : ${match[11] === 'A' ? 'AC' : (match[11] === 'E' ? 'EC' : 'Không xác định')}` });
    output.push({ label: "[12] Khoảng cách cánh tản nhiệt", value: `${match[12]} : ${(parseInt(match[12])/10).toFixed(1)} mm` });
    let defrostDict = { 'A': 'Air', 'B': 'Brine', 'E': 'Electrical', 'H': 'Hot gas', 'W': 'Water' };
    output.push({ label: "[13] Kiểu xả đá", value: `${match[13]} : ${defrostDict[match[13]] || 'Không xác định'}` });
    
    return { data: output };
}

function decodeGuntnerCompact(code, output) {
    let match = code.match(/^G(A)(.)(C)(.)(.)-(\d{3})\.(\d)\/(\d)(.)(.)\/(.)(.)(.)(\d)([A-Z])-(.)(.)(.)(.)(.*)$/);
    if (!match) return { error: true, data: [{ label: "Lỗi", value: "Không đúng định dạng Compact Air Cooler của Güntner." }] };
    
    output.push({ label: "[01] Chức năng & Dòng", value: `Compact Air Cooler` });
    let casingDict = { 'S': 'Slim', 'C': 'Cubic', 'D': 'Dual', 'M': 'Mini' };
    output.push({ label: "[02] Loại vỏ", value: `${match[2]} : ${casingDict[match[2]] || 'Không xác định'}` });
    let fluidDict = { 'C': 'CO2', 'R': 'Fluids', 'F': 'Potentially Flammable', 'P': 'Refrigerants', 'W': 'Water' };
    output.push({ label: "[03] Chất tải lạnh", value: `${match[4]} : ${fluidDict[match[4]] || 'Không xác định'}` });
    output.push({ label: "[04] Chế độ vận hành", value: `${match[5]} : ${match[5] === 'X' ? 'DX' : (match[5] === 'P' ? 'Pump' : 'Không xác định')}` });
    output.push({ label: "[05] Đường kính quạt", value: `${match[6]} : Ø ${parseInt(match[6])} cm` });
    output.push({ label: "[06] Phiên bản", value: `Version ${match[7]}` });
    output.push({ label: "[07] Số lượng quạt", value: `${match[8]} quạt` });
    
    let fanTechDict = { '1': '1~, 230V, EC', '2': '3~, 400V, EC', 'W': '1~, 230V, AC', 'S': '3~, 400V, AC' };
    output.push({ label: "[08] Nguồn điện quạt", value: `${match[9]} : ${fanTechDict[match[9]] || 'Không xác định'}` });
    output.push({ label: "[09] Tốc độ quạt", value: `${match[10]}` });
    
    output.push({ label: "[10] Số hàng ống ngang", value: getTubeRows(match[11]) });
    output.push({ label: "[11] Số hàng ống hướng gió", value: getTubeRows(match[12]) });
    
    let finMatDict = { 'A': 'Aluminium', 'C': 'Coil Defender', 'E': 'Epoxy' };
    output.push({ label: "[12] Vật liệu lá", value: `${match[13]} : ${finMatDict[match[13]] || 'Không xác định'}` });
    output.push({ label: "[13] Khe lá", value: `${match[14]} mm` });
    output.push({ label: "[14] Xả đá", value: `${match[15]} : ${match[15] === 'A' ? 'Air' : (match[15] === 'E' ? 'Electric' : 'Không xác định')}` });
    
    let electDict = { 'T': 'Terminal Box', 'R': 'Repair switch', 'U': 'Unwired' };
    let airAccDict = { 'A': 'Air Streamer', 'H': 'Hose connection', 'S': 'Shut Up', 'N': 'No accessories' };
    let pumpDict = { 'P': 'Bơm GADC', 'N': 'No pump' };
    let connDict = { 'T': 'Thread', 'W': 'Welded', 'L': 'Lapped', 'N': 'No connection accessory' };
    
    output.push({ label: "[15] Phụ kiện điện", value: `${match[16]} : ${electDict[match[16]] || 'Không xác định'}` });
    output.push({ label: "[16] Phụ kiện gió", value: `${match[17]} : ${airAccDict[match[17]] || 'Không xác định'}` });
    output.push({ label: "[17] Bơm & Kết nối", value: `Bơm: ${pumpDict[match[18]]||match[18]} | Nối: ${connDict[match[19]]||match[19]}` });
    if (match[20]) output.push({ label: "[18] Số chu trình", value: match[20] });
    
    return { data: output };
}

function decodeGuntnerGHN(code, output) {
    let match = code.match(/^GHN(\d{3})\.(\d)([A-Z])\/(\d)(\d+)-([A-Z])-([A-Z])([A-Z])/);
    if (!match) return { error: true, data: [{ label: "Lỗi", value: "Không đúng định dạng Unit Cooler GHN của Güntner." }] };
    
    output.push({ label: "[01] Dòng sản phẩm", value: `GHN : Dàn lạnh treo tường / áp trần` });
    output.push({ label: "[02] Đường kính quạt", value: `${match[1]} : Ø ${parseInt(match[1]) * 10} mm` });
    output.push({ label: "[03] Thế hệ", value: `Gen ${match[2]}` });
    output.push({ label: "[04] Số hàng ống ngang", value: getTubeRows(match[3]) });
    output.push({ label: "[05] Số lượng quạt", value: `${match[4]} quạt` });
    output.push({ label: "[06] Khe lá", value: `${match[5]} mm` });
    
    let defrostDict = { 'A': 'Air / Non defrost', 'E': 'Electric on request', 'H': 'Hot gas on request' };
    output.push({ label: "[07] Xả đá", value: `${match[6]} : ${defrostDict[match[6]] || 'Không xác định'}` });
    let designDict = { 'N': 'Standard design', 'H': 'Reinforced design' };
    output.push({ label: "[08] Thiết kế quạt", value: `${match[7]} : ${designDict[match[7]] || 'Không xác định'}` });
    let voltDict = { 'D': '400V | 3~ | 50Hz | Δ', 'W': '230V | 1~ | 50Hz', 'S': '400V | 3~ | 50Hz | Y' };
    output.push({ label: "[09] Nguồn quạt", value: `${match[8]} : ${voltDict[match[8]] || 'Không xác định'}` });
    
    return { data: output };
}
