// Logic chính (load page, CRUD, UI)
let currentPage = 'phongban';
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
            if (field === 'tongtien' || field === 'tiengiamgia') {
                value = value ? parseFloat(value).toLocaleString('vi-VN') + ' đ' : '0 đ';
            }
            if (field === 'phantramgiam') {
                value = value + '%';
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
function renderForm(data = null) {
    const page = pages[currentPage];
    const modalBody = document.getElementById('modal-body');

    let html = '<form id="data-form" onsubmit="saveData(event)">';
    page.fields.forEach(field => {
        let value = data ? (data[field.name] ?? '') : '';
        
        // Format date for input
        if (field.type === 'date' && value && value.includes('T')) {
            value = value.split('T')[0];
        } else if (field.type === 'date' && value && !value.includes('T')) {
            // Already formatted
        } else if (field.type === 'number' && value !== '') {
            value = parseFloat(value);
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
            html += `<select name="${field.name}" ${field.required ? 'required' : ''}>`;
            field.options.forEach(opt => {
                html += `<option value="${opt.value}" ${value == opt.value ? 'selected' : ''}>${opt.label}</option>`;
            });
            html += '</select>';
        } else {
            const inputType = field.type === 'number' ? 'number' :
                field.type === 'date' ? 'date' :
                    field.type === 'email' ? 'email' : 'text';
            const readonly = (field.name.includes('ma') && data && !field.name.includes('codeMGG')) ? 'readonly' : '';
            html += `<input type="${inputType}" name="${field.name}" value="${value}" ${field.required ? 'required' : ''} ${readonly} step="${field.type === 'number' ? 'any' : ''}" placeholder="${field.name === 'codeMGG' ? 'Nhập mã giảm giá (ví dụ: SALE10)' : ''}">`;
        }
        html += '</div>';
    });
    html += `<div class="form-actions">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Hủy</button>
        <button type="submit" class="btn btn-success">💾 Lưu</button>
    </div></form>`;

    modalBody.innerHTML = html;
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
                data[key] = value === '1';
            } else if (key.includes('ngay') || key.includes('date')) {
                data[key] = value;
            } else if (!isNaN(value) && value !== '') {
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
                const keyField = page.fields.find(f => f.name.includes('ma') && f.required);
                endpoint += `/${item[keyField.name]}`;
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
            const keyField = page.fields.find(f => f.name.includes('ma') && f.required);
            endpoint += `/${item[keyField.name]}`;
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

// Initialize page on load
window.addEventListener('DOMContentLoaded', function() {
    initModalClose();
    loadPage();
});

