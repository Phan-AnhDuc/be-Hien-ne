// Logic chính (load page, CRUD, UI)
let currentPage = 'vitri';
let currentData = null;
let editingId = null;

// Show page
function showPage(pageName, element) {
    currentPage = pageName;
    editingId = null;

    // Update menu
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Activate clicked menu item
    if (element) {
        element.classList.add('active');
    } else {
        // Fallback: find menu item by page name
        const menuItems = Array.from(document.querySelectorAll('.menu-item'));
        const pageNames = Object.keys(pages);
        const pageIndex = pageNames.indexOf(pageName);
        if (pageIndex >= 0 && menuItems[pageIndex]) {
            menuItems[pageIndex].classList.add('active');
        }
    }

    // Load page
    loadPage();
}

// Load page content
async function loadPage() {
    const page = pages[currentPage];
    if (!page) return;

    const content = document.getElementById('page-content');
    content.innerHTML = `
        <div class="page-header">
            <h2>${page.title}</h2>
            <p>Quản lý thông tin ${page.title.toLowerCase()}</p>
        </div>
        <div id="alert" class="alert"></div>
        <div class="toolbar">
            <button class="btn btn-primary" onclick="openAddModal()">
                ➕ Thêm Mới
            </button>
            <button class="btn btn-secondary" onclick="loadData()">
                🔄 Tải Lại
            </button>
        </div>
        <div id="table-container" class="table-container">
            <div class="loading">
                <div class="spinner"></div>
                <p>Đang tải dữ liệu...</p>
            </div>
        </div>
    `;

    await loadData();
}

// Load data
async function loadData() {
    const page = pages[currentPage];
    const container = document.getElementById('table-container');

    try {
        const result = await apiGet(page.api);

        if (result.success) {
            currentData = result.data;
            renderTable(result.data);
            showAlert(`Đã tải ${result.count || result.data.length} bản ghi`, 'success');
        } else {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><p>Không có dữ liệu</p></div>';
            showAlert(result.message || 'Lỗi khi tải dữ liệu', 'error');
        }
    } catch (error) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">❌</div><p>Lỗi kết nối server</p></div>';
        showAlert('Lỗi: ' + error.message, 'error');
    }
}

// Render table
function renderTable(data) {
    const page = pages[currentPage];
    const container = document.getElementById('table-container');

    if (!data || data.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><p>Chưa có dữ liệu</p></div>';
        return;
    }

    let html = '<table><thead><tr>';
    page.displayFields.forEach(field => {
        html += `<th>${getFieldLabel(field)}</th>`;
    });
    html += '<th>Thao Tác</th></tr></thead><tbody>';

    data.forEach((item, index) => {
        html += '<tr>';
        page.displayFields.forEach(field => {
            let value = item[field];
            if (value === null || value === undefined) value = '-';
            if (typeof value === 'boolean') {
                value = value ? 'Còn hiệu lực' : 'Hết hiệu lực';
            }
            if (field === 'tongtien' || field === 'tiengiamgia' || field === 'tongTien') {
                value = value ? parseFloat(value).toLocaleString('vi-VN') + ' đ' : '0 đ';
            }
            if (field === 'phantramgiam') {
                value = value + '%';
            }
            if ((field === 'ngayNhap' || field === 'ngayNhapCuoi' || field === 'ngayLap') && value) {
                const date = new Date(value);
                if (field === 'ngayNhapCuoi') {
                    // ngayNhapCuoi là DATE, không có giờ
                    value = date.toLocaleDateString('vi-VN');
                } else {
                    // ngayNhap và ngayLap là DATETIME, có giờ
                    value = date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                }
            }
            if (field === 'diemDaDung' && value !== null && value !== undefined) {
                value = parseInt(value) || 0;
            }
            html += `<td>${value}</td>`;
        });
        html += `<td class="action-btns">
            <button class="btn btn-warning btn-sm" onclick="openEditModal(${index})">✏️ Sửa</button>
            <button class="btn btn-danger btn-sm" onclick="deleteItem(${index})">🗑️ Xóa</button>`;
        
        // Add PDF and Excel export buttons for invoices
        if (currentPage === 'hoadon') {
            html += `<button class="btn btn-secondary btn-sm" onclick="exportPDF('${item.maHD}')">📄 PDF</button>`;
            html += `<button class="btn btn-success btn-sm" onclick="exportExcel('${item.maHD}')">📊 Excel</button>`;
        }
        
        // Add view detail button for phieunhap
        if (currentPage === 'phieunhap') {
            html += `<button class="btn btn-primary btn-sm" onclick="viewPhieuNhapDetail(${item.id}, '${item.maPN}')">👁️ Xem Chi Tiết</button>`;
        }
        
        html += `</td></tr>`;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

// Get field label
function getFieldLabel(fieldName) {
    const page = pages[currentPage];
    const field = page.fields.find(f => f.name === fieldName);
    return field ? field.label : fieldName;
}

// Open add modal
function openAddModal() {
    editingId = null;
    const page = pages[currentPage];
    document.getElementById('modal-title').textContent = `Thêm ${page.title}`;
    renderForm();
    document.getElementById('modal').classList.add('active');
}

// Open edit modal
function openEditModal(index) {
    editingId = index;
    const page = pages[currentPage];
    document.getElementById('modal-title').textContent = `Sửa ${page.title}`;
    renderForm(currentData[index]);
    document.getElementById('modal').classList.add('active');
}

// Render form
async function renderForm(data = null) {
    const page = pages[currentPage];
    const modalBody = document.getElementById('modal-body');

    let html = '<form id="data-form" onsubmit="saveData(event)">';
    
    for (const field of page.fields) {
        let value = data ? (data[field.name] ?? '') : '';
        
        // Format date for input
        if (field.type === 'date' && value && value.includes('T')) {
            value = value.split('T')[0];
        } else if (field.type === 'date' && value && !value.includes('T')) {
            // Already formatted
        } else if (field.type === 'number' && value !== '') {
            value = parseFloat(value);
        } else if (field.name === 'gioitinh') {
            // gioitinh is string 'Nam' or 'Nữ', keep as is
            value = value || '';
        } else if (field.type === 'select' && value === true) {
            value = '1';
        } else if (field.type === 'select' && value === false) {
            value = '0';
        } else if (field.type === 'select' && typeof value === 'boolean') {
            value = value ? '1' : '0';
        }
        
        // Special handling for invoice discount code - use codeMGG from data
        if (field.name === 'codeMGG' && data && data.codeMGG) {
            value = data.codeMGG;
        }
        
        html += `<div class="form-group">
            <label>${field.label} ${field.required ? '<span style="color:red">*</span>' : ''}</label>`;

        if (field.type === 'select') {
            html += `<select name="${field.name}" ${field.required ? 'required' : ''} id="select-${field.name}">`;
            
            // If field has predefined options, use them
            if (field.options) {
                field.options.forEach(opt => {
                    html += `<option value="${opt.value}" ${value == opt.value ? 'selected' : ''}>${opt.label}</option>`;
                });
            } else {
                // Load options dynamically from API
                html += '<option value="">Đang tải...</option>';
            }
            
            html += '</select>';
        } else {
            const inputType = field.type === 'number' ? 'number' :
                field.type === 'date' ? 'date' :
                    field.type === 'email' ? 'email' : 'text';
            const readonly = (field.name.includes('ma') && data && !field.name.includes('codeMGG')) ? 'readonly' : '';
            html += `<input type="${inputType}" name="${field.name}" value="${value}" ${field.required ? 'required' : ''} ${readonly} step="${field.type === 'number' ? 'any' : ''}" placeholder="${field.name === 'codeMGG' ? 'Nhập mã giảm giá (ví dụ: SALE10)' : ''}">`;
        }
        html += '</div>';
    }
    html += `<div class="form-actions">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Hủy</button>
        <button type="submit" class="btn btn-success">💾 Lưu</button>
    </div></form>`;

    modalBody.innerHTML = html;
    
    // Load dynamic select options - wait for DOM to be ready
    // Use requestAnimationFrame to ensure DOM is fully rendered
    requestAnimationFrame(async () => {
        const loadPromises = [];
        for (const field of page.fields) {
            if (field.type === 'select' && !field.options) {
                // Get the correct value from data for this specific field
                const fieldValue = data ? (data[field.name] ?? '') : '';
                loadPromises.push(loadSelectOptions(field.name, fieldValue));
            }
        }
        // Load all selects in parallel
        await Promise.all(loadPromises);
    });
}

// Load select options from API
async function loadSelectOptions(fieldName, selectedValue = '') {
    const select = document.getElementById(`select-${fieldName}`);
    if (!select) return;
    
    try {
        let apiEndpoint = '';
        let valueField = 'id';
        let labelField = '';
        
        if (fieldName === 'idNV') {
            apiEndpoint = 'nhanvien';
            labelField = 'tenNV';
        } else if (fieldName === 'idKH') {
            apiEndpoint = 'khachhang';
            labelField = 'tenKH';
        } else if (fieldName === 'idKM') {
            apiEndpoint = 'khuyenmai';
            labelField = 'tenKM';
        } else if (fieldName === 'idVT') {
            apiEndpoint = 'vitri';
            labelField = 'tenVT';
        } else if (fieldName === 'idPLKH') {
            apiEndpoint = 'phanloaikh';
            labelField = 'tenPLKH';
        } else if (fieldName === 'idPLSP') {
            apiEndpoint = 'phanloaisanpham';
            labelField = 'tenPLSP';
        } else if (fieldName === 'idHD') {
            apiEndpoint = 'hoadon';
            labelField = 'maHD';
        } else if (fieldName === 'idHang') {
            apiEndpoint = 'hanghoa';
            labelField = 'tenHang';
        }
        
        if (!apiEndpoint) return;
        
        const result = await apiGet(apiEndpoint);
        if (result.success && result.data && result.data.length > 0) {
            select.innerHTML = '<option value="">Chọn...</option>';
            result.data.forEach(item => {
                const optionValue = item[valueField];
                const optionLabel = item[labelField] || item[`ma${fieldName.replace('id', '')}`] || optionValue;
                // Convert both to string for comparison to handle number/string mismatch
                const selected = String(optionValue) === String(selectedValue) ? 'selected' : '';
                select.innerHTML += `<option value="${optionValue}" ${selected}>${optionLabel}</option>`;
            });
        } else {
            console.warn(`No data returned for ${fieldName} from ${apiEndpoint}:`, result);
            select.innerHTML = '<option value="">Không có dữ liệu</option>';
        }
    } catch (error) {
        console.error(`Error loading options for ${fieldName}:`, error);
        const select = document.getElementById(`select-${fieldName}`);
        if (select) {
            select.innerHTML = '<option value="">Lỗi tải dữ liệu</option>';
        }
    }
}

// Save data
async function saveData(event) {
    event.preventDefault();
    const page = pages[currentPage];
    const form = event.target;
    const formData = new FormData(form);
    const data = {};

    formData.forEach((value, key) => {
        if (value !== '') {
            if (key === 'gioitinh') {
                // gioitinh should be string 'Nam' or 'Nữ', not boolean
                data[key] = value; // Keep as string ('Nam' or 'Nữ')
            } else if (key.includes('ngay') || key.includes('date')) {
                data[key] = value;
            } else if (key === 'sdt') {
                // sdt must be string, not number
                data[key] = String(value);
            } else if (key.startsWith('id') || key.includes('id')) {
                // ID fields should be numbers
                data[key] = parseInt(value) || parseFloat(value);
            } else if (!isNaN(value) && value !== '') {
                // Other numeric fields
                data[key] = parseFloat(value);
            } else {
                data[key] = value;
            }
        }
    });

    try {
        let endpoint = page.api;
        let result;

        if (editingId !== null) {
            const item = currentData[editingId];
            if (page.compositeKey) {
                const keys = page.compositeKey.map(k => item[k]).join('/');
                endpoint += `/${keys}`;
            } else {
                // Use id for phieunhap, otherwise use ma field
                if (currentPage === 'phieunhap') {
                    endpoint += `/${item.id}`;
                } else {
                    const keyField = page.fields.find(f => f.name.includes('ma') && f.required);
                    endpoint += `/${item[keyField ? keyField.name : 'id']}`;
                }
            }
            result = await apiPut(endpoint, data);
        } else {
            result = await apiPost(endpoint, data);
        }

        if (result.success) {
            showAlert(result.message, 'success');
            closeModal();
            await loadData();
        } else {
            showAlert(result.message || 'Lỗi khi lưu dữ liệu', 'error');
        }
    } catch (error) {
        showAlert('Lỗi: ' + error.message, 'error');
    }
}

// Delete item
async function deleteItem(index) {
    if (!confirm('Bạn có chắc chắn muốn xóa bản ghi này?')) {
        return;
    }

    const page = pages[currentPage];
    const item = currentData[index];

    try {
        let endpoint = page.api;
        
        if (page.compositeKey) {
            const keys = page.compositeKey.map(k => item[k]).join('/');
            endpoint += `/${keys}`;
        } else {
            // Use id for phieunhap, otherwise use ma field
            if (currentPage === 'phieunhap') {
                endpoint += `/${item.id}`;
            } else {
                const keyField = page.fields.find(f => f.name.includes('ma') && f.required);
                endpoint += `/${item[keyField ? keyField.name : 'id']}`;
            }
        }

        const result = await apiDelete(endpoint);

        if (result.success) {
            showAlert(result.message, 'success');
            await loadData();
        } else {
            showAlert(result.message || 'Lỗi khi xóa dữ liệu', 'error');
        }
    } catch (error) {
        showAlert('Lỗi: ' + error.message, 'error');
    }
}

// Show alert as toast popup
function showAlert(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Set icon based on type
    let icon = 'ℹ️';
    let title = 'Thông báo';
    if (type === 'success') {
        icon = '✅';
        title = 'Thành công';
    } else if (type === 'error') {
        icon = '❌';
        title = 'Lỗi';
    } else if (type === 'info') {
        icon = 'ℹ️';
        title = 'Thông tin';
    }

    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    // Add to container
    container.appendChild(toast);

    // Auto remove after 3 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = 'fadeOut 0.3s ease-in forwards';
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 300);
        }
    }, 3000);

    // Click to close
    toast.addEventListener('click', function(e) {
        if (e.target !== toast.querySelector('.toast-close')) {
            toast.style.animation = 'fadeOut 0.3s ease-in forwards';
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 300);
        }
    });
}

// Close modal
function closeModal() {
    document.getElementById('modal').classList.remove('active');
    editingId = null;
}

// Close modal when clicking outside
function initModalClose() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
    }
}

// Export PDF
async function exportPDF(maHD) {
    try {
        const blob = await apiExportPDF(maHD);
        if (blob.success === false) {
            showAlert(blob.message || 'Lỗi khi xuất PDF', 'error');
            return;
        }
        
        // Create blob and download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `HoaDon_${maHD}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showAlert('Xuất PDF thành công!', 'success');
    } catch (error) {
        showAlert('Lỗi: ' + error.message, 'error');
    }
}

// Export Excel
async function exportExcel(maHD) {
    try {
        const blob = await apiExportExcel(maHD);
        if (blob.success === false) {
            showAlert(blob.message || 'Lỗi khi xuất Excel', 'error');
            return;
        }
        
        // Create blob and download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `HoaDon_${maHD}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showAlert('Xuất Excel thành công!', 'success');
    } catch (error) {
        showAlert('Lỗi: ' + error.message, 'error');
    }
}

// View phieunhap detail
async function viewPhieuNhapDetail(id, maPN) {
    try {
        const [phieuNhapRes, chiTietRes] = await Promise.all([
            apiGet(`phieunhap/${id}`),
            apiGet(`chitietphieunhap/${id}`)
        ]);
        
        if (!phieuNhapRes.success || !chiTietRes.success) {
            showAlert('Không thể tải chi tiết phiếu nhập', 'error');
            return;
        }
        
        const phieuNhap = phieuNhapRes.data;
        const chiTiet = chiTietRes.data;
        
        const modal = document.getElementById('modal');
        document.getElementById('modal-title').textContent = `Chi Tiết Phiếu Nhập: ${maPN}`;
        
        let html = `
            <div style="padding: 20px;">
                <div style="background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h4 style="margin: 0; color: #e65100;">📥 Phiếu Nhập: ${maPN}</h4>
                    <p style="margin: 5px 0 0 0; color: #666;">
                        Ngày nhập: ${new Date(phieuNhap.ngayNhap).toLocaleString('vi-VN')}<br>
                        Nhân viên: ${phieuNhap.tenNhanVien || phieuNhap.maNV || 'N/A'}
                    </p>
                </div>
                <div style="margin-bottom: 20px;">
                    <h4 style="color: #1a2b48; margin-bottom: 10px;">Danh Sách Hàng Hóa</h4>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f5f5f5;">
                                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">STT</th>
                                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Mã Hàng</th>
                                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Tên Hàng</th>
                                <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Số Lượng</th>
                                <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Đơn Giá</th>
                                <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Thành Tiền</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        chiTiet.forEach((item, index) => {
            html += `
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;">${index + 1}</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${item.maHang || 'N/A'}</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${item.tenHang || 'N/A'}</td>
                    <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${item.soluong || 0}</td>
                    <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${parseFloat(item.dongia || 0).toLocaleString('vi-VN')} đ</td>
                    <td style="padding: 10px; text-align: right; border: 1px solid #ddd; font-weight: bold;">${parseFloat(item.thanhTien || 0).toLocaleString('vi-VN')} đ</td>
                </tr>
            `;
        });
        
        html += `
                        </tbody>
                    </table>
                </div>
                <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; border-left: 4px solid #ff9800; text-align: right;">
                    <div style="font-size: 18px; font-weight: bold; color: #e65100;">
                        Tổng Tiền: ${parseFloat(phieuNhap.tongTien || 0).toLocaleString('vi-VN')} đ
                    </div>
                </div>
                <div style="margin-top: 20px; text-align: right;">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Đóng</button>
                </div>
            </div>
        `;
        
        document.getElementById('modal-body').innerHTML = html;
        modal.classList.add('active');
    } catch (error) {
        showAlert('Lỗi: ' + error.message, 'error');
    }
}

// Initialize page on load
window.addEventListener('DOMContentLoaded', function() {
    initModalClose();
    loadPage();
});

