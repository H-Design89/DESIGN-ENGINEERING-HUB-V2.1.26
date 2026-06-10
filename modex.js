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
    
    const parsed = decodeModelStr(input);
    resultContainer.style.display = 'block';
    
    if (parsed.error) {
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
    output[0].value = `${part1} (${loaiDanText})`;
    
    let part2 = parts[1]; 
    let p2match = part2.match(/^([A-Z])(\d)\.([A-Z])([A-Z])$/);
    if (p2match) {
        let vatLieuText = DICT_VAT_LIEU[p2match[1]] || "Không xác định";
        let khuonText = DICT_KHUON[p2match[2]] || "Không xác định";
        let moiChatText = DICT_MOI_CHAT[p2match[3]] || "Không xác định";
        let vanHanhText = DICT_VAN_HANH[p2match[4]] || "Không xác định";
        
        output[1].value = `${p2match[1]} (${vatLieuText})`;
        output[2].value = `${p2match[2]} (${khuonText})`;
        output[3].value = `${p2match[3]} (${moiChatText})`;
        output[4].value = `${p2match[4]} (${vanHanhText})`;
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
                output[8].value = `${xada} (${xaDaText})`;
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
            output[11].value = `${p4parts[2]} (${chuanText})`;
        }
    }
    
    return { data: output };
}

