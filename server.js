const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { poolPromise, sql } = require('./db.config');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// CHO PHÉP TẤT CẢ DOMAIN (dùng cho dev)
app.use(cors());
app.use(express.json());

// ================== HELPER FUNCTIONS ==================
// Tự động sinh mã khách hàng
async function generateMaKH() {
    const pool = await poolPromise;
    const result = await pool.request()
        .query(`SELECT TOP 1 maKH FROM KHACHHANG ORDER BY maKH DESC`);
    
    if (result.recordset.length === 0) {
        return 'KH001';
    }
    
    const lastMaKH = result.recordset[0].maKH;
    const num = parseInt(lastMaKH.replace('KH', '')) || 0;
    return 'KH' + String(num + 1).padStart(3, '0');
}

// Tự động sinh mã nhân viên
async function generateMaNV() {
    const pool = await poolPromise;
    const result = await pool.request()
        .query(`SELECT TOP 1 maNV FROM NHANVIEN ORDER BY maNV DESC`);
    
    if (result.recordset.length === 0) {
        return 'NV001';
    }
    
    const lastMaNV = result.recordset[0].maNV;
    const num = parseInt(lastMaNV.replace('NV', '')) || 0;
    return 'NV' + String(num + 1).padStart(3, '0');
}

// Tự động sinh mã hóa đơn
async function generateMaHD() {
    const pool = await poolPromise;
    const result = await pool.request()
        .query(`SELECT TOP 1 maHD FROM HOADON ORDER BY maHD DESC`);
    
    if (result.recordset.length === 0) {
        return 'HD' + new Date().getFullYear().toString().slice(-2) + '001';
    }
    
    const lastMaHD = result.recordset[0].maHD;
    const year = new Date().getFullYear().toString().slice(-2);
    const prefix = 'HD' + year;
    
    if (lastMaHD.startsWith(prefix)) {
        const num = parseInt(lastMaHD.replace(prefix, '')) || 0;
        return prefix + String(num + 1).padStart(3, '0');
    }
    
    return prefix + '001';
}

// Tự động sinh mã phiếu nhập
async function generateMaPN() {
    const pool = await poolPromise;
    const result = await pool.request()
        .query(`SELECT TOP 1 maPN FROM PHIEUNHAP ORDER BY maPN DESC`);
    
    if (result.recordset.length === 0) {
        return 'PN' + new Date().getFullYear().toString().slice(-2) + '001';
    }
    
    const lastMaPN = result.recordset[0].maPN;
    const year = new Date().getFullYear().toString().slice(-2);
    const prefix = 'PN' + year;
    
    if (lastMaPN.startsWith(prefix)) {
        const num = parseInt(lastMaPN.replace(prefix, '')) || 0;
        return prefix + String(num + 1).padStart(3, '0');
    }
    
    return prefix + '001';
}

// Lấy mã phân loại khách hàng mặc định (thành viên)
async function getDefaultCustomerType() {
    const pool = await poolPromise;
    const result = await pool.request()
        .query(`SELECT TOP 1 maPLKH FROM PHANLOAI_KH WHERE tenPLKH LIKE N'%thành viên%' OR tenPLKH LIKE N'%Thanh vien%' ORDER BY maPLKH`);
    
    if (result.recordset.length > 0) {
        return result.recordset[0].maPLKH;
    }
    
    // Nếu không có, lấy loại đầu tiên
    const firstResult = await pool.request()
        .query(`SELECT TOP 1 maPLKH FROM PHANLOAI_KH ORDER BY maPLKH`);
    
    return firstResult.recordset.length > 0 ? firstResult.recordset[0].maPLKH : null;
}
// ================== LOGIN APIs ==================
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username và password bắt buộc" });
    }

    try {
        const pool = await poolPromise;

        // Mã hóa password client gửi lên bằng SHA2_256 giống trong SQL
        const passwordHash = crypto.createHash('sha256').update(password).digest('hex').toUpperCase();

        // Lấy user từ DB
        const userResult = await pool.request()
            .input('username', sql.NVarChar, username)
            .query(`SELECT userId, username, passwordHash, role, maNV, trangthai 
                    FROM USERS 
                    WHERE username = @username`);

        if (userResult.recordset.length === 0) {
            return res.status(401).json({ message: 'Username hoặc password sai' });
        }

        const user = userResult.recordset[0];
        const storedHash = user.passwordHash;

        // So sánh hash (case-insensitive vì SQL Server có thể lưu khác nhau)
        // CONVERT(..., 2) trong SQL Server tạo hex string, có thể uppercase hoặc lowercase
        const hashMatch = storedHash && (
            storedHash.toUpperCase() === passwordHash.toUpperCase() ||
            storedHash.toLowerCase() === passwordHash.toLowerCase()
        );

        if (!hashMatch) {
            // Debug log
            console.log('Password hash mismatch:', {
                username,
                storedHash: storedHash,
                computedHash: passwordHash,
                storedLength: storedHash ? storedHash.length : 0,
                computedLength: passwordHash.length
            });
            return res.status(401).json({ message: 'Username hoặc password sai' });
        }

        if (user.trangthai === 0) {
            return res.status(403).json({ message: 'Tài khoản đã bị khóa' });
        }

        // Trả về thông tin user và role để frontend điều hướng
        res.json({
            success: true,
            user: {
                userId: user.userId,
                username: user.username,
                role: user.role,
                maNV: user.maNV
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// ================== PHONGBAN APIs ==================
// GET all
app.get('/api/phongban', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query('SELECT maPB, tenPB FROM PHONGBAN ORDER BY tenPB');

        res.status(200).json({
            success: true,
            count: result.recordset.length,
            data: result.recordset
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy dữ liệu phòng ban',
            error: err.message
        });
    }
});

// GET by ID
app.get('/api/phongban/:maPB', async (req, res) => {
    const { maPB } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('maPB', sql.NVarChar(10), maPB)
            .query('SELECT maPB, tenPB FROM PHONGBAN WHERE maPB = @maPB');

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phòng ban'
            });
        }

        res.status(200).json({
            success: true,
            data: result.recordset[0]
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: err.message
        });
    }
});

// POST
app.post('/api/phongban', async (req, res) => {
    const { maPB, tenPB } = req.body;
    if (!maPB || !tenPB) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin maPB hoặc tenPB'
        });
    }
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('maPB', sql.NVarChar(10), maPB)
            .input('tenPB', sql.NVarChar(40), tenPB)
            .query('INSERT INTO PHONGBAN (maPB, tenPB) VALUES (@maPB, @tenPB)');

        res.status(201).json({
            success: true,
            message: 'Thêm phòng ban thành công',
            data: { maPB, tenPB }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm phòng ban',
            error: err.message
        });
    }
});

// PUT
app.put('/api/phongban/:maPB', async (req, res) => {
    const { maPB } = req.params;
    const { tenPB } = req.body;
    if (!tenPB) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin tenPB'
        });
    }
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('maPB', sql.NVarChar(10), maPB)
            .input('tenPB', sql.NVarChar(40), tenPB)
            .query('UPDATE PHONGBAN SET tenPB = @tenPB WHERE maPB = @maPB');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phòng ban'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật phòng ban thành công',
            data: { maPB, tenPB }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật phòng ban',
            error: err.message
        });
    }
});

// DELETE
app.delete('/api/phongban/:maPB', async (req, res) => {
    const { maPB } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('maPB', sql.NVarChar(10), maPB)
            .query('DELETE FROM PHONGBAN WHERE maPB = @maPB');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phòng ban'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Xóa phòng ban thành công'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa phòng ban',
            error: err.message
        });
    }
});

// ================== VITRI APIs ==================
// GET all
app.get('/api/vitri', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query('SELECT maVT, tenVT FROM VITRI ORDER BY tenVT');

        res.status(200).json({
            success: true,
            count: result.recordset.length,
            data: result.recordset
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy dữ liệu vị trí',
            error: err.message
        });
    }
});

// GET by ID
app.get('/api/vitri/:maVT', async (req, res) => {
    const { maVT } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('maVT', sql.NVarChar(10), maVT)
            .query('SELECT maVT, tenVT FROM VITRI WHERE maVT = @maVT');

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy vị trí'
            });
        }

        res.status(200).json({
            success: true,
            data: result.recordset[0]
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: err.message
        });
    }
});

// POST
app.post('/api/vitri', async (req, res) => {
    const { maVT, tenVT } = req.body;
    if (!maVT || !tenVT) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin maVT hoặc tenVT'
        });
    }
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('maVT', sql.NVarChar(10), maVT)
            .input('tenVT', sql.NVarChar(40), tenVT)
            .query('INSERT INTO VITRI (maVT, tenVT) VALUES (@maVT, @tenVT)');

        res.status(201).json({
            success: true,
            message: 'Thêm vị trí thành công',
            data: { maVT, tenVT }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm vị trí',
            error: err.message
        });
    }
});

// PUT
app.put('/api/vitri/:maVT', async (req, res) => {
    const { maVT } = req.params;
    const { tenVT } = req.body;
    if (!tenVT) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin tenVT'
        });
    }
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('maVT', sql.NVarChar(10), maVT)
            .input('tenVT', sql.NVarChar(40), tenVT)
            .query('UPDATE VITRI SET tenVT = @tenVT WHERE maVT = @maVT');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy vị trí'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật vị trí thành công',
            data: { maVT, tenVT }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật vị trí',
            error: err.message
        });
    }
});

// DELETE
app.delete('/api/vitri/:maVT', async (req, res) => {
    const { maVT } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('maVT', sql.NVarChar(10), maVT)
            .query('DELETE FROM VITRI WHERE maVT = @maVT');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy vị trí'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Xóa vị trí thành công'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa vị trí',
            error: err.message
        });
    }
});

// ================== NHACUNGCAP APIs ==================
// GET all
app.get('/api/nhacungcap', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query('SELECT maNCC, tenNCC, diachi, sdt, email FROM NHACUNGCAP ORDER BY tenNCC');

        res.status(200).json({
            success: true,
            count: result.recordset.length,
            data: result.recordset
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy dữ liệu nhà cung cấp',
            error: err.message
        });
    }
});

// GET by ID
app.get('/api/nhacungcap/:maNCC', async (req, res) => {
    const { maNCC } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('maNCC', sql.NVarChar(10), maNCC)
            .query('SELECT maNCC, tenNCC, diachi, sdt, email FROM NHACUNGCAP WHERE maNCC = @maNCC');

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhà cung cấp'
            });
        }

        res.status(200).json({
            success: true,
            data: result.recordset[0]
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: err.message
        });
    }
});

// POST
app.post('/api/nhacungcap', async (req, res) => {
    const { maNCC, tenNCC, diachi, sdt, email } = req.body;
    if (!maNCC || !tenNCC) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin maNCC hoặc tenNCC'
        });
    }
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('maNCC', sql.NVarChar(10), maNCC)
            .input('tenNCC', sql.NVarChar(50), tenNCC)
            .input('diachi', sql.NVarChar(50), diachi || null)
            .input('sdt', sql.VarChar(10), sdt || null)
            .input('email', sql.VarChar(50), email || null)
            .query('INSERT INTO NHACUNGCAP (maNCC, tenNCC, diachi, sdt, email) VALUES (@maNCC, @tenNCC, @diachi, @sdt, @email)');

        res.status(201).json({
            success: true,
            message: 'Thêm nhà cung cấp thành công',
            data: { maNCC, tenNCC, diachi, sdt, email }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm nhà cung cấp',
            error: err.message
        });
    }
});

// PUT
app.put('/api/nhacungcap/:maNCC', async (req, res) => {
    const { maNCC } = req.params;
    const { tenNCC, diachi, sdt, email } = req.body;
    if (!tenNCC) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin tenNCC'
        });
    }
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('maNCC', sql.NVarChar(10), maNCC)
            .input('tenNCC', sql.NVarChar(50), tenNCC)
            .input('diachi', sql.NVarChar(50), diachi || null)
            .input('sdt', sql.VarChar(10), sdt || null)
            .input('email', sql.VarChar(50), email || null)
            .query('UPDATE NHACUNGCAP SET tenNCC = @tenNCC, diachi = @diachi, sdt = @sdt, email = @email WHERE maNCC = @maNCC');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhà cung cấp'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật nhà cung cấp thành công',
            data: { maNCC, tenNCC, diachi, sdt, email }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật nhà cung cấp',
            error: err.message
        });
    }
});

// DELETE
app.delete('/api/nhacungcap/:maNCC', async (req, res) => {
    const { maNCC } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('maNCC', sql.NVarChar(10), maNCC)
            .query('DELETE FROM NHACUNGCAP WHERE maNCC = @maNCC');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhà cung cấp'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Xóa nhà cung cấp thành công'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa nhà cung cấp',
            error: err.message
        });
    }
});

// ================== PHANLOAI_KH APIs ==================
// GET all
app.get('/api/phanloaikh', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query('SELECT maPLKH, tenPLKH, tongchi, diemtichluy FROM PHANLOAI_KH ORDER BY tenPLKH');

        res.status(200).json({
            success: true,
            count: result.recordset.length,
            data: result.recordset
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy dữ liệu phân loại khách hàng',
            error: err.message
        });
    }
});

// GET by ID
app.get('/api/phanloaikh/:maPLKH', async (req, res) => {
    const { maPLKH } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('maPLKH', sql.NVarChar(10), maPLKH)
            .query('SELECT maPLKH, tenPLKH, tongchi, diemtichluy FROM PHANLOAI_KH WHERE maPLKH = @maPLKH');

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phân loại khách hàng'
            });
        }

        res.status(200).json({
            success: true,
            data: result.recordset[0]
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: err.message
        });
    }
});

// POST
app.post('/api/phanloaikh', async (req, res) => {
    const { maPLKH, tenPLKH, tongchi, diemtichluy } = req.body;
    if (!maPLKH || !tenPLKH) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin maPLKH hoặc tenPLKH'
        });
    }
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('maPLKH', sql.NVarChar(10), maPLKH)
            .input('tenPLKH', sql.NVarChar(40), tenPLKH)
            .input('tongchi', sql.Money, tongchi || null)
            .input('diemtichluy', sql.Int, diemtichluy || null)
            .query('INSERT INTO PHANLOAI_KH (maPLKH, tenPLKH, tongchi, diemtichluy) VALUES (@maPLKH, @tenPLKH, @tongchi, @diemtichluy)');

        res.status(201).json({
            success: true,
            message: 'Thêm phân loại khách hàng thành công',
            data: { maPLKH, tenPLKH, tongchi, diemtichluy }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm phân loại khách hàng',
            error: err.message
        });
    }
});

// PUT
app.put('/api/phanloaikh/:maPLKH', async (req, res) => {
    const { maPLKH } = req.params;
    const { tenPLKH, tongchi, diemtichluy } = req.body;
    if (!tenPLKH) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin tenPLKH'
        });
    }
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('maPLKH', sql.NVarChar(10), maPLKH)
            .input('tenPLKH', sql.NVarChar(40), tenPLKH)
            .input('tongchi', sql.Money, tongchi || null)
            .input('diemtichluy', sql.Int, diemtichluy || null)
            .query('UPDATE PHANLOAI_KH SET tenPLKH = @tenPLKH, tongchi = @tongchi, diemtichluy = @diemtichluy WHERE maPLKH = @maPLKH');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phân loại khách hàng'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật phân loại khách hàng thành công',
            data: { maPLKH, tenPLKH, tongchi, diemtichluy }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật phân loại khách hàng',
            error: err.message
        });
    }
});

// DELETE
app.delete('/api/phanloaikh/:maPLKH', async (req, res) => {
    const { maPLKH } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('maPLKH', sql.NVarChar(10), maPLKH)
            .query('DELETE FROM PHANLOAI_KH WHERE maPLKH = @maPLKH');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phân loại khách hàng'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Xóa phân loại khách hàng thành công'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa phân loại khách hàng',
            error: err.message
        });
    }
});

// ================== KHACHHANG APIs ==================
// GET all
app.get('/api/khachhang', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query('SELECT maKH, tenKH, maPLKH, diachi, sdt, diemtichluy FROM KHACHHANG ORDER BY tenKH');

        res.status(200).json({
            success: true,
            count: result.recordset.length,
            data: result.recordset
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy dữ liệu khách hàng',
            error: err.message
        });
    }
});

// GET by ID
app.get('/api/khachhang/:maKH', async (req, res) => {
    const { maKH } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('maKH', sql.NVarChar(10), maKH)
            .query('SELECT maKH, tenKH, maPLKH, diachi, sdt, diemtichluy FROM KHACHHANG WHERE maKH = @maKH');

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khách hàng'
            });
        }

        res.status(200).json({
            success: true,
            data: result.recordset[0]
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: err.message
        });
    }
});

// POST - Tự động sinh mã KH, mặc định thành viên
app.post('/api/khachhang', async (req, res) => {
    const { tenKH, maPLKH, diachi, sdt } = req.body;
    if (!tenKH) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin tenKH'
        });
    }
    try {
        const pool = await poolPromise;
        
        // Tự động sinh mã KH
        const maKH = await generateMaKH();
        
        // Mặc định là thành viên nếu không có maPLKH
        let finalMaPLKH = maPLKH;
        if (!finalMaPLKH) {
            finalMaPLKH = await getDefaultCustomerType();
            if (!finalMaPLKH) {
                return res.status(400).json({
                    success: false,
                    message: 'Không tìm thấy phân loại khách hàng mặc định'
                });
            }
        }
        
        await pool.request()
            .input('maKH', sql.NVarChar(10), maKH)
            .input('tenKH', sql.NVarChar(40), tenKH)
            .input('maPLKH', sql.NVarChar(10), finalMaPLKH)
            .input('diachi', sql.NVarChar(50), diachi || null)
            .input('sdt', sql.VarChar(10), sdt || null)
            .input('diemtichluy', sql.Int, 0) // Mặc định 0 điểm
            .query('INSERT INTO KHACHHANG (maKH, tenKH, maPLKH, diachi, sdt, diemtichluy) VALUES (@maKH, @tenKH, @maPLKH, @diachi, @sdt, @diemtichluy)');

        res.status(201).json({
            success: true,
            message: 'Thêm khách hàng thành công',
            data: { maKH, tenKH, maPLKH: finalMaPLKH, diachi, sdt }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm khách hàng',
            error: err.message
        });
    }
});

// PUT
app.put('/api/khachhang/:maKH', async (req, res) => {
    const { maKH } = req.params;
    const { tenKH, maPLKH, diachi, sdt, diemtichluy } = req.body;
    if (!tenKH || !maPLKH) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin tenKH hoặc maPLKH'
        });
    }
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('maKH', sql.NVarChar(10), maKH)
            .input('tenKH', sql.NVarChar(40), tenKH)
            .input('maPLKH', sql.NVarChar(10), maPLKH)
            .input('diachi', sql.NVarChar(50), diachi || null)
            .input('sdt', sql.VarChar(10), sdt || null)
            .input('diemtichluy', sql.Int, diemtichluy !== undefined ? diemtichluy : null)
            .query('UPDATE KHACHHANG SET tenKH = @tenKH, maPLKH = @maPLKH, diachi = @diachi, sdt = @sdt, diemtichluy = COALESCE(@diemtichluy, diemtichluy) WHERE maKH = @maKH');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khách hàng'
            });
        }

        // Lấy lại thông tin khách hàng sau khi cập nhật
        const updatedResult = await pool.request()
            .input('maKH', sql.NVarChar(10), maKH)
            .query('SELECT maKH, tenKH, maPLKH, diachi, sdt, diemtichluy FROM KHACHHANG WHERE maKH = @maKH');

        res.status(200).json({
            success: true,
            message: 'Cập nhật khách hàng thành công',
            data: updatedResult.recordset[0]
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật khách hàng',
            error: err.message
        });
    }
});

// DELETE
app.delete('/api/khachhang/:maKH', async (req, res) => {
    const { maKH } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('maKH', sql.NVarChar(10), maKH)
            .query('DELETE FROM KHACHHANG WHERE maKH = @maKH');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khách hàng'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Xóa khách hàng thành công'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa khách hàng',
            error: err.message
        });
    }
});

// ================== NHANVIEN APIs ==================
// GET all
app.get('/api/nhanvien', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query('SELECT maNV, tenNV, diachi, sdt, gioitinh, luong, namsinh, ngaylamviec, maPB, maVT FROM NHANVIEN ORDER BY tenNV');

        res.status(200).json({
            success: true,
            count: result.recordset.length,
            data: result.recordset
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy dữ liệu nhân viên',
            error: err.message
        });
    }
});

// GET by ID
app.get('/api/nhanvien/:maNV', async (req, res) => {
    const { maNV } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('maNV', sql.NVarChar(10), maNV)
            .query('SELECT maNV, tenNV, diachi, sdt, gioitinh, luong, namsinh, ngaylamviec, maPB, maVT FROM NHANVIEN WHERE maNV = @maNV');

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhân viên'
            });
        }

        res.status(200).json({
            success: true,
            data: result.recordset[0]
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: err.message
        });
    }
});

// POST - Tự động sinh mã NV, chỉ cần maVT (bỏ maPB)
app.post('/api/nhanvien', async (req, res) => {
    const { tenNV, diachi, sdt, gioitinh, luong, namsinh, ngaylamviec, maVT } = req.body;
    if (!tenNV || !maVT) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin bắt buộc: tenNV, maVT'
        });
    }
    
    // Chuẩn hóa giới tính: chỉ Nam hoặc Nữ
    let normalizedGioitinh = null;
    if (gioitinh !== undefined && gioitinh !== null) {
        if (typeof gioitinh === 'string') {
            normalizedGioitinh = (gioitinh.toLowerCase() === 'nam' || gioitinh === '1' || gioitinh === 'true') ? 1 : 0;
        } else {
            normalizedGioitinh = gioitinh ? 1 : 0;
        }
    }
    try {
        const pool = await poolPromise;
        
        // Tự động sinh mã NV
        const maNV = await generateMaNV();
        
        await pool.request()
            .input('maNV', sql.NVarChar(10), maNV)
            .input('tenNV', sql.NVarChar(40), tenNV)
            .input('diachi', sql.NVarChar(50), diachi || null)
            .input('sdt', sql.VarChar(10), sdt || null)
            .input('gioitinh', sql.Bit, normalizedGioitinh)
            .input('luong', sql.Decimal(18, 2), luong || null)
            .input('namsinh', sql.Int, namsinh || null)
            .input('ngaylamviec', sql.Date, ngaylamviec || null)
            .input('maPB', sql.NVarChar(10), null) // Bỏ phòng ban
            .input('maVT', sql.NVarChar(10), maVT)
            .query('INSERT INTO NHANVIEN (maNV, tenNV, diachi, sdt, gioitinh, luong, namsinh, ngaylamviec, maPB, maVT) VALUES (@maNV, @tenNV, @diachi, @sdt, @gioitinh, @luong, @namsinh, @ngaylamviec, @maPB, @maVT)');

        res.status(201).json({
            success: true,
            message: 'Thêm nhân viên thành công',
            data: { maNV, tenNV, diachi, sdt, gioitinh: normalizedGioitinh, luong, namsinh, ngaylamviec, maVT }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm nhân viên',
            error: err.message
        });
    }
});

// PUT - Bỏ maPB, chỉ cần maVT
app.put('/api/nhanvien/:maNV', async (req, res) => {
    const { maNV } = req.params;
    const { tenNV, diachi, sdt, gioitinh, luong, namsinh, ngaylamviec, maVT } = req.body;
    if (!tenNV || !maVT) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin bắt buộc: tenNV, maVT'
        });
    }
    
    // Chuẩn hóa giới tính
    let normalizedGioitinh = null;
    if (gioitinh !== undefined && gioitinh !== null) {
        if (typeof gioitinh === 'string') {
            normalizedGioitinh = (gioitinh.toLowerCase() === 'nam' || gioitinh === '1' || gioitinh === 'true') ? 1 : 0;
        } else {
            normalizedGioitinh = gioitinh ? 1 : 0;
        }
    }
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('maNV', sql.NVarChar(10), maNV)
            .input('tenNV', sql.NVarChar(40), tenNV)
            .input('diachi', sql.NVarChar(50), diachi || null)
            .input('sdt', sql.VarChar(10), sdt || null)
            .input('gioitinh', sql.Bit, normalizedGioitinh)
            .input('luong', sql.Decimal(18, 2), luong || null)
            .input('namsinh', sql.Int, namsinh || null)
            .input('ngaylamviec', sql.Date, ngaylamviec || null)
            .input('maPB', sql.NVarChar(10), null) // Bỏ phòng ban
            .input('maVT', sql.NVarChar(10), maVT)
            .query('UPDATE NHANVIEN SET tenNV = @tenNV, diachi = @diachi, sdt = @sdt, gioitinh = @gioitinh, luong = @luong, namsinh = @namsinh, ngaylamviec = @ngaylamviec, maPB = @maPB, maVT = @maVT WHERE maNV = @maNV');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhân viên'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật nhân viên thành công',
            data: { maNV, tenNV, diachi, sdt, gioitinh: normalizedGioitinh, luong, namsinh, ngaylamviec, maVT }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật nhân viên',
            error: err.message
        });
    }
});

// DELETE
app.delete('/api/nhanvien/:maNV', async (req, res) => {
    const { maNV } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('maNV', sql.NVarChar(10), maNV)
            .query('DELETE FROM NHANVIEN WHERE maNV = @maNV');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhân viên'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Xóa nhân viên thành công'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa nhân viên',
            error: err.message
        });
    }
});

// ================== LICHSUTHEODOINV APIs ==================
// GET all
app.get('/api/lichsutheodoinv', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query('SELECT maLS, thang, nam FROM LICHSUTHEODOINV ORDER BY nam DESC, thang DESC');

        res.status(200).json({
            success: true,
            count: result.recordset.length,
            data: result.recordset
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy dữ liệu lịch sử theo dõi nhân viên',
            error: err.message
        });
    }
});

// GET by ID
app.get('/api/lichsutheodoinv/:maLS', async (req, res) => {
    const { maLS } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('maLS', sql.NVarChar(10), maLS)
            .query('SELECT maLS, thang, nam FROM LICHSUTHEODOINV WHERE maLS = @maLS');

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lịch sử theo dõi'
            });
        }

        res.status(200).json({
            success: true,
            data: result.recordset[0]
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: err.message
        });
    }
});

// POST
app.post('/api/lichsutheodoinv', async (req, res) => {
    const { maLS, thang, nam } = req.body;
    if (!maLS) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin maLS'
        });
    }
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('maLS', sql.NVarChar(10), maLS)
            .input('thang', sql.TinyInt, thang || null)
            .input('nam', sql.SmallInt, nam || null)
            .query('INSERT INTO LICHSUTHEODOINV (maLS, thang, nam) VALUES (@maLS, @thang, @nam)');

        res.status(201).json({
            success: true,
            message: 'Thêm lịch sử theo dõi thành công',
            data: { maLS, thang, nam }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm lịch sử theo dõi',
            error: err.message
        });
    }
});

// PUT
app.put('/api/lichsutheodoinv/:maLS', async (req, res) => {
    const { maLS } = req.params;
    const { thang, nam } = req.body;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('maLS', sql.NVarChar(10), maLS)
            .input('thang', sql.TinyInt, thang || null)
            .input('nam', sql.SmallInt, nam || null)
            .query('UPDATE LICHSUTHEODOINV SET thang = @thang, nam = @nam WHERE maLS = @maLS');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lịch sử theo dõi'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật lịch sử theo dõi thành công',
            data: { maLS, thang, nam }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật lịch sử theo dõi',
            error: err.message
        });
    }
});

// DELETE
app.delete('/api/lichsutheodoinv/:maLS', async (req, res) => {
    const { maLS } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('maLS', sql.NVarChar(10), maLS)
            .query('DELETE FROM LICHSUTHEODOINV WHERE maLS = @maLS');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lịch sử theo dõi'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Xóa lịch sử theo dõi thành công'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa lịch sử theo dõi',
            error: err.message
        });
    }
});

// ================== PHIEUTHEODOINV APIs ==================
// GET all
app.get('/api/phieutheodoinv', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query('SELECT maLS, maNV, ngaylam, ngaynghi, tongngaylam, tongngaynghi, ngaytangca FROM PHIEUTHEODOINV');

        res.status(200).json({
            success: true,
            count: result.recordset.length,
            data: result.recordset
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy dữ liệu phiếu theo dõi nhân viên',
            error: err.message
        });
    }
});

// GET by ID (composite key)
app.get('/api/phieutheodoinv/:maLS/:maNV', async (req, res) => {
    const { maLS, maNV } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('maLS', sql.NVarChar(10), maLS)
            .input('maNV', sql.NVarChar(10), maNV)
            .query('SELECT maLS, maNV, ngaylam, ngaynghi, tongngaylam, tongngaynghi, ngaytangca FROM PHIEUTHEODOINV WHERE maLS = @maLS AND maNV = @maNV');

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phiếu theo dõi'
            });
        }

        res.status(200).json({
            success: true,
            data: result.recordset[0]
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: err.message
        });
    }
});

// POST
app.post('/api/phieutheodoinv', async (req, res) => {
    const { maLS, maNV, ngaylam, ngaynghi, tongngaylam, tongngaynghi, ngaytangca } = req.body;
    if (!maLS || !maNV) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin maLS hoặc maNV'
        });
    }
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('maLS', sql.NVarChar(10), maLS)
            .input('maNV', sql.NVarChar(10), maNV)
            .input('ngaylam', sql.Date, ngaylam || null)
            .input('ngaynghi', sql.Date, ngaynghi || null)
            .input('tongngaylam', sql.Int, tongngaylam || null)
            .input('tongngaynghi', sql.Int, tongngaynghi || null)
            .input('ngaytangca', sql.Date, ngaytangca || null)
            .query('INSERT INTO PHIEUTHEODOINV (maLS, maNV, ngaylam, ngaynghi, tongngaylam, tongngaynghi, ngaytangca) VALUES (@maLS, @maNV, @ngaylam, @ngaynghi, @tongngaylam, @tongngaynghi, @ngaytangca)');

        res.status(201).json({
            success: true,
            message: 'Thêm phiếu theo dõi thành công',
            data: { maLS, maNV, ngaylam, ngaynghi, tongngaylam, tongngaynghi, ngaytangca }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm phiếu theo dõi',
            error: err.message
        });
    }
});

// PUT
app.put('/api/phieutheodoinv/:maLS/:maNV', async (req, res) => {
    const { maLS, maNV } = req.params;
    const { ngaylam, ngaynghi, tongngaylam, tongngaynghi, ngaytangca } = req.body;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('maLS', sql.NVarChar(10), maLS)
            .input('maNV', sql.NVarChar(10), maNV)
            .input('ngaylam', sql.Date, ngaylam || null)
            .input('ngaynghi', sql.Date, ngaynghi || null)
            .input('tongngaylam', sql.Int, tongngaylam || null)
            .input('tongngaynghi', sql.Int, tongngaynghi || null)
            .input('ngaytangca', sql.Date, ngaytangca || null)
            .query('UPDATE PHIEUTHEODOINV SET ngaylam = @ngaylam, ngaynghi = @ngaynghi, tongngaylam = @tongngaylam, tongngaynghi = @tongngaynghi, ngaytangca = @ngaytangca WHERE maLS = @maLS AND maNV = @maNV');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phiếu theo dõi'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật phiếu theo dõi thành công',
            data: { maLS, maNV, ngaylam, ngaynghi, tongngaylam, tongngaynghi, ngaytangca }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật phiếu theo dõi',
            error: err.message
        });
    }
});

// DELETE
app.delete('/api/phieutheodoinv/:maLS/:maNV', async (req, res) => {
    const { maLS, maNV } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('maLS', sql.NVarChar(10), maLS)
            .input('maNV', sql.NVarChar(10), maNV)
            .query('DELETE FROM PHIEUTHEODOINV WHERE maLS = @maLS AND maNV = @maNV');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phiếu theo dõi'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Xóa phiếu theo dõi thành công'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa phiếu theo dõi',
            error: err.message
        });
    }
});

// ================== HANGHOA APIs ==================
// GET all
app.get('/api/hanghoa', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query('SELECT maHang, loaihang, soluong, ngaynhaphang, donvi, maNCC, gianhapvao, giabanra FROM HANGHOA ORDER BY loaihang');

        res.status(200).json({
            success: true,
            count: result.recordset.length,
            data: result.recordset
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy dữ liệu hàng hóa',
            error: err.message
        });
    }
});

// GET by ID
app.get('/api/hanghoa/:maHang', async (req, res) => {
    const { maHang } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('maHang', sql.NVarChar(10), maHang)
            .query('SELECT maHang, loaihang, soluong, ngaynhaphang, donvi, maNCC, gianhapvao, giabanra FROM HANGHOA WHERE maHang = @maHang');

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hàng hóa'
            });
        }

        res.status(200).json({
            success: true,
            data: result.recordset[0]
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: err.message
        });
    }
});

// POST
app.post('/api/hanghoa', async (req, res) => {
    const { maHang, loaihang, soluong, ngaynhaphang, donvi, maNCC, gianhapvao, giabanra } = req.body;
    if (!maHang || !loaihang || soluong === undefined || !maNCC || gianhapvao === undefined || giabanra === undefined) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin bắt buộc'
        });
    }
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('maHang', sql.NVarChar(10), maHang)
            .input('loaihang', sql.NVarChar(40), loaihang)
            .input('soluong', sql.Int, soluong)
            .input('ngaynhaphang', sql.Date, ngaynhaphang || null)
            .input('donvi', sql.NVarChar(20), donvi || null)
            .input('maNCC', sql.NVarChar(10), maNCC)
            .input('gianhapvao', sql.Decimal(18, 2), gianhapvao)
            .input('giabanra', sql.Decimal(18, 2), giabanra)
            .query('INSERT INTO HANGHOA (maHang, loaihang, soluong, ngaynhaphang, donvi, maNCC, gianhapvao, giabanra) VALUES (@maHang, @loaihang, @soluong, @ngaynhaphang, @donvi, @maNCC, @gianhapvao, @giabanra)');

        res.status(201).json({
            success: true,
            message: 'Thêm hàng hóa thành công',
            data: { maHang, loaihang, soluong, ngaynhaphang, donvi, maNCC, gianhapvao, giabanra }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm hàng hóa',
            error: err.message
        });
    }
});

// PUT
app.put('/api/hanghoa/:maHang', async (req, res) => {
    const { maHang } = req.params;
    const { loaihang, soluong, ngaynhaphang, donvi, maNCC, gianhapvao, giabanra } = req.body;
    if (!loaihang || soluong === undefined || !maNCC || gianhapvao === undefined || giabanra === undefined) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin bắt buộc'
        });
    }
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('maHang', sql.NVarChar(10), maHang)
            .input('loaihang', sql.NVarChar(40), loaihang)
            .input('soluong', sql.Int, soluong)
            .input('ngaynhaphang', sql.Date, ngaynhaphang || null)
            .input('donvi', sql.NVarChar(20), donvi || null)
            .input('maNCC', sql.NVarChar(10), maNCC)
            .input('gianhapvao', sql.Decimal(18, 2), gianhapvao)
            .input('giabanra', sql.Decimal(18, 2), giabanra)
            .query('UPDATE HANGHOA SET loaihang = @loaihang, soluong = @soluong, ngaynhaphang = @ngaynhaphang, donvi = @donvi, maNCC = @maNCC, gianhapvao = @gianhapvao, giabanra = @giabanra WHERE maHang = @maHang');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hàng hóa'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật hàng hóa thành công',
            data: { maHang, loaihang, soluong, ngaynhaphang, donvi, maNCC, gianhapvao, giabanra }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật hàng hóa',
            error: err.message
        });
    }
});

// DELETE
app.delete('/api/hanghoa/:maHang', async (req, res) => {
    const { maHang } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('maHang', sql.NVarChar(10), maHang)
            .query('DELETE FROM HANGHOA WHERE maHang = @maHang');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hàng hóa'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Xóa hàng hóa thành công'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa hàng hóa',
            error: err.message
        });
    }
});

// ================== PHIEUNHAP APIs ==================
// GET all
app.get('/api/phieunhap', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query('SELECT maPN, maNCC, ngaynhap, maNV FROM PHIEUNHAP ORDER BY ngaynhap DESC');

        res.status(200).json({
            success: true,
            count: result.recordset.length,
            data: result.recordset
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy dữ liệu phiếu nhập',
            error: err.message
        });
    }
});

// GET by ID
app.get('/api/phieunhap/:maPN', async (req, res) => {
    const { maPN } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('maPN', sql.NVarChar(10), maPN)
            .query('SELECT maPN, maNCC, ngaynhap, maNV FROM PHIEUNHAP WHERE maPN = @maPN');

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phiếu nhập'
            });
        }

        res.status(200).json({
            success: true,
            data: result.recordset[0]
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: err.message
        });
    }
});

// POST - Tự động sinh mã PN
app.post('/api/phieunhap', async (req, res) => {
    const { maNCC, ngaynhap, maNV } = req.body;
    if (!maNCC || !maNV) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin maNCC hoặc maNV'
        });
    }
    try {
        const pool = await poolPromise;
        
        // Tự động sinh mã PN
        const maPN = await generateMaPN();
        
        await pool.request()
            .input('maPN', sql.NVarChar(10), maPN)
            .input('maNCC', sql.NVarChar(10), maNCC)
            .input('ngaynhap', sql.Date, ngaynhap || null)
            .input('maNV', sql.NVarChar(10), maNV)
            .query('INSERT INTO PHIEUNHAP (maPN, maNCC, ngaynhap, maNV) VALUES (@maPN, @maNCC, @ngaynhap, @maNV)');

        res.status(201).json({
            success: true,
            message: 'Thêm phiếu nhập thành công',
            data: { maPN, maNCC, ngaynhap, maNV }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm phiếu nhập',
            error: err.message
        });
    }
});

// PUT
app.put('/api/phieunhap/:maPN', async (req, res) => {
    const { maPN } = req.params;
    const { maNCC, ngaynhap, maNV } = req.body;
    if (!maNCC || !maNV) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin maNCC hoặc maNV'
        });
    }
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('maPN', sql.NVarChar(10), maPN)
            .input('maNCC', sql.NVarChar(10), maNCC)
            .input('ngaynhap', sql.Date, ngaynhap || null)
            .input('maNV', sql.NVarChar(10), maNV)
            .query('UPDATE PHIEUNHAP SET maNCC = @maNCC, ngaynhap = @ngaynhap, maNV = @maNV WHERE maPN = @maPN');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phiếu nhập'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật phiếu nhập thành công',
            data: { maPN, maNCC, ngaynhap, maNV }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật phiếu nhập',
            error: err.message
        });
    }
});

// DELETE
app.delete('/api/phieunhap/:maPN', async (req, res) => {
    const { maPN } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('maPN', sql.NVarChar(10), maPN)
            .query('DELETE FROM PHIEUNHAP WHERE maPN = @maPN');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phiếu nhập'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Xóa phiếu nhập thành công'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa phiếu nhập',
            error: err.message
        });
    }
});

// ================== CHITIETPHIEUNHAP APIs ==================
// GET all
app.get('/api/chitietphieunhap', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query('SELECT maPN, maHang, soluongnhap FROM CHITIETPHIEUNHAP');

        res.status(200).json({
            success: true,
            count: result.recordset.length,
            data: result.recordset
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy dữ liệu chi tiết phiếu nhập',
            error: err.message
        });
    }
});

// GET by ID (composite key)
app.get('/api/chitietphieunhap/:maPN/:maHang', async (req, res) => {
    const { maPN, maHang } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('maPN', sql.NVarChar(10), maPN)
            .input('maHang', sql.NVarChar(10), maHang)
            .query('SELECT maPN, maHang, soluongnhap FROM CHITIETPHIEUNHAP WHERE maPN = @maPN AND maHang = @maHang');

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy chi tiết phiếu nhập'
            });
        }

        res.status(200).json({
            success: true,
            data: result.recordset[0]
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: err.message
        });
    }
});

// GET by maPN
app.get('/api/chitietphieunhap/:maPN', async (req, res) => {
    const { maPN } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('maPN', sql.NVarChar(10), maPN)
            .query('SELECT maPN, maHang, soluongnhap FROM CHITIETPHIEUNHAP WHERE maPN = @maPN');

        res.status(200).json({
            success: true,
            count: result.recordset.length,
            data: result.recordset
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: err.message
        });
    }
});

// POST - Cộng hàng vào kho khi nhập
app.post('/api/chitietphieunhap', async (req, res) => {
    const { maPN, maHang, soluongnhap } = req.body;
    if (!maPN || !maHang || soluongnhap === undefined) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin maPN, maHang hoặc soluongnhap'
        });
    }
    try {
        const pool = await poolPromise;
        
        // Thêm chi tiết phiếu nhập
        await pool.request()
            .input('maPN', sql.NVarChar(10), maPN)
            .input('maHang', sql.NVarChar(10), maHang)
            .input('soluongnhap', sql.Int, soluongnhap)
            .query('INSERT INTO CHITIETPHIEUNHAP (maPN, maHang, soluongnhap) VALUES (@maPN, @maHang, @soluongnhap)');

        // Cộng hàng vào kho
        await pool.request()
            .input('maHang', sql.NVarChar(10), maHang)
            .input('soluongnhap', sql.Int, soluongnhap)
            .query('UPDATE HANGHOA SET soluong = soluong + @soluongnhap WHERE maHang = @maHang');

        res.status(201).json({
            success: true,
            message: 'Thêm chi tiết phiếu nhập thành công',
            data: { maPN, maHang, soluongnhap }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm chi tiết phiếu nhập',
            error: err.message
        });
    }
});

// PUT
app.put('/api/chitietphieunhap/:maPN/:maHang', async (req, res) => {
    const { maPN, maHang } = req.params;
    const { soluongnhap } = req.body;
    if (soluongnhap === undefined) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin soluongnhap'
        });
    }
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('maPN', sql.NVarChar(10), maPN)
            .input('maHang', sql.NVarChar(10), maHang)
            .input('soluongnhap', sql.Int, soluongnhap)
            .query('UPDATE CHITIETPHIEUNHAP SET soluongnhap = @soluongnhap WHERE maPN = @maPN AND maHang = @maHang');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy chi tiết phiếu nhập'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật chi tiết phiếu nhập thành công',
            data: { maPN, maHang, soluongnhap }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật chi tiết phiếu nhập',
            error: err.message
        });
    }
});

// DELETE
app.delete('/api/chitietphieunhap/:maPN/:maHang', async (req, res) => {
    const { maPN, maHang } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('maPN', sql.NVarChar(10), maPN)
            .input('maHang', sql.NVarChar(10), maHang)
            .query('DELETE FROM CHITIETPHIEUNHAP WHERE maPN = @maPN AND maHang = @maHang');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy chi tiết phiếu nhập'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Xóa chi tiết phiếu nhập thành công'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa chi tiết phiếu nhập',
            error: err.message
        });
    }
});

// ================== MAGIAMGIA APIs ==================
// GET all
app.get('/api/magiamgia', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query('SELECT maMGG, code, phantramgiam, ngaybatdau, ngayketthuc, trangthai, soluongsudung, gioihan, mota FROM MAGIAMGIA ORDER BY ngaybatdau DESC');

        res.status(200).json({
            success: true,
            count: result.recordset.length,
            data: result.recordset
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy dữ liệu mã giảm giá',
            error: err.message
        });
    }
});

// GET by ID
app.get('/api/magiamgia/:maMGG', async (req, res) => {
    const { maMGG } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('maMGG', sql.NVarChar(10), maMGG)
            .query('SELECT maMGG, code, phantramgiam, ngaybatdau, ngayketthuc, trangthai, soluongsudung, gioihan, mota FROM MAGIAMGIA WHERE maMGG = @maMGG');

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy mã giảm giá'
            });
        }

        res.status(200).json({
            success: true,
            data: result.recordset[0]
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: err.message
        });
    }
});

// GET by code (validate discount code)
app.get('/api/magiamgia/code/:code', async (req, res) => {
    const { code } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('code', sql.NVarChar(20), code)
            .query(`SELECT maMGG, code, phantramgiam, ngaybatdau, ngayketthuc, trangthai, soluongsudung, gioihan, mota 
                    FROM MAGIAMGIA 
                    WHERE code = @code`);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Mã giảm giá không tồn tại'
            });
        }

        const mgg = result.recordset[0];
        const today = new Date();
        const ngayBatDau = mgg.ngaybatdau ? new Date(mgg.ngaybatdau) : null;
        const ngayKetThuc = mgg.ngayketthuc ? new Date(mgg.ngayketthuc) : null;

        // Validate discount code
        if (mgg.trangthai === false || mgg.trangthai === 0) {
            return res.status(400).json({
                success: false,
                message: 'Mã giảm giá đã hết hiệu lực'
            });
        }

        if (ngayBatDau && today < ngayBatDau) {
            return res.status(400).json({
                success: false,
                message: 'Mã giảm giá chưa có hiệu lực'
            });
        }

        if (ngayKetThuc && today > ngayKetThuc) {
            return res.status(400).json({
                success: false,
                message: 'Mã giảm giá đã hết hạn'
            });
        }

        if (mgg.gioihan && mgg.soluongsudung >= mgg.gioihan) {
            return res.status(400).json({
                success: false,
                message: 'Mã giảm giá đã hết lượt sử dụng'
            });
        }

        res.status(200).json({
            success: true,
            data: mgg
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: err.message
        });
    }
});

// POST
app.post('/api/magiamgia', async (req, res) => {
    const { maMGG, code, phantramgiam, ngaybatdau, ngayketthuc, trangthai, gioihan, mota } = req.body;
    if (!maMGG || !code || phantramgiam === undefined) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin bắt buộc: maMGG, code, phantramgiam'
        });
    }
    if (phantramgiam < 0 || phantramgiam > 100) {
        return res.status(400).json({
            success: false,
            message: 'Phần trăm giảm giá phải từ 0 đến 100'
        });
    }
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('maMGG', sql.NVarChar(10), maMGG)
            .input('code', sql.NVarChar(20), code)
            .input('phantramgiam', sql.Int, phantramgiam)
            .input('ngaybatdau', sql.Date, ngaybatdau || null)
            .input('ngayketthuc', sql.Date, ngayketthuc || null)
            .input('trangthai', sql.Bit, trangthai !== undefined ? trangthai : 1)
            .input('gioihan', sql.Int, gioihan || null)
            .input('mota', sql.NVarChar(200), mota || null)
            .query('INSERT INTO MAGIAMGIA (maMGG, code, phantramgiam, ngaybatdau, ngayketthuc, trangthai, soluongsudung, gioihan, mota) VALUES (@maMGG, @code, @phantramgiam, @ngaybatdau, @ngayketthuc, @trangthai, 0, @gioihan, @mota)');

        res.status(201).json({
            success: true,
            message: 'Thêm mã giảm giá thành công',
            data: { maMGG, code, phantramgiam, ngaybatdau, ngayketthuc, trangthai, gioihan, mota }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm mã giảm giá',
            error: err.message
        });
    }
});

// PUT
app.put('/api/magiamgia/:maMGG', async (req, res) => {
    const { maMGG } = req.params;
    const { code, phantramgiam, ngaybatdau, ngayketthuc, trangthai, gioihan, mota } = req.body;
    if (!code || phantramgiam === undefined) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin bắt buộc: code, phantramgiam'
        });
    }
    if (phantramgiam < 0 || phantramgiam > 100) {
        return res.status(400).json({
            success: false,
            message: 'Phần trăm giảm giá phải từ 0 đến 100'
        });
    }
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('maMGG', sql.NVarChar(10), maMGG)
            .input('code', sql.NVarChar(20), code)
            .input('phantramgiam', sql.Int, phantramgiam)
            .input('ngaybatdau', sql.Date, ngaybatdau || null)
            .input('ngayketthuc', sql.Date, ngayketthuc || null)
            .input('trangthai', sql.Bit, trangthai !== undefined ? trangthai : 1)
            .input('gioihan', sql.Int, gioihan || null)
            .input('mota', sql.NVarChar(200), mota || null)
            .query('UPDATE MAGIAMGIA SET code = @code, phantramgiam = @phantramgiam, ngaybatdau = @ngaybatdau, ngayketthuc = @ngayketthuc, trangthai = @trangthai, gioihan = @gioihan, mota = @mota WHERE maMGG = @maMGG');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy mã giảm giá'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật mã giảm giá thành công',
            data: { maMGG, code, phantramgiam, ngaybatdau, ngayketthuc, trangthai, gioihan, mota }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật mã giảm giá',
            error: err.message
        });
    }
});

// DELETE
app.delete('/api/magiamgia/:maMGG', async (req, res) => {
    const { maMGG } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('maMGG', sql.NVarChar(10), maMGG)
            .query('DELETE FROM MAGIAMGIA WHERE maMGG = @maMGG');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy mã giảm giá'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Xóa mã giảm giá thành công'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa mã giảm giá',
            error: err.message
        });
    }
});

// ================== HOADON APIs ==================
// GET all
app.get('/api/hoadon', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query(`SELECT h.maHD, h.maNV, h.maKH, h.ngaylap, h.tongtien, h.maMGG, h.tiengiamgia, 
                    mgg.code as codeMGG
                    FROM HOADON h
                    LEFT JOIN MAGIAMGIA mgg ON h.maMGG = mgg.maMGG
                    ORDER BY h.ngaylap DESC`);

        res.status(200).json({
            success: true,
            count: result.recordset.length,
            data: result.recordset
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy dữ liệu hóa đơn',
            error: err.message
        });
    }
});

// GET by ID
app.get('/api/hoadon/:maHD', async (req, res) => {
    const { maHD } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('maHD', sql.NVarChar(10), maHD)
            .query(`SELECT h.maHD, h.maNV, h.maKH, h.ngaylap, h.tongtien, h.maMGG, h.tiengiamgia, 
                    mgg.code as codeMGG
                    FROM HOADON h
                    LEFT JOIN MAGIAMGIA mgg ON h.maMGG = mgg.maMGG
                    WHERE h.maHD = @maHD`);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hóa đơn'
            });
        }

        res.status(200).json({
            success: true,
            data: result.recordset[0]
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: err.message
        });
    }
});

// POST - Tự động sinh mã HD
app.post('/api/hoadon', async (req, res) => {
    const { maNV, maKH, ngaylap, codeMGG } = req.body;
    if (!maNV || !ngaylap) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin maNV hoặc ngaylap'
        });
    }
    try {
        const pool = await poolPromise;
        
        // Tự động sinh mã HD
        const maHD = await generateMaHD();
        
        let maMGG = null;
        let tiengiamgia = 0;

        // Validate and get discount code if provided
        if (codeMGG) {
            const mggResult = await pool.request()
                .input('code', sql.NVarChar(20), codeMGG)
                .query(`SELECT maMGG, phantramgiam, ngaybatdau, ngayketthuc, trangthai, soluongsudung, gioihan 
                        FROM MAGIAMGIA 
                        WHERE code = @code AND trangthai = 1`);

            if (mggResult.recordset.length > 0) {
                const mgg = mggResult.recordset[0];
                const today = new Date();
                const ngayBatDau = mgg.ngaybatdau ? new Date(mgg.ngaybatdau) : null;
                const ngayKetThuc = mgg.ngayketthuc ? new Date(mgg.ngayketthuc) : null;

                // Validate discount code dates and usage limit
                if (ngayBatDau && today < ngayBatDau) {
                    return res.status(400).json({
                        success: false,
                        message: 'Mã giảm giá chưa có hiệu lực'
                    });
                }

                if (ngayKetThuc && today > ngayKetThuc) {
                    return res.status(400).json({
                        success: false,
                        message: 'Mã giảm giá đã hết hạn'
                    });
                }

                if (mgg.gioihan && mgg.soluongsudung >= mgg.gioihan) {
                    return res.status(400).json({
                        success: false,
                        message: 'Mã giảm giá đã hết lượt sử dụng'
                    });
                }

                maMGG = mgg.maMGG;
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Mã giảm giá không hợp lệ hoặc đã hết hiệu lực'
                });
            }
        }

        // Initial total is 0, will be recalculated when details are added
        const tongtien = 0;

        await pool.request()
            .input('maHD', sql.NVarChar(10), maHD)
            .input('maNV', sql.NVarChar(10), maNV)
            .input('maKH', sql.NVarChar(10), maKH || null)
            .input('ngaylap', sql.Date, ngaylap)
            .input('tongtien', sql.Decimal(18, 2), tongtien)
            .input('maMGG', sql.NVarChar(10), maMGG)
            .input('tiengiamgia', sql.Decimal(18, 2), tiengiamgia)
            .query('INSERT INTO HOADON (maHD, maNV, maKH, ngaylap, tongtien, maMGG, tiengiamgia) VALUES (@maHD, @maNV, @maKH, @ngaylap, @tongtien, @maMGG, @tiengiamgia)');

        res.status(201).json({
            success: true,
            message: 'Thêm hóa đơn thành công',
            data: { maHD, maNV, maKH, ngaylap, tongtien, maMGG, tiengiamgia }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm hóa đơn',
            error: err.message
        });
    }
});

// PUT
app.put('/api/hoadon/:maHD', async (req, res) => {
    const { maHD } = req.params;
    const { maNV, maKH, ngaylap, codeMGG } = req.body;
    if (!maNV || !ngaylap) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin maNV hoặc ngaylap'
        });
    }
    try {
        const pool = await poolPromise;

        // Get current invoice to check old discount code
        const currentResult = await pool.request()
            .input('maHD', sql.NVarChar(10), maHD)
            .query('SELECT maMGG FROM HOADON WHERE maHD = @maHD');

        const oldMaMGG = currentResult.recordset.length > 0 ? currentResult.recordset[0].maMGG : null;

        let maMGG = null;

        // Validate and get discount code if provided
        if (codeMGG) {
            const mggResult = await pool.request()
                .input('code', sql.NVarChar(20), codeMGG)
                .query(`SELECT maMGG, phantramgiam, ngaybatdau, ngayketthuc, trangthai, soluongsudung, gioihan 
                        FROM MAGIAMGIA 
                        WHERE code = @code AND trangthai = 1`);

            if (mggResult.recordset.length > 0) {
                const mgg = mggResult.recordset[0];
                const today = new Date();
                const ngayBatDau = mgg.ngaybatdau ? new Date(mgg.ngaybatdau) : null;
                const ngayKetThuc = mgg.ngayketthuc ? new Date(mgg.ngayketthuc) : null;

                // Validate discount code dates and usage limit
                if (ngayBatDau && today < ngayBatDau) {
                    return res.status(400).json({
                        success: false,
                        message: 'Mã giảm giá chưa có hiệu lực'
                    });
                }

                if (ngayKetThuc && today > ngayKetThuc) {
                    return res.status(400).json({
                        success: false,
                        message: 'Mã giảm giá đã hết hạn'
                    });
                }

                if (mgg.gioihan && mgg.soluongsudung >= mgg.gioihan) {
                    return res.status(400).json({
                        success: false,
                        message: 'Mã giảm giá đã hết lượt sử dụng'
                    });
                }

                maMGG = mgg.maMGG;
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Mã giảm giá không hợp lệ hoặc đã hết hiệu lực'
                });
            }
        }

        // Calculate total from invoice details
        const totalResult = await pool.request()
            .input('maHD', sql.NVarChar(10), maHD)
            .query('SELECT SUM(tongtien) as tongtien FROM CHITIET_HD WHERE maHD = @maHD');

        const tongtien = totalResult.recordset[0].tongtien || 0;

        // Calculate discount amount
        let tiengiamgia = 0;
        if (maMGG && tongtien > 0) {
            const mggResult = await pool.request()
                .input('maMGG', sql.NVarChar(10), maMGG)
                .query('SELECT phantramgiam FROM MAGIAMGIA WHERE maMGG = @maMGG');

            if (mggResult.recordset.length > 0) {
                const phantramgiam = mggResult.recordset[0].phantramgiam;
                tiengiamgia = (tongtien * phantramgiam) / 100;
            }
        }

        const result = await pool.request()
            .input('maHD', sql.NVarChar(10), maHD)
            .input('maNV', sql.NVarChar(10), maNV)
            .input('maKH', sql.NVarChar(10), maKH || null)
            .input('ngaylap', sql.Date, ngaylap)
            .input('tongtien', sql.Decimal(18, 2), tongtien)
            .input('maMGG', sql.NVarChar(10), maMGG)
            .input('tiengiamgia', sql.Decimal(18, 2), tiengiamgia)
            .query('UPDATE HOADON SET maNV = @maNV, maKH = @maKH, ngaylap = @ngaylap, tongtien = @tongtien, maMGG = @maMGG, tiengiamgia = @tiengiamgia WHERE maHD = @maHD');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hóa đơn'
            });
        }

        // Update discount code usage count if changed
        if (maMGG && maMGG !== oldMaMGG) {
            await pool.request()
                .input('maMGG', sql.NVarChar(10), maMGG)
                .query('UPDATE MAGIAMGIA SET soluongsudung = soluongsudung + 1 WHERE maMGG = @maMGG');
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật hóa đơn thành công',
            data: { maHD, maNV, maKH, ngaylap, tongtien, maMGG, tiengiamgia }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật hóa đơn',
            error: err.message
        });
    }
});

// DELETE
app.delete('/api/hoadon/:maHD', async (req, res) => {
    const { maHD } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('maHD', sql.NVarChar(10), maHD)
            .query('DELETE FROM HOADON WHERE maHD = @maHD');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hóa đơn'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Xóa hóa đơn thành công'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa hóa đơn',
            error: err.message
        });
    }
});

// ================== CHITIET_HD APIs ==================
// GET all
app.get('/api/chitiethd', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query('SELECT maHD, maHang, soluong, dongia, tongtien FROM CHITIET_HD');

        res.status(200).json({
            success: true,
            count: result.recordset.length,
            data: result.recordset
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy dữ liệu chi tiết hóa đơn',
            error: err.message
        });
    }
});

// GET by ID (composite key)
app.get('/api/chitiethd/:maHD/:maHang', async (req, res) => {
    const { maHD, maHang } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('maHD', sql.NVarChar(10), maHD)
            .input('maHang', sql.NVarChar(10), maHang)
            .query('SELECT maHD, maHang, soluong, dongia, tongtien FROM CHITIET_HD WHERE maHD = @maHD AND maHang = @maHang');

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy chi tiết hóa đơn'
            });
        }

        res.status(200).json({
            success: true,
            data: result.recordset[0]
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: err.message
        });
    }
});

// GET by maHD
app.get('/api/chitiethd/:maHD', async (req, res) => {
    const { maHD } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('maHD', sql.NVarChar(10), maHD)
            .query('SELECT maHD, maHang, soluong, dongia, tongtien FROM CHITIET_HD WHERE maHD = @maHD');

        res.status(200).json({
            success: true,
            count: result.recordset.length,
            data: result.recordset
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: err.message
        });
    }
});

// POST - Trừ hàng trong kho khi thêm chi tiết hóa đơn
app.post('/api/chitiethd', async (req, res) => {
    const { maHD, maHang, soluong, dongia } = req.body;
    if (!maHD || !maHang || soluong === undefined || dongia === undefined) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin bắt buộc: maHD, maHang, soluong, dongia'
        });
    }
    try {
        const pool = await poolPromise;
        
        // Kiểm tra tồn kho
        const stockResult = await pool.request()
            .input('maHang', sql.NVarChar(10), maHang)
            .query('SELECT soluong FROM HANGHOA WHERE maHang = @maHang');
        
        if (stockResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hàng hóa'
            });
        }
        
        const currentStock = stockResult.recordset[0].soluong;
        if (currentStock < soluong) {
            return res.status(400).json({
                success: false,
                message: `Số lượng trong kho không đủ. Hiện có: ${currentStock}, yêu cầu: ${soluong}`
            });
        }
        
        // Calculate tongtien = soluong * dongia
        const tongtien = soluong * dongia;

        // Thêm chi tiết hóa đơn
        await pool.request()
            .input('maHD', sql.NVarChar(10), maHD)
            .input('maHang', sql.NVarChar(10), maHang)
            .input('soluong', sql.Int, soluong)
            .input('dongia', sql.Decimal(18, 2), dongia)
            .input('tongtien', sql.Decimal(18, 2), tongtien)
            .query('INSERT INTO CHITIET_HD (maHD, maHang, soluong, dongia, tongtien) VALUES (@maHD, @maHang, @soluong, @dongia, @tongtien)');

        // Trừ hàng trong kho
        await pool.request()
            .input('maHang', sql.NVarChar(10), maHang)
            .input('soluong', sql.Int, soluong)
            .query('UPDATE HANGHOA SET soluong = soluong - @soluong WHERE maHang = @maHang');

        // Recalculate invoice total and apply discount
        await recalculateInvoiceTotal(maHD);

        res.status(201).json({
            success: true,
            message: 'Thêm chi tiết hóa đơn thành công',
            data: { maHD, maHang, soluong, dongia, tongtien }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm chi tiết hóa đơn',
            error: err.message
        });
    }
});

// PUT - Cập nhật số lượng, điều chỉnh kho
app.put('/api/chitiethd/:maHD/:maHang', async (req, res) => {
    const { maHD, maHang } = req.params;
    const { soluong, dongia } = req.body;
    if (soluong === undefined || dongia === undefined) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin soluong hoặc dongia'
        });
    }
    try {
        const pool = await poolPromise;
        
        // Lấy số lượng cũ
        const oldResult = await pool.request()
            .input('maHD', sql.NVarChar(10), maHD)
            .input('maHang', sql.NVarChar(10), maHang)
            .query('SELECT soluong FROM CHITIET_HD WHERE maHD = @maHD AND maHang = @maHang');
        
        if (oldResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy chi tiết hóa đơn'
            });
        }
        
        const oldSoluong = oldResult.recordset[0].soluong;
        const diffSoluong = soluong - oldSoluong;
        
        // Kiểm tra tồn kho nếu tăng số lượng
        if (diffSoluong > 0) {
            const stockResult = await pool.request()
                .input('maHang', sql.NVarChar(10), maHang)
                .query('SELECT soluong FROM HANGHOA WHERE maHang = @maHang');
            
            if (stockResult.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy hàng hóa'
                });
            }
            
            const currentStock = stockResult.recordset[0].soluong;
            if (currentStock < diffSoluong) {
                return res.status(400).json({
                    success: false,
                    message: `Số lượng trong kho không đủ. Hiện có: ${currentStock}, cần thêm: ${diffSoluong}`
                });
            }
        }
        
        // Calculate tongtien = soluong * dongia
        const tongtien = soluong * dongia;
        
        const result = await pool.request()
            .input('maHD', sql.NVarChar(10), maHD)
            .input('maHang', sql.NVarChar(10), maHang)
            .input('soluong', sql.Int, soluong)
            .input('dongia', sql.Decimal(18, 2), dongia)
            .input('tongtien', sql.Decimal(18, 2), tongtien)
            .query('UPDATE CHITIET_HD SET soluong = @soluong, dongia = @dongia, tongtien = @tongtien WHERE maHD = @maHD AND maHang = @maHang');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy chi tiết hóa đơn'
            });
        }

        // Điều chỉnh kho: trừ nếu tăng, cộng nếu giảm
        if (diffSoluong !== 0) {
            await pool.request()
                .input('maHang', sql.NVarChar(10), maHang)
                .input('diffSoluong', sql.Int, -diffSoluong) // Trừ nếu tăng, cộng nếu giảm
                .query('UPDATE HANGHOA SET soluong = soluong - @diffSoluong WHERE maHang = @maHang');
        }

        // Recalculate invoice total and apply discount
        await recalculateInvoiceTotal(maHD);

        res.status(200).json({
            success: true,
            message: 'Cập nhật chi tiết hóa đơn thành công',
            data: { maHD, maHang, soluong, dongia, tongtien }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật chi tiết hóa đơn',
            error: err.message
        });
    }
});

// DELETE - Cộng lại hàng vào kho khi xóa chi tiết
app.delete('/api/chitiethd/:maHD/:maHang', async (req, res) => {
    const { maHD, maHang } = req.params;
    try {
        const pool = await poolPromise;
        
        // Lấy số lượng trước khi xóa
        const detailResult = await pool.request()
            .input('maHD', sql.NVarChar(10), maHD)
            .input('maHang', sql.NVarChar(10), maHang)
            .query('SELECT soluong FROM CHITIET_HD WHERE maHD = @maHD AND maHang = @maHang');
        
        if (detailResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy chi tiết hóa đơn'
            });
        }
        
        const soluong = detailResult.recordset[0].soluong;
        
        // Xóa chi tiết
        const result = await pool.request()
            .input('maHD', sql.NVarChar(10), maHD)
            .input('maHang', sql.NVarChar(10), maHang)
            .query('DELETE FROM CHITIET_HD WHERE maHD = @maHD AND maHang = @maHang');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy chi tiết hóa đơn'
            });
        }

        // Cộng lại hàng vào kho
        await pool.request()
            .input('maHang', sql.NVarChar(10), maHang)
            .input('soluong', sql.Int, soluong)
            .query('UPDATE HANGHOA SET soluong = soluong + @soluong WHERE maHang = @maHang');

        // Recalculate invoice total and apply discount
        await recalculateInvoiceTotal(maHD);

        res.status(200).json({
            success: true,
            message: 'Xóa chi tiết hóa đơn thành công'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa chi tiết hóa đơn',
            error: err.message
        });
    }
});

// Helper function to recalculate invoice total and apply discount
async function recalculateInvoiceTotal(maHD) {
    const pool = await poolPromise;
    
    // Calculate total from invoice details
    const totalResult = await pool.request()
        .input('maHD', sql.NVarChar(10), maHD)
        .query('SELECT SUM(tongtien) as tongtien FROM CHITIET_HD WHERE maHD = @maHD');
    
    const tongtien = totalResult.recordset[0].tongtien || 0;
    
    // Get invoice discount code
    const invoiceResult = await pool.request()
        .input('maHD', sql.NVarChar(10), maHD)
        .query('SELECT maMGG FROM HOADON WHERE maHD = @maHD');
    
    let tiengiamgia = 0;
    if (invoiceResult.recordset.length > 0 && invoiceResult.recordset[0].maMGG) {
        const maMGG = invoiceResult.recordset[0].maMGG;
        const mggResult = await pool.request()
            .input('maMGG', sql.NVarChar(10), maMGG)
            .query('SELECT phantramgiam FROM MAGIAMGIA WHERE maMGG = @maMGG');
        
        if (mggResult.recordset.length > 0) {
            const phantramgiam = mggResult.recordset[0].phantramgiam;
            tiengiamgia = (tongtien * phantramgiam) / 100;
        }
    }
    
    // Update invoice total and discount
    await pool.request()
        .input('maHD', sql.NVarChar(10), maHD)
        .input('tongtien', sql.Decimal(18, 2), tongtien)
        .input('tiengiamgia', sql.Decimal(18, 2), tiengiamgia)
        .query('UPDATE HOADON SET tongtien = @tongtien, tiengiamgia = @tiengiamgia WHERE maHD = @maHD');
}

// ================== INVOICE DETAIL API ==================
// Get full invoice details with all information
app.get('/api/hoadon/:maHD/export', async (req, res) => {
    const { maHD } = req.params;
    const { format } = req.query; // 'json' or 'excel'
    
    try {
        const pool = await poolPromise;
        
        // Get invoice data with all related information
        const invoiceResult = await pool.request()
            .input('maHD', sql.NVarChar(10), maHD)
            .query(`SELECT h.maHD, h.ngaylap, h.tongtien, h.maMGG, h.tiengiamgia,
                    nv.maNV, nv.tenNV as tenNhanVien,
                    kh.maKH, kh.tenKH as tenKhachHang, kh.diachi, kh.sdt,
                    mgg.maMGG, mgg.code as codeMGG, mgg.phantramgiam, mgg.mota as motaMGG
                    FROM HOADON h
                    LEFT JOIN NHANVIEN nv ON h.maNV = nv.maNV
                    LEFT JOIN KHACHHANG kh ON h.maKH = kh.maKH
                    LEFT JOIN MAGIAMGIA mgg ON h.maMGG = mgg.maMGG
                    WHERE h.maHD = @maHD`);
        
        if (invoiceResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hóa đơn'
            });
        }
        
        const invoice = invoiceResult.recordset[0];
        
        // Get invoice details with product information
        const detailsResult = await pool.request()
            .input('maHD', sql.NVarChar(10), maHD)
            .query(`SELECT cthd.maHang, cthd.soluong, cthd.dongia, cthd.tongtien,
                    hh.loaihang as tenHang, hh.donvi, hh.giabanra
                    FROM CHITIET_HD cthd
                    INNER JOIN HANGHOA hh ON cthd.maHang = hh.maHang
                    WHERE cthd.maHD = @maHD
                    ORDER BY cthd.maHang`);
        
        const details = detailsResult.recordset;
        
        // Calculate final amount
        const tongTien = parseFloat(invoice.tongtien) || 0;
        const tienGiamGia = parseFloat(invoice.tiengiamgia) || 0;
        const thanhTien = tongTien - tienGiamGia;
        
        // Prepare response data
        const invoiceData = {
            thongTinHoaDon: {
                maHD: invoice.maHD,
                ngaylap: invoice.ngaylap,
                nhanVien: {
                    maNV: invoice.maNV,
                    tenNV: invoice.tenNhanVien
                },
                khachHang: invoice.maKH ? {
                    maKH: invoice.maKH,
                    tenKH: invoice.tenKhachHang,
                    diachi: invoice.diachi,
                    sdt: invoice.sdt
                } : null,
                maGiamGia: invoice.codeMGG ? {
                    code: invoice.codeMGG,
                    phantramgiam: invoice.phantramgiam,
                    mota: invoice.motaMGG
                } : null,
                tongTien: tongTien,
                tienGiamGia: tienGiamGia,
                thanhTien: thanhTien
            },
            chiTietHangHoa: details.map((item, index) => ({
                stt: index + 1,
                maHang: item.maHang,
                tenHang: item.tenHang,
                donvi: item.donvi,
                soluong: item.soluong,
                dongia: parseFloat(item.dongia),
                tongtien: parseFloat(item.tongtien)
            }))
        };
        
        // Return JSON or Excel based on format parameter
        if (format === 'excel') {
            // Create Excel file
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Hóa Đơn');
            
            // Set column widths
            worksheet.columns = [
                { width: 10 }, // STT
                { width: 15 }, // Mã hàng
                { width: 30 }, // Tên hàng
                { width: 10 }, // Đơn vị
                { width: 12 }, // Số lượng
                { width: 15 }, // Đơn giá
                { width: 15 }  // Thành tiền
            ];
            
            // Header row
            worksheet.mergeCells('A1:G1');
            worksheet.getCell('A1').value = 'HÓA ĐƠN BÁN HÀNG';
            worksheet.getCell('A1').font = { size: 16, bold: true };
            worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
            
            // Invoice info
            worksheet.mergeCells('A2:G2');
            worksheet.getCell('A2').value = `Mã hóa đơn: ${invoice.maHD} | Ngày lập: ${new Date(invoice.ngaylap).toLocaleDateString('vi-VN')}`;
            worksheet.getCell('A2').alignment = { horizontal: 'center' };
            
            // Customer info
            if (invoice.tenKhachHang) {
                worksheet.mergeCells('A3:G3');
                worksheet.getCell('A3').value = `Khách hàng: ${invoice.tenKhachHang}${invoice.diachi ? ' | Địa chỉ: ' + invoice.diachi : ''}${invoice.sdt ? ' | SĐT: ' + invoice.sdt : ''}`;
            }
            
            // Staff info
            worksheet.mergeCells('A4:G4');
            worksheet.getCell('A4').value = `Nhân viên: ${invoice.tenNhanVien || 'N/A'}`;
            
            // Discount code
            if (invoice.codeMGG) {
                worksheet.mergeCells('A5:G5');
                worksheet.getCell('A5').value = `Mã giảm giá: ${invoice.codeMGG} (${invoice.phantramgiam}%)${invoice.motaMGG ? ' - ' + invoice.motaMGG : ''}`;
                worksheet.getCell('A5').font = { color: { argb: 'FF0066CC' } };
            }
            
            // Empty row
            worksheet.getRow(6).height = 5;
            
            // Table header
            const headerRow = worksheet.getRow(7);
            headerRow.values = ['STT', 'Mã hàng', 'Tên hàng', 'Đơn vị', 'Số lượng', 'Đơn giá', 'Thành tiền'];
            headerRow.font = { bold: true };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF667EEA' }
            };
            headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
            headerRow.height = 25;
            
            // Data rows
            details.forEach((item, index) => {
                const row = worksheet.getRow(8 + index);
                row.values = [
                    index + 1,
                    item.maHang,
                    item.tenHang,
                    item.donvi || '',
                    item.soluong,
                    parseFloat(item.dongia).toLocaleString('vi-VN'),
                    parseFloat(item.tongtien).toLocaleString('vi-VN')
                ];
                row.getCell(6).numFmt = '#,##0';
                row.getCell(7).numFmt = '#,##0';
            });
            
            // Summary row
            const summaryRowIndex = 8 + details.length;
            worksheet.mergeCells(`A${summaryRowIndex}:E${summaryRowIndex}`);
            worksheet.getCell(`A${summaryRowIndex}`).value = 'Tổng tiền:';
            worksheet.getCell(`A${summaryRowIndex}`).font = { bold: true };
            worksheet.getCell(`F${summaryRowIndex}`).value = tongTien.toLocaleString('vi-VN');
            worksheet.getCell(`F${summaryRowIndex}`).numFmt = '#,##0';
            worksheet.getCell(`F${summaryRowIndex}`).font = { bold: true };
            
            if (tienGiamGia > 0) {
                const discountRowIndex = summaryRowIndex + 1;
                worksheet.mergeCells(`A${discountRowIndex}:E${discountRowIndex}`);
                worksheet.getCell(`A${discountRowIndex}`).value = 'Tiền giảm giá:';
                worksheet.getCell(`F${discountRowIndex}`).value = '-' + tienGiamGia.toLocaleString('vi-VN');
                worksheet.getCell(`F${discountRowIndex}`).numFmt = '#,##0';
                worksheet.getCell(`F${discountRowIndex}`).font = { color: { argb: 'FFCC0000' } };
            }
            
            const finalRowIndex = tienGiamGia > 0 ? summaryRowIndex + 2 : summaryRowIndex + 1;
            worksheet.mergeCells(`A${finalRowIndex}:E${finalRowIndex}`);
            worksheet.getCell(`A${finalRowIndex}`).value = 'Thành tiền:';
            worksheet.getCell(`A${finalRowIndex}`).font = { size: 12, bold: true };
            worksheet.getCell(`F${finalRowIndex}`).value = thanhTien.toLocaleString('vi-VN');
            worksheet.getCell(`F${finalRowIndex}`).numFmt = '#,##0';
            worksheet.getCell(`F${finalRowIndex}`).font = { size: 12, bold: true };
            
            // Footer
            worksheet.mergeCells(`A${finalRowIndex + 2}:G${finalRowIndex + 2}`);
            worksheet.getCell(`A${finalRowIndex + 2}`).value = 'Cảm ơn quý khách đã sử dụng dịch vụ!';
            worksheet.getCell(`A${finalRowIndex + 2}`).alignment = { horizontal: 'center' };
            worksheet.getCell(`A${finalRowIndex + 2}`).font = { italic: true };
            
            // Set response headers
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="HoaDon_${maHD}.xlsx"`);
            
            // Write to response
            await workbook.xlsx.write(res);
            res.end();
        } else {
            // Return JSON
            res.status(200).json({
                success: true,
                data: invoiceData
            });
        }
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xuất hóa đơn',
            error: err.message
        });
    }
});

// ================== PDF EXPORT API ==================
// Export invoice to PDF
app.get('/api/hoadon/:maHD/pdf', async (req, res) => {
    const { maHD } = req.params;
    try {
        const pool = await poolPromise;

        // Get invoice data
        const invoiceResult = await pool.request()
            .input('maHD', sql.NVarChar(10), maHD)
            .query(`SELECT h.maHD, h.ngaylap, h.tongtien, h.maMGG, h.tiengiamgia,
                    nv.tenNV, kh.tenKH, kh.diachi, kh.sdt,
                    mgg.code as codeMGG, mgg.phantramgiam
                    FROM HOADON h
                    LEFT JOIN NHANVIEN nv ON h.maNV = nv.maNV
                    LEFT JOIN KHACHHANG kh ON h.maKH = kh.maKH
                    LEFT JOIN MAGIAMGIA mgg ON h.maMGG = mgg.maMGG
                    WHERE h.maHD = @maHD`);

        if (invoiceResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hóa đơn'
            });
        }

        const invoice = invoiceResult.recordset[0];

        // Get invoice details
        const detailsResult = await pool.request()
            .input('maHD', sql.NVarChar(10), maHD)
            .query(`SELECT cthd.maHang, cthd.soluong, cthd.dongia, cthd.tongtien,
                    hh.loaihang, hh.donvi
                    FROM CHITIET_HD cthd
                    INNER JOIN HANGHOA hh ON cthd.maHang = hh.maHang
                    WHERE cthd.maHD = @maHD
                    ORDER BY cthd.maHang`);

        const details = detailsResult.recordset;

        // Create PDF with A4 portrait
        const doc = new PDFDocument({
            margin: 10,
            size: 'A4',
            layout: 'portrait',
            info: {
                Title: `Hoa Don ${maHD}`,
                Author: 'FMSTYLE',
                Subject: 'Hoa don ban hang'
            }
        });

        // Font registration
        const fontsDir = path.join(__dirname, 'fonts');
        const windowsFontsDir = process.platform === 'win32'
            ? path.join(process.env.WINDIR || 'C:\\Windows', 'Fonts')
            : null;

        let vietnameseFont = 'Times-Roman';
        let vietnameseFontBold = 'Times-Bold';

        const fontFiles = {
            'NotoSans-Regular.ttf': 'NotoSans',
            'NotoSans-Bold.ttf': 'NotoSansBold',
            'Arial-Unicode-MS.ttf': 'ArialUnicode',
            'Times-New-Roman.ttf': 'TimesNewRoman'
        };

        const windowsFontFiles = {
            'arial.ttf': 'Arial',
            'arialbd.ttf': 'ArialBold',
            'times.ttf': 'TimesNewRoman',
            'timesbd.ttf': 'TimesNewRomanBold',
            'tahoma.ttf': 'Tahoma',
            'tahomabd.ttf': 'TahomaBold'
        };

        for (const [filename, fontName] of Object.entries(fontFiles)) {
            const fontPath = path.join(fontsDir, filename);
            if (fs.existsSync(fontPath)) {
                try {
                    doc.registerFont(fontName, fontPath);
                    if (filename.includes('Regular') || filename.includes('Arial') || filename.includes('Times-New')) {
                        vietnameseFont = fontName;
                    }
                    if (filename.includes('Bold')) {
                        vietnameseFontBold = fontName;
                    }
                } catch (e) {
                    console.log(`Could not register font ${filename}:`, e.message);
                }
            }
        }

        if (windowsFontsDir && fs.existsSync(windowsFontsDir) && vietnameseFont === 'Times-Roman') {
            const preferredFonts = ['arial.ttf', 'tahoma.ttf', 'times.ttf'];
            const preferredBoldFonts = ['arialbd.ttf', 'tahomabd.ttf', 'timesbd.ttf'];

            for (const preferredFont of preferredFonts) {
                if (windowsFontFiles[preferredFont]) {
                    const fontPath = path.join(windowsFontsDir, preferredFont);
                    if (fs.existsSync(fontPath)) {
                        try {
                            const fontName = windowsFontFiles[preferredFont];
                            doc.registerFont(fontName, fontPath);
                            vietnameseFont = fontName;
                            break;
                        } catch (e) {
                            console.log(`Could not register Windows font ${preferredFont}:`, e.message);
                        }
                    }
                }
            }

            for (const preferredBoldFont of preferredBoldFonts) {
                if (windowsFontFiles[preferredBoldFont]) {
                    const fontPath = path.join(windowsFontsDir, preferredBoldFont);
                    if (fs.existsSync(fontPath)) {
                        try {
                            const fontName = windowsFontFiles[preferredBoldFont];
                            doc.registerFont(fontName, fontPath);
                            vietnameseFontBold = fontName;
                            break;
                        } catch (e) {
                            console.log(`Could not register Windows bold font ${preferredBoldFont}:`, e.message);
                        }
                    }
                }
            }
        }

        if (vietnameseFont === 'Times-Roman') {
            console.warn('Warning: Vietnamese font not found. PDF may display Vietnamese text incorrectly.');
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="HoaDon_${maHD}.pdf"`);
        doc.pipe(res);

        // Helper functions
        const safeText = (text) => {
            if (text === null || text === undefined) return '';
            try {
                return String(text).normalize('NFC');
            } catch (e) {
                return String(text);
            }
        };

        const formatCurrency = (amount) => {
            return parseFloat(amount || 0).toLocaleString('vi-VN') + ' đ';
        };

        const formatDate = (date) => {
            if (!date) return '';
            const d = new Date(date);
            return d.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        };

        const pageWidth = 595.28;
        const margin = 40;
        const contentWidth = pageWidth - (margin * 2);

        // Header with logo space
        doc.fontSize(26)
            .font(vietnameseFontBold)
            .fillColor('#2563eb')
            .text('HÓA ĐƠN BÁN HÀNG', margin, 50, { align: 'center' });

        // Decorative line
        doc.moveTo(margin, 90)
            .lineTo(pageWidth - margin, 90)
            .lineWidth(3)
            .strokeColor('#3b82f6')
            .stroke();

        doc.moveTo(margin, 94)
            .lineTo(pageWidth - margin, 94)
            .lineWidth(1)
            .strokeColor('#93c5fd')
            .stroke();

        // Invoice info in two columns
        let yPos = 115;
        doc.fontSize(10)
            .font(vietnameseFont)
            .fillColor('#374151');

        // Left column
        doc.font(vietnameseFontBold).text('Mã hóa đơn:', margin, yPos);
        doc.font(vietnameseFont).text(safeText(invoice.maHD), margin + 90, yPos);

        // Right column
        doc.font(vietnameseFontBold).text('Ngày lập:', pageWidth / 2 + 20, yPos);
        doc.font(vietnameseFont).text(formatDate(invoice.ngaylap), pageWidth / 2 + 90, yPos);

        yPos += 25;

        // Customer info section
        if (invoice.tenKH) {
            doc.rect(margin, yPos - 5, contentWidth, 1)
                .fillColor('#e5e7eb')
                .fill();

            yPos += 10;

            doc.fontSize(11)
                .font(vietnameseFontBold)
                .fillColor('#1f2937')
                .text('THÔNG TIN KHÁCH HÀNG', margin, yPos);

            yPos += 20;
            doc.fontSize(10).font(vietnameseFont).fillColor('#374151');

            // Customer name
            doc.font(vietnameseFontBold).text('Khách hàng:', margin, yPos);
            doc.font(vietnameseFont).text(safeText(invoice.tenKH), margin + 90, yPos);
            yPos += 18;

            // Address and phone in two columns
            if (invoice.diachi) {
                doc.font(vietnameseFontBold).text('Địa chỉ:', margin, yPos);
                doc.font(vietnameseFont).text(safeText(invoice.diachi), margin + 90, yPos, {
                    width: contentWidth / 2 - 100
                });
            }

            if (invoice.sdt) {
                const phoneX = invoice.diachi ? pageWidth / 2 + 20 : margin;
                const phoneValueX = invoice.diachi ? pageWidth / 2 + 60 : margin + 90;
                doc.font(vietnameseFontBold).text('SĐT:', phoneX, yPos);
                doc.font(vietnameseFont).text(safeText(invoice.sdt), phoneValueX, yPos);
            }

            yPos += 35;
        }

        // Staff info
        doc.rect(margin, yPos - 5, contentWidth, 1)
            .fillColor('#000000')
            .fill();

        yPos += 10;
        doc.font(vietnameseFontBold).text('Nhân viên:', margin, yPos);
        doc.font(vietnameseFont).text(safeText(invoice.tenNV || 'N/A'), margin + 90, yPos);

        // Discount code
        if (invoice.codeMGG) {
            doc.font(vietnameseFontBold).text('Mã giảm giá:', pageWidth / 2 + 20, yPos);
            doc.font(vietnameseFont)
                .fillColor('#0891b2')
                .text(`${safeText(invoice.codeMGG)} (${invoice.phantramgiam}%)`,
                    pageWidth / 2 + 95, yPos);
            doc.fillColor('#374151');
        }

        yPos += 30;

        // Table
        const tableTop = yPos;
        const colWidths = [35, 65, 140, 45, 40, 75, 90];
        const colX = [margin];
        for (let i = 1; i < colWidths.length; i++) {
            colX[i] = colX[i - 1] + colWidths[i - 1];
        }

        // Table header
        doc.rect(margin, tableTop, contentWidth, 28)
            .fillAndStroke('#3b82f6', '#2563eb');

        doc.fontSize(10)
            .font(vietnameseFontBold)
            .fillColor('#ffffff');

        const headerY = tableTop + 10;
        doc.text('STT', colX[0] + 5, headerY, { width: colWidths[0] - 10, align: 'center' })
            .text('Mã hàng', colX[1] + 5, headerY, { width: colWidths[1] - 10 })
            .text('Tên hàng', colX[2] + 5, headerY, { width: colWidths[2] - 10 })
            .text('ĐVT', colX[3] + 5, headerY, { width: colWidths[3] - 10, align: 'center' })
            .text('SL', colX[4] + 5, headerY, { width: colWidths[4] - 10, align: 'center' })
            .text('Đơn giá', colX[5] + 5, headerY, { width: colWidths[5] - 10, align: 'right' })
            .text('Thành tiền', colX[6] + 5, headerY, { width: colWidths[6] - 10, align: 'right' });

        // Table rows
        yPos = tableTop + 33;
        doc.fontSize(9.5)
            .font(vietnameseFont)
            .fillColor('#1f2937');

        details.forEach((item, index) => {
            if (yPos > 720) {
                doc.addPage();
                yPos = 50;

                // Redraw header
                doc.rect(margin, yPos, contentWidth, 28)
                    .fillAndStroke('#3b82f6', '#2563eb');
                doc.fontSize(10).font(vietnameseFontBold).fillColor('#ffffff');
                const newHeaderY = yPos + 10;
                doc.text('STT', colX[0] + 5, newHeaderY, { width: colWidths[0] - 10, align: 'center' })
                    .text('Mã hàng', colX[1] + 5, newHeaderY, { width: colWidths[1] - 10 })
                    .text('Tên hàng', colX[2] + 5, newHeaderY, { width: colWidths[2] - 10 })
                    .text('ĐVT', colX[3] + 5, newHeaderY, { width: colWidths[3] - 10, align: 'center' })
                    .text('SL', colX[4] + 5, newHeaderY, { width: colWidths[4] - 10, align: 'center' })
                    .text('Đơn giá', colX[5] + 5, newHeaderY, { width: colWidths[5] - 10, align: 'right' })
                    .text('Thành tiền', colX[6] + 5, newHeaderY, { width: colWidths[6] - 10, align: 'right' });
                yPos += 33;
                doc.fontSize(9.5).font(vietnameseFont).fillColor('#1f2937');
            }

            // Alternate row colors
            if (index % 2 === 0) {
                doc.rect(margin, yPos - 2, contentWidth, 22)
                    .fillColor('#f9fafb')
                    .fill();
            }

            const rowY = yPos + 4;
            doc.fillColor('#1f2937')
                .text((index + 1).toString(), colX[0] + 5, rowY, { width: colWidths[0] - 10, align: 'center' })
                .text(safeText(item.maHang), colX[1] + 5, rowY, { width: colWidths[1] - 10 })
                .text(safeText(item.loaihang || ''), colX[2] + 5, rowY, { width: colWidths[2] - 10 })
                .text(safeText(item.donvi || ''), colX[3] + 5, rowY, { width: colWidths[3] - 10, align: 'center' })
                .text(item.soluong.toString(), colX[4] + 5, rowY, { width: colWidths[4] - 10, align: 'center' })
                .text(formatCurrency(item.dongia), colX[5] + 5, rowY, { width: colWidths[5] - 10, align: 'right' })
                .text(formatCurrency(item.tongtien), colX[6] + 5, rowY, { width: colWidths[6] - 10, align: 'right' });

            yPos += 22;
        });

        // Table border
        doc.rect(margin, tableTop, contentWidth, yPos - tableTop)
            .lineWidth(1)
            .strokeColor('#d1d5db')
            .stroke();

        // Summary section
        yPos += 25;
        const summaryBoxWidth = 240;
        const summaryBoxLeft = pageWidth - margin - summaryBoxWidth;
        const tongTien = parseFloat(invoice.tongtien) || 0;
        const tienGiamGia = parseFloat(invoice.tiengiamgia) || 0;
        const thanhTien = tongTien - tienGiamGia;

        const summaryHeight = tienGiamGia > 0 ? 105 : 70;

        // Summary box with gradient effect
        doc.rect(summaryBoxLeft, yPos, summaryBoxWidth, summaryHeight)
            .fillColor('#f8fafc')
            .fillAndStroke('#f8fafc', '#cbd5e1');

        doc.fontSize(10.5).font(vietnameseFont).fillColor('#374151');
        let summaryY = yPos + 15;

        // Total
        doc.text('Tổng tiền:', summaryBoxLeft + 15, summaryY);
        doc.font(vietnameseFontBold)
            .text(formatCurrency(tongTien), summaryBoxLeft + 120, summaryY, {
                width: 105,
                align: 'right'
            });

        // Discount
        if (tienGiamGia > 0) {
            summaryY += 25;
            doc.font(vietnameseFont)
                .fillColor('#dc2626')
                .text('Tiền giảm giá:', summaryBoxLeft + 15, summaryY);
            doc.font(vietnameseFontBold)
                .text('-' + formatCurrency(tienGiamGia), summaryBoxLeft + 120, summaryY, {
                    width: 105,
                    align: 'right'
                });
        }

        // Final total
        summaryY += 28;
        doc.fontSize(12)
            .font(vietnameseFontBold)
            .fillColor('#1e40af')
            .text('Thành tiền:', summaryBoxLeft + 15, summaryY);
        doc.text(formatCurrency(thanhTien), summaryBoxLeft + 120, summaryY, {
            width: 105,
            align: 'right'
        });

        // Footer
        const footerY = 770;
        doc.fontSize(9)
            .font(vietnameseFont)
            .fillColor('#6b7280')
            .text('Cảm ơn quý khách đã sử dụng dịch vụ!', margin, footerY, {
                align: 'center',
                width: contentWidth
            });

        doc.fontSize(8)
            .text('FMSTYLE - Địa chỉ: 171 Bà Triệu, Huế - Hotline: 1900 9090',
                margin, footerY + 15, {
                align: 'center',
                width: contentWidth
            });

        doc.end();

    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xuất PDF',
            error: err.message
        });
    }
});
      
// ================== TRẢ HÀNG API ==================
// Trả hàng: cộng lại số lượng vào kho
app.post('/api/hoadon/:maHD/tra-hang', async (req, res) => {
    const { maHD } = req.params;
    const { items } = req.body; // [{ maHang, soluong }]
    
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu danh sách sản phẩm trả hàng'
        });
    }
    
    try {
        const pool = await poolPromise;
        
        // Kiểm tra hóa đơn tồn tại
        const invoiceResult = await pool.request()
            .input('maHD', sql.NVarChar(10), maHD)
            .query('SELECT maHD FROM HOADON WHERE maHD = @maHD');
        
        if (invoiceResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hóa đơn'
            });
        }
        
        // Kiểm tra và cộng lại hàng vào kho
        for (const item of items) {
            const { maHang, soluong } = item;
            
            // Kiểm tra chi tiết hóa đơn
            const detailResult = await pool.request()
                .input('maHD', sql.NVarChar(10), maHD)
                .input('maHang', sql.NVarChar(10), maHang)
                .query('SELECT soluong FROM CHITIET_HD WHERE maHD = @maHD AND maHang = @maHang');
            
            if (detailResult.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: `Không tìm thấy sản phẩm ${maHang} trong hóa đơn`
                });
            }
            
            const invoiceQty = detailResult.recordset[0].soluong;
            if (soluong > invoiceQty) {
                return res.status(400).json({
                    success: false,
                    message: `Số lượng trả (${soluong}) vượt quá số lượng đã bán (${invoiceQty}) cho sản phẩm ${maHang}`
                });
            }
            
            // Cộng lại hàng vào kho
            await pool.request()
                .input('maHang', sql.NVarChar(10), maHang)
                .input('soluong', sql.Int, soluong)
                .query('UPDATE HANGHOA SET soluong = soluong + @soluong WHERE maHang = @maHang');
            
            // Cập nhật hoặc xóa chi tiết hóa đơn
            if (soluong === invoiceQty) {
                // Xóa nếu trả hết
                await pool.request()
                    .input('maHD', sql.NVarChar(10), maHD)
                    .input('maHang', sql.NVarChar(10), maHang)
                    .query('DELETE FROM CHITIET_HD WHERE maHD = @maHD AND maHang = @maHang');
            } else {
                // Giảm số lượng
                await pool.request()
                    .input('maHD', sql.NVarChar(10), maHD)
                    .input('maHang', sql.NVarChar(10), maHang)
                    .input('soluong', sql.Int, invoiceQty - soluong)
                    .query('UPDATE CHITIET_HD SET soluong = @soluong, tongtien = soluong * dongia WHERE maHD = @maHD AND maHang = @maHang');
            }
        }
        
        // Recalculate invoice total
        await recalculateInvoiceTotal(maHD);
        
        res.status(200).json({
            success: true,
            message: 'Trả hàng thành công',
            data: { maHD, items }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi trả hàng',
            error: err.message
        });
    }
});

// ================== ĐỔI HÀNG API ==================
// Đổi hàng: trừ hàng cũ, cộng hàng mới
app.post('/api/hoadon/:maHD/doi-hang', async (req, res) => {
    const { maHD } = req.params;
    const { maHangCu, maHangMoi, soluong } = req.body;
    
    if (!maHangCu || !maHangMoi || !soluong) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin: maHangCu, maHangMoi, soluong'
        });
    }
    
    try {
        const pool = await poolPromise;
        
        // Kiểm tra hóa đơn và chi tiết cũ
        const oldDetailResult = await pool.request()
            .input('maHD', sql.NVarChar(10), maHD)
            .input('maHangCu', sql.NVarChar(10), maHangCu)
            .query('SELECT soluong, dongia FROM CHITIET_HD WHERE maHD = @maHD AND maHang = @maHangCu');
        
        if (oldDetailResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm cũ trong hóa đơn'
            });
        }
        
        const oldDetail = oldDetailResult.recordset[0];
        if (soluong > oldDetail.soluong) {
            return res.status(400).json({
                success: false,
                message: `Số lượng đổi (${soluong}) vượt quá số lượng đã bán (${oldDetail.soluong})`
            });
        }
        
        // Kiểm tra tồn kho hàng mới
        const newStockResult = await pool.request()
            .input('maHangMoi', sql.NVarChar(10), maHangMoi)
            .query('SELECT soluong, giabanra FROM HANGHOA WHERE maHang = @maHangMoi');
        
        if (newStockResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hàng hóa mới'
            });
        }
        
        const newStock = newStockResult.recordset[0];
        if (newStock.soluong < soluong) {
            return res.status(400).json({
                success: false,
                message: `Số lượng trong kho không đủ. Hiện có: ${newStock.soluong}, yêu cầu: ${soluong}`
            });
        }
        
        // Cộng lại hàng cũ vào kho
        await pool.request()
            .input('maHangCu', sql.NVarChar(10), maHangCu)
            .input('soluong', sql.Int, soluong)
            .query('UPDATE HANGHOA SET soluong = soluong + @soluong WHERE maHang = @maHangCu');
        
        // Trừ hàng mới khỏi kho
        await pool.request()
            .input('maHangMoi', sql.NVarChar(10), maHangMoi)
            .input('soluong', sql.Int, soluong)
            .query('UPDATE HANGHOA SET soluong = soluong - @soluong WHERE maHang = @maHangMoi');
        
        // Cập nhật chi tiết hóa đơn
        if (soluong === oldDetail.soluong) {
            // Đổi toàn bộ: xóa cũ, thêm mới
            await pool.request()
                .input('maHD', sql.NVarChar(10), maHD)
                .input('maHangCu', sql.NVarChar(10), maHangCu)
                .query('DELETE FROM CHITIET_HD WHERE maHD = @maHD AND maHang = @maHangCu');
            
            const newTongtien = soluong * newStock.giabanra;
            await pool.request()
                .input('maHD', sql.NVarChar(10), maHD)
                .input('maHangMoi', sql.NVarChar(10), maHangMoi)
                .input('soluong', sql.Int, soluong)
                .input('dongia', sql.Decimal(18, 2), newStock.giabanra)
                .input('tongtien', sql.Decimal(18, 2), newTongtien)
                .query('INSERT INTO CHITIET_HD (maHD, maHang, soluong, dongia, tongtien) VALUES (@maHD, @maHangMoi, @soluong, @dongia, @tongtien)');
        } else {
            // Đổi một phần: giảm cũ, thêm mới
            const remainingQty = oldDetail.soluong - soluong;
            await pool.request()
                .input('maHD', sql.NVarChar(10), maHD)
                .input('maHangCu', sql.NVarChar(10), maHangCu)
                .input('soluong', sql.Int, remainingQty)
                .query('UPDATE CHITIET_HD SET soluong = @soluong, tongtien = soluong * dongia WHERE maHD = @maHD AND maHang = @maHangCu');
            
            // Kiểm tra xem hàng mới đã có trong hóa đơn chưa
            const existingNewDetail = await pool.request()
                .input('maHD', sql.NVarChar(10), maHD)
                .input('maHangMoi', sql.NVarChar(10), maHangMoi)
                .query('SELECT soluong, dongia FROM CHITIET_HD WHERE maHD = @maHD AND maHang = @maHangMoi');
            
            if (existingNewDetail.recordset.length > 0) {
                // Cộng thêm vào chi tiết đã có
                const newQty = existingNewDetail.recordset[0].soluong + soluong;
                await pool.request()
                    .input('maHD', sql.NVarChar(10), maHD)
                    .input('maHangMoi', sql.NVarChar(10), maHangMoi)
                    .input('soluong', sql.Int, newQty)
                    .query('UPDATE CHITIET_HD SET soluong = @soluong, tongtien = soluong * dongia WHERE maHD = @maHD AND maHang = @maHangMoi');
            } else {
                // Thêm mới
                const newTongtien = soluong * newStock.giabanra;
                await pool.request()
                    .input('maHD', sql.NVarChar(10), maHD)
                    .input('maHangMoi', sql.NVarChar(10), maHangMoi)
                    .input('soluong', sql.Int, soluong)
                    .input('dongia', sql.Decimal(18, 2), newStock.giabanra)
                    .input('tongtien', sql.Decimal(18, 2), newTongtien)
                    .query('INSERT INTO CHITIET_HD (maHD, maHang, soluong, dongia, tongtien) VALUES (@maHD, @maHangMoi, @soluong, @dongia, @tongtien)');
            }
        }
        
        // Recalculate invoice total
        await recalculateInvoiceTotal(maHD);
        
        res.status(200).json({
            success: true,
            message: 'Đổi hàng thành công',
            data: { maHD, maHangCu, maHangMoi, soluong }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi đổi hàng',
            error: err.message
        });
    }
});

// ================== THỐNG KÊ DOANH THU API ==================
// Thống kê doanh thu theo ngày/tuần/tháng/quý/năm
app.get('/api/thongke/doanhthu', async (req, res) => {
    const { period, startDate, endDate } = req.query; // period: 'day', 'week', 'month', 'quarter', 'year'
    
    try {
        const pool = await poolPromise;
        let query = '';
        
        if (period === 'day' && startDate && endDate) {
            query = `SELECT 
                        CAST(ngaylap AS DATE) as ngay,
                        COUNT(*) as soHoaDon,
                        SUM(tongtien) as tongDoanhThu,
                        SUM(tiengiamgia) as tongGiamGia
                    FROM HOADON
                    WHERE CAST(ngaylap AS DATE) BETWEEN @startDate AND @endDate
                    GROUP BY CAST(ngaylap AS DATE)
                    ORDER BY ngay DESC`;
        } else if (period === 'week') {
            query = `SELECT 
                        DATEPART(YEAR, ngaylap) as nam,
                        DATEPART(WEEK, ngaylap) as tuan,
                        COUNT(*) as soHoaDon,
                        SUM(tongtien) as tongDoanhThu,
                        SUM(tiengiamgia) as tongGiamGia
                    FROM HOADON
                    WHERE ngaylap >= DATEADD(WEEK, -12, GETDATE())
                    GROUP BY DATEPART(YEAR, ngaylap), DATEPART(WEEK, ngaylap)
                    ORDER BY nam DESC, tuan DESC`;
        } else if (period === 'month') {
            query = `SELECT 
                        DATEPART(YEAR, ngaylap) as nam,
                        DATEPART(MONTH, ngaylap) as thang,
                        COUNT(*) as soHoaDon,
                        SUM(tongtien) as tongDoanhThu,
                        SUM(tiengiamgia) as tongGiamGia
                    FROM HOADON
                    WHERE ngaylap >= DATEADD(MONTH, -12, GETDATE())
                    GROUP BY DATEPART(YEAR, ngaylap), DATEPART(MONTH, ngaylap)
                    ORDER BY nam DESC, thang DESC`;
        } else if (period === 'quarter') {
            query = `SELECT 
                        DATEPART(YEAR, ngaylap) as nam,
                        DATEPART(QUARTER, ngaylap) as quy,
                        COUNT(*) as soHoaDon,
                        SUM(tongtien) as tongDoanhThu,
                        SUM(tiengiamgia) as tongGiamGia
                    FROM HOADON
                    WHERE ngaylap >= DATEADD(YEAR, -3, GETDATE())
                    GROUP BY DATEPART(YEAR, ngaylap), DATEPART(QUARTER, ngaylap)
                    ORDER BY nam DESC, quy DESC`;
        } else if (period === 'year') {
            query = `SELECT 
                        DATEPART(YEAR, ngaylap) as nam,
                        COUNT(*) as soHoaDon,
                        SUM(tongtien) as tongDoanhThu,
                        SUM(tiengiamgia) as tongGiamGia
                    FROM HOADON
                    GROUP BY DATEPART(YEAR, ngaylap)
                    ORDER BY nam DESC`;
        } else {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin period hoặc startDate/endDate'
            });
        }
        
        const request = pool.request();
        if (startDate) request.input('startDate', sql.Date, startDate);
        if (endDate) request.input('endDate', sql.Date, endDate);
        
        const result = await request.query(query);
        
        res.status(200).json({
            success: true,
            count: result.recordset.length,
            data: result.recordset
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thống kê doanh thu',
            error: err.message
        });
    }
});

// Thống kê doanh thu theo nhân viên
app.get('/api/thongke/doanhthu/nhanvien', async (req, res) => {
    const { startDate, endDate } = req.query;
    
    try {
        const pool = await poolPromise;
        let query = `SELECT 
                        h.maNV,
                        nv.tenNV,
                        COUNT(*) as soHoaDon,
                        SUM(h.tongtien) as tongDoanhThu,
                        SUM(h.tiengiamgia) as tongGiamGia
                    FROM HOADON h
                    LEFT JOIN NHANVIEN nv ON h.maNV = nv.maNV`;
        
        const request = pool.request();
        if (startDate && endDate) {
            query += ` WHERE CAST(h.ngaylap AS DATE) BETWEEN @startDate AND @endDate`;
            request.input('startDate', sql.Date, startDate);
            request.input('endDate', sql.Date, endDate);
        }
        
        query += ` GROUP BY h.maNV, nv.tenNV
                   ORDER BY tongDoanhThu DESC`;
        
        const result = await request.query(query);
        
        res.status(200).json({
            success: true,
            count: result.recordset.length,
            data: result.recordset
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thống kê doanh thu theo nhân viên',
            error: err.message
        });
    }
});

// Thống kê doanh thu theo sản phẩm
app.get('/api/thongke/doanhthu/sanpham', async (req, res) => {
    const { startDate, endDate } = req.query;
    
    try {
        const pool = await poolPromise;
        let query = `SELECT 
                        cthd.maHang,
                        hh.loaihang as tenHang,
                        SUM(cthd.soluong) as tongSoLuongBan,
                        SUM(cthd.tongtien) as tongDoanhThu
                    FROM CHITIET_HD cthd
                    INNER JOIN HANGHOA hh ON cthd.maHang = hh.maHang
                    INNER JOIN HOADON h ON cthd.maHD = h.maHD`;
        
        const request = pool.request();
        if (startDate && endDate) {
            query += ` WHERE CAST(h.ngaylap AS DATE) BETWEEN @startDate AND @endDate`;
            request.input('startDate', sql.Date, startDate);
            request.input('endDate', sql.Date, endDate);
        }
        
        query += ` GROUP BY cthd.maHang, hh.loaihang
                   ORDER BY tongDoanhThu DESC`;
        
        const result = await request.query(query);
        
        res.status(200).json({
            success: true,
            count: result.recordset.length,
            data: result.recordset
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thống kê doanh thu theo sản phẩm',
            error: err.message
        });
    }
});

// ================== BÁO CÁO SẢN PHẨM BÁN CHẠY/CHẬM API ==================
// Sản phẩm bán chạy
app.get('/api/baocao/sanpham/banchay', async (req, res) => {
    const { limit = 10, startDate, endDate } = req.query;
    
    try {
        const pool = await poolPromise;
        let query = `SELECT TOP ${limit}
                        cthd.maHang,
                        hh.loaihang as tenHang,
                        SUM(cthd.soluong) as tongSoLuongBan,
                        SUM(cthd.tongtien) as tongDoanhThu,
                        COUNT(DISTINCT cthd.maHD) as soHoaDon
                    FROM CHITIET_HD cthd
                    INNER JOIN HANGHOA hh ON cthd.maHang = hh.maHang
                    INNER JOIN HOADON h ON cthd.maHD = h.maHD`;
        
        const request = pool.request();
        if (startDate && endDate) {
            query += ` WHERE CAST(h.ngaylap AS DATE) BETWEEN @startDate AND @endDate`;
            request.input('startDate', sql.Date, startDate);
            request.input('endDate', sql.Date, endDate);
        }
        
        query += ` GROUP BY cthd.maHang, hh.loaihang
                   ORDER BY tongSoLuongBan DESC`;
        
        const result = await request.query(query);
        
        res.status(200).json({
            success: true,
            count: result.recordset.length,
            data: result.recordset
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy báo cáo sản phẩm bán chạy',
            error: err.message
        });
    }
});

// Sản phẩm bán chậm (lâu ngày không bán)
app.get('/api/baocao/sanpham/bancham', async (req, res) => {
    const { days = 30 } = req.query; // Số ngày không bán
    
    try {
        const pool = await poolPromise;
        const query = `SELECT 
                        hh.maHang,
                        hh.loaihang as tenHang,
                        hh.soluong as tonKho,
                        hh.ngaynhaphang,
                        MAX(h.ngaylap) as ngayBanCuoiCung,
                        DATEDIFF(DAY, MAX(h.ngaylap), GETDATE()) as soNgayKhongBan
                    FROM HANGHOA hh
                    LEFT JOIN CHITIET_HD cthd ON hh.maHang = cthd.maHang
                    LEFT JOIN HOADON h ON cthd.maHD = h.maHD
                    GROUP BY hh.maHang, hh.loaihang, hh.soluong, hh.ngaynhaphang
                    HAVING MAX(h.ngaylap) IS NULL OR DATEDIFF(DAY, MAX(h.ngaylap), GETDATE()) >= @days
                    ORDER BY soNgayKhongBan DESC, tonKho DESC`;
        
        const result = await pool.request()
            .input('days', sql.Int, parseInt(days))
            .query(query);
        
        res.status(200).json({
            success: true,
            count: result.recordset.length,
            data: result.recordset
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy báo cáo sản phẩm bán chậm',
            error: err.message
        });
    }
});

// ================== BÁO CÁO NHẬP KHO API ==================
app.get('/api/baocao/nhapkho', async (req, res) => {
    const { startDate, endDate } = req.query;
    
    try {
        const pool = await poolPromise;
        let query = `SELECT 
                        pn.maPN,
                        pn.ngaynhap,
                        nv.tenNV as nhanVienPhuTrach,
                        ncc.tenNCC as nhaCungCap,
                        COUNT(DISTINCT ctpn.maHang) as soLoaiHang,
                        SUM(ctpn.soluongnhap) as tongSoLuongNhap
                    FROM PHIEUNHAP pn
                    LEFT JOIN NHANVIEN nv ON pn.maNV = nv.maNV
                    LEFT JOIN NHACUNGCAP ncc ON pn.maNCC = ncc.maNCC
                    LEFT JOIN CHITIETPHIEUNHAP ctpn ON pn.maPN = ctpn.maPN`;
        
        const request = pool.request();
        if (startDate && endDate) {
            query += ` WHERE CAST(pn.ngaynhap AS DATE) BETWEEN @startDate AND @endDate`;
            request.input('startDate', sql.Date, startDate);
            request.input('endDate', sql.Date, endDate);
        }
        
        query += ` GROUP BY pn.maPN, pn.ngaynhap, nv.tenNV, ncc.tenNCC
                   ORDER BY pn.ngaynhap DESC`;
        
        const result = await request.query(query);
        
        res.status(200).json({
            success: true,
            count: result.recordset.length,
            data: result.recordset
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy báo cáo nhập kho',
            error: err.message
        });
    }
});

// Chi tiết phiếu nhập kho
app.get('/api/baocao/nhapkho/:maPN', async (req, res) => {
    const { maPN } = req.params;
    
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('maPN', sql.NVarChar(10), maPN)
            .query(`SELECT 
                        pn.maPN,
                        pn.ngaynhap,
                        nv.tenNV as nhanVienPhuTrach,
                        ncc.tenNCC as nhaCungCap,
                        ctpn.maHang,
                        hh.loaihang as tenHang,
                        ctpn.soluongnhap,
                        hh.donvi
                    FROM PHIEUNHAP pn
                    LEFT JOIN NHANVIEN nv ON pn.maNV = nv.maNV
                    LEFT JOIN NHACUNGCAP ncc ON pn.maNCC = ncc.maNCC
                    LEFT JOIN CHITIETPHIEUNHAP ctpn ON pn.maPN = ctpn.maPN
                    LEFT JOIN HANGHOA hh ON ctpn.maHang = hh.maHang
                    WHERE pn.maPN = @maPN
                    ORDER BY ctpn.maHang`);
        
        res.status(200).json({
            success: true,
            count: result.recordset.length,
            data: result.recordset
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy chi tiết phiếu nhập kho',
            error: err.message
        });
    }
});

// ================== TÌM KIẾM HÓA ĐƠN API ==================
// Tìm kiếm hóa đơn theo mã hoặc tên khách hàng
app.get('/api/hoadon/search', async (req, res) => {
    const { keyword, startDate, endDate } = req.query;
    
    try {
        const pool = await poolPromise;
        let query = `SELECT 
                        h.maHD,
                        h.maNV,
                        h.maKH,
                        h.ngaylap,
                        h.tongtien,
                        h.tiengiamgia,
                        nv.tenNV,
                        kh.tenKH,
                        mgg.code as codeMGG
                    FROM HOADON h
                    LEFT JOIN NHANVIEN nv ON h.maNV = nv.maNV
                    LEFT JOIN KHACHHANG kh ON h.maKH = kh.maKH
                    LEFT JOIN MAGIAMGIA mgg ON h.maMGG = mgg.maMGG
                    WHERE 1=1`;
        
        const request = pool.request();
        
        if (keyword) {
            query += ` AND (h.maHD LIKE @keyword OR kh.tenKH LIKE @keyword)`;
            request.input('keyword', sql.NVarChar(50), `%${keyword}%`);
        }
        
        if (startDate && endDate) {
            query += ` AND CAST(h.ngaylap AS DATE) BETWEEN @startDate AND @endDate`;
            request.input('startDate', sql.Date, startDate);
            request.input('endDate', sql.Date, endDate);
        }
        
        query += ` ORDER BY h.ngaylap DESC`;
        
        const result = await request.query(query);
        
        res.status(200).json({
            success: true,
            count: result.recordset.length,
            data: result.recordset
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tìm kiếm hóa đơn',
            error: err.message
        });
    }
});

// ================== HOME PAGE ==================
app.get('/', (req, res) => {
    res.send(`
        <h2>API FMSTYLE đang chạy!</h2>
        <h3>Danh sách các API endpoints:</h3>
        <ul>
            <li><strong>PHONGBAN:</strong> GET, POST, PUT, DELETE /api/phongban</li>
            <li><strong>VITRI:</strong> GET, POST, PUT, DELETE /api/vitri</li>
            <li><strong>NHACUNGCAP:</strong> GET, POST, PUT, DELETE /api/nhacungcap</li>
            <li><strong>PHANLOAI_KH:</strong> GET, POST, PUT, DELETE /api/phanloaikh</li>
            <li><strong>KHACHHANG:</strong> GET, POST, PUT, DELETE /api/khachhang</li>
            <li><strong>NHANVIEN:</strong> GET, POST, PUT, DELETE /api/nhanvien</li>
            <li><strong>LICHSUTHEODOINV:</strong> GET, POST, PUT, DELETE /api/lichsutheodoinv</li>
            <li><strong>PHIEUTHEODOINV:</strong> GET, POST, PUT, DELETE /api/phieutheodoinv</li>
            <li><strong>HANGHOA:</strong> GET, POST, PUT, DELETE /api/hanghoa</li>
            <li><strong>PHIEUNHAP:</strong> GET, POST, PUT, DELETE /api/phieunhap</li>
            <li><strong>CHITIETPHIEUNHAP:</strong> GET, POST, PUT, DELETE /api/chitietphieunhap</li>
            <li><strong>HOADON:</strong> GET, POST, PUT, DELETE /api/hoadon</li>
            <li><strong>CHITIET_HD:</strong> GET, POST, PUT, DELETE /api/chitiethd</li>
        </ul>
    `);
});

app.listen(PORT, () => {
    console.log(`Server chạy tại http://localhost:${PORT}`);
    console.log(`CORS đã được bật – bạn có thể gọi API từ bất kỳ đâu!`);
});

