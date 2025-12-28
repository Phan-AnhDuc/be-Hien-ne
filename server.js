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
// Lấy ID phân loại khách hàng mặc định (thành viên)
async function getDefaultCustomerTypeId() {
    const pool = await poolPromise;
    const result = await pool.request()
        .query(`SELECT TOP 1 id FROM PHANLOAI_KH WHERE tenPLKH LIKE N'%thành viên%' OR tenPLKH LIKE N'%Thanh vien%' ORDER BY id`);
    
    if (result.recordset.length > 0) {
        return result.recordset[0].id;
    }
    
    // Nếu không có, lấy loại đầu tiên
    const firstResult = await pool.request()
        .query(`SELECT TOP 1 id FROM PHANLOAI_KH ORDER BY id`);
    
    return firstResult.recordset.length > 0 ? firstResult.recordset[0].id : null;
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

        // Lấy user từ DB - Schema mới: USERS JOIN NHANVIEN để lấy maNV
        const userResult = await pool.request()
            .input('username', sql.NVarChar, username)
            .query(`SELECT u.userId, u.username, u.passwordHash, u.role, u.trangthai, n.maNV, n.id as idNV
                    FROM USERS u
                    LEFT JOIN NHANVIEN n ON u.idNV = n.id
                    WHERE u.username = @username`);

        if (userResult.recordset.length === 0) {
            return res.status(401).json({ message: 'Username hoặc password sai' });
        }

        const user = userResult.recordset[0];
        const storedHash = user.passwordHash;

        // So sánh hash (case-insensitive vì SQL Server có thể lưu khác nhau)
        const hashMatch = storedHash && (
            storedHash.toUpperCase() === passwordHash.toUpperCase() ||
            storedHash.toLowerCase() === passwordHash.toLowerCase()
        );

        if (!hashMatch) {
            console.log('Password hash mismatch:', {
                username,
                storedHash: storedHash,
                computedHash: passwordHash,
                storedLength: storedHash ? storedHash.length : 0,
                computedLength: passwordHash.length
            });
            return res.status(401).json({ message: 'Username hoặc password sai' });
        }

        // Kiểm tra trạng thái tài khoản
        if (user.trangthai === 0 || user.trangthai === false) {
            return res.status(403).json({ message: 'Tài khoản đã bị khóa' });
        }

        // Trả về thông tin user và role để frontend điều hướng
        res.json({
            success: true,
            user: {
                userId: user.userId,
                username: user.username,
                role: user.role,
                maNV: user.maNV,
                idNV: user.idNV
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// ================== VITRI APIs ==================
// GET all
app.get('/api/vitri', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query('SELECT id, tenVT FROM VITRI ORDER BY tenVT');

        res.status(200).json({
            success: true,
            count: result.recordset.length,
            data: result.recordset
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy dữ liệu vị trí',
            error: err.message
        });
    }
});

// GET by ID
app.get('/api/vitri/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT id, tenVT FROM VITRI WHERE id = @id');

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
            .input('tenVT', sql.NVarChar(40), tenVT)
            .query('INSERT INTO VITRI (tenVT) OUTPUT INSERTED.id, INSERTED.tenVT VALUES (@tenVT)');

        res.status(201).json({
            success: true,
            message: 'Thêm vị trí thành công',
            data: result.recordset[0]
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
app.put('/api/vitri/:id', async (req, res) => {
    const { id } = req.params;
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
            .input('id', sql.Int, id)
            .input('tenVT', sql.NVarChar(40), tenVT)
            .query('UPDATE VITRI SET tenVT = @tenVT WHERE id = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy vị trí'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật vị trí thành công',
            data: { id: parseInt(id), tenVT }
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
app.delete('/api/vitri/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM VITRI WHERE id = @id');

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

// ================== PHANLOAI_KH APIs ==================
// GET all
app.get('/api/phanloaikh', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query('SELECT id, maPLKH, tenPLKH, nguongChiMin FROM PHANLOAI_KH ORDER BY tenPLKH');

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
app.get('/api/phanloaikh/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT id, maPLKH, tenPLKH, nguongChiMin FROM PHANLOAI_KH WHERE id = @id');

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
    const { maPLKH, tenPLKH, nguongChiMin } = req.body;
    if (!tenPLKH) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin tenPLKH'
        });
    }
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('maPLKH', sql.NVarChar(10), maPLKH || null)
            .input('tenPLKH', sql.NVarChar(40), tenPLKH)
            .input('nguongChiMin', sql.Money, nguongChiMin || 0)
            .query('INSERT INTO PHANLOAI_KH (maPLKH, tenPLKH, nguongChiMin) OUTPUT INSERTED.id, INSERTED.maPLKH, INSERTED.tenPLKH, INSERTED.nguongChiMin VALUES (@maPLKH, @tenPLKH, @nguongChiMin)');

        res.status(201).json({
            success: true,
            message: 'Thêm phân loại khách hàng thành công',
            data: result.recordset[0]
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
app.put('/api/phanloaikh/:id', async (req, res) => {
    const { id } = req.params;
    const { maPLKH, tenPLKH, nguongChiMin } = req.body;
    if (!tenPLKH) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin tenPLKH'
        });
    }
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('maPLKH', sql.NVarChar(10), maPLKH || null)
            .input('tenPLKH', sql.NVarChar(40), tenPLKH)
            .input('nguongChiMin', sql.Money, nguongChiMin || 0)
            .query('UPDATE PHANLOAI_KH SET maPLKH = @maPLKH, tenPLKH = @tenPLKH, nguongChiMin = @nguongChiMin WHERE id = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phân loại khách hàng'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật phân loại khách hàng thành công',
            data: { id: parseInt(id), maPLKH, tenPLKH, nguongChiMin }
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
app.delete('/api/phanloaikh/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM PHANLOAI_KH WHERE id = @id');

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

// ================== PHANLOAI_SANPHAM APIs ==================
// GET all
app.get('/api/phanloaisanpham', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query('SELECT id, maPLSP, tenPLSP FROM PHANLOAI_SANPHAM ORDER BY tenPLSP');

        res.status(200).json({
            success: true,
            count: result.recordset.length,
            data: result.recordset
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy dữ liệu phân loại sản phẩm',
            error: err.message
        });
    }
});

// GET by ID
app.get('/api/phanloaisanpham/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT id, maPLSP, tenPLSP FROM PHANLOAI_SANPHAM WHERE id = @id');

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phân loại sản phẩm'
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
app.post('/api/phanloaisanpham', async (req, res) => {
    const { maPLSP, tenPLSP } = req.body;
    if (!tenPLSP) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin tenPLSP'
        });
    }
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('maPLSP', sql.NVarChar(10), maPLSP || null)
            .input('tenPLSP', sql.NVarChar(40), tenPLSP)
            .query('INSERT INTO PHANLOAI_SANPHAM (maPLSP, tenPLSP) OUTPUT INSERTED.id, INSERTED.maPLSP, INSERTED.tenPLSP VALUES (@maPLSP, @tenPLSP)');

        res.status(201).json({
            success: true,
            message: 'Thêm phân loại sản phẩm thành công',
            data: result.recordset[0]
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm phân loại sản phẩm',
            error: err.message
        });
    }
});

// PUT
app.put('/api/phanloaisanpham/:id', async (req, res) => {
    const { id } = req.params;
    const { maPLSP, tenPLSP } = req.body;
    if (!tenPLSP) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin tenPLSP'
        });
    }
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('maPLSP', sql.NVarChar(10), maPLSP || null)
            .input('tenPLSP', sql.NVarChar(40), tenPLSP)
            .query('UPDATE PHANLOAI_SANPHAM SET maPLSP = @maPLSP, tenPLSP = @tenPLSP WHERE id = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phân loại sản phẩm'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật phân loại sản phẩm thành công',
            data: { id: parseInt(id), maPLSP, tenPLSP }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật phân loại sản phẩm',
            error: err.message
        });
    }
});

// DELETE
app.delete('/api/phanloaisanpham/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM PHANLOAI_SANPHAM WHERE id = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phân loại sản phẩm'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Xóa phân loại sản phẩm thành công'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa phân loại sản phẩm',
            error: err.message
        });
    }
});

// ================== KHUYENMAI APIs ==================
// GET all
app.get('/api/khuyenmai', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query('SELECT id, maKM, tenKM, phantramGiam, ngayBD, ngayKT, trangthai FROM KHUYENMAI ORDER BY ngayBD DESC');

        res.status(200).json({
            success: true,
            count: result.recordset.length,
            data: result.recordset
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy dữ liệu khuyến mãi',
            error: err.message
        });
    }
});

// GET by ID
app.get('/api/khuyenmai/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT id, maKM, tenKM, phantramGiam, ngayBD, ngayKT, trangthai FROM KHUYENMAI WHERE id = @id');

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khuyến mãi'
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
app.post('/api/khuyenmai', async (req, res) => {
    const { maKM, tenKM, phantramGiam, ngayBD, ngayKT } = req.body;
    if (!maKM || phantramGiam === undefined) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin bắt buộc: maKM, phantramGiam'
        });
    }
    if (phantramGiam < 0 || phantramGiam > 100) {
        return res.status(400).json({
            success: false,
            message: 'Phần trăm giảm giá phải từ 0 đến 100'
        });
    }
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('maKM', sql.NVarChar(20), maKM)
            .input('tenKM', sql.NVarChar(100), tenKM || null)
            .input('phantramGiam', sql.Int, phantramGiam)
            .input('ngayBD', sql.Date, ngayBD || null)
            .input('ngayKT', sql.Date, ngayKT || null)
            .query('INSERT INTO KHUYENMAI (maKM, tenKM, phantramGiam, ngayBD, ngayKT) OUTPUT INSERTED.id, INSERTED.maKM, INSERTED.tenKM, INSERTED.phantramGiam, INSERTED.ngayBD, INSERTED.ngayKT, INSERTED.trangthai VALUES (@maKM, @tenKM, @phantramGiam, @ngayBD, @ngayKT)');

        res.status(201).json({
            success: true,
            message: 'Thêm khuyến mãi thành công',
            data: result.recordset[0]
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm khuyến mãi',
            error: err.message
        });
    }
});

// PUT
app.put('/api/khuyenmai/:id', async (req, res) => {
    const { id } = req.params;
    const { maKM, tenKM, phantramGiam, ngayBD, ngayKT } = req.body;
    if (!maKM || phantramGiam === undefined) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin bắt buộc: maKM, phantramGiam'
        });
    }
    if (phantramGiam < 0 || phantramGiam > 100) {
        return res.status(400).json({
            success: false,
            message: 'Phần trăm giảm giá phải từ 0 đến 100'
        });
    }
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('maKM', sql.NVarChar(20), maKM)
            .input('tenKM', sql.NVarChar(100), tenKM || null)
            .input('phantramGiam', sql.Int, phantramGiam)
            .input('ngayBD', sql.Date, ngayBD || null)
            .input('ngayKT', sql.Date, ngayKT || null)
            .query('UPDATE KHUYENMAI SET maKM = @maKM, tenKM = @tenKM, phantramGiam = @phantramGiam, ngayBD = @ngayBD, ngayKT = @ngayKT WHERE id = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khuyến mãi'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật khuyến mãi thành công',
            data: { id: parseInt(id), maKM, tenKM, phantramGiam, ngayBD, ngayKT }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật khuyến mãi',
            error: err.message
        });
    }
});

// DELETE
app.delete('/api/khuyenmai/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM KHUYENMAI WHERE id = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khuyến mãi'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Xóa khuyến mãi thành công'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa khuyến mãi',
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
            .query(`SELECT n.id, n.maNV, n.tenNV, n.gioitinh, n.sdt, n.idVT, n.trangthai, v.tenVT
                    FROM NHANVIEN n
                    LEFT JOIN VITRI v ON n.idVT = v.id
                    ORDER BY n.tenNV`);

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
app.get('/api/nhanvien/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`SELECT n.id, n.maNV, n.tenNV, n.gioitinh, n.sdt, n.idVT, n.trangthai, v.tenVT
                    FROM NHANVIEN n
                    LEFT JOIN VITRI v ON n.idVT = v.id
                    WHERE n.id = @id`);

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

// POST
app.post('/api/nhanvien', async (req, res) => {
    const { tenNV, gioitinh, sdt, idVT } = req.body;
    if (!tenNV || !idVT) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin bắt buộc: tenNV, idVT'
        });
    }
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('tenNV', sql.NVarChar(40), tenNV)
            .input('gioitinh', sql.NVarChar(3), gioitinh || null)
            .input('sdt', sql.VarChar(10), sdt || null)
            .input('idVT', sql.Int, idVT)
            .query('INSERT INTO NHANVIEN (tenNV, gioitinh, sdt, idVT) OUTPUT INSERTED.id, INSERTED.maNV, INSERTED.tenNV, INSERTED.gioitinh, INSERTED.sdt, INSERTED.idVT, INSERTED.trangthai VALUES (@tenNV, @gioitinh, @sdt, @idVT)');

        res.status(201).json({
            success: true,
            message: 'Thêm nhân viên thành công',
            data: result.recordset[0]
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm nhân viên',
            error: err.message
        });
    }
});

// PUT
app.put('/api/nhanvien/:id', async (req, res) => {
    const { id } = req.params;
    const { tenNV, gioitinh, sdt, idVT } = req.body;
    if (!tenNV || !idVT) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin bắt buộc: tenNV, idVT'
        });
    }
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('tenNV', sql.NVarChar(40), tenNV)
            .input('gioitinh', sql.NVarChar(3), gioitinh || null)
            .input('sdt', sql.VarChar(10), sdt || null)
            .input('idVT', sql.Int, idVT)
            .query('UPDATE NHANVIEN SET tenNV = @tenNV, gioitinh = @gioitinh, sdt = @sdt, idVT = @idVT WHERE id = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhân viên'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật nhân viên thành công',
            data: { id: parseInt(id), tenNV, gioitinh, sdt, idVT }
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
app.delete('/api/nhanvien/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM NHANVIEN WHERE id = @id');

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

// ================== KHACHHANG APIs ==================
// GET all
app.get('/api/khachhang', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query(`SELECT k.id, k.maKH, k.tenKH, k.sdt, k.diachi, k.idPLKH, k.diemtichluy, k.tongchi, p.tenPLKH
                    FROM KHACHHANG k
                    LEFT JOIN PHANLOAI_KH p ON k.idPLKH = p.id
                    ORDER BY k.tenKH`);

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
app.get('/api/khachhang/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`SELECT k.id, k.maKH, k.tenKH, k.sdt, k.diachi, k.idPLKH, k.diemtichluy, k.tongchi, p.tenPLKH
                    FROM KHACHHANG k
                    LEFT JOIN PHANLOAI_KH p ON k.idPLKH = p.id
                    WHERE k.id = @id`);

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

// POST
app.post('/api/khachhang', async (req, res) => {
    const { tenKH, sdt, diachi, idPLKH } = req.body;
    if (!tenKH) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin tenKH'
        });
    }
    try {
        const pool = await poolPromise;
        
        // Mặc định là thành viên nếu không có idPLKH
        let finalIdPLKH = idPLKH;
        if (!finalIdPLKH) {
            finalIdPLKH = await getDefaultCustomerTypeId();
            if (!finalIdPLKH) {
                return res.status(400).json({
                    success: false,
                    message: 'Không tìm thấy phân loại khách hàng mặc định'
                });
            }
        }
        
        const result = await pool.request()
            .input('tenKH', sql.NVarChar(40), tenKH)
            .input('sdt', sql.VarChar(10), sdt || null)
            .input('diachi', sql.NVarChar(100), diachi || null)
            .input('idPLKH', sql.Int, finalIdPLKH)
            .query('INSERT INTO KHACHHANG (tenKH, sdt, diachi, idPLKH) OUTPUT INSERTED.id, INSERTED.maKH, INSERTED.tenKH, INSERTED.sdt, INSERTED.diachi, INSERTED.idPLKH, INSERTED.diemtichluy, INSERTED.tongchi VALUES (@tenKH, @sdt, @diachi, @idPLKH)');

        res.status(201).json({
            success: true,
            message: 'Thêm khách hàng thành công',
            data: result.recordset[0]
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
app.put('/api/khachhang/:id', async (req, res) => {
    const { id } = req.params;
    const { tenKH, sdt, diachi, idPLKH } = req.body;
    if (!tenKH || !idPLKH) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin tenKH hoặc idPLKH'
        });
    }
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('tenKH', sql.NVarChar(40), tenKH)
            .input('sdt', sql.VarChar(10), sdt || null)
            .input('diachi', sql.NVarChar(100), diachi || null)
            .input('idPLKH', sql.Int, idPLKH)
            .query('UPDATE KHACHHANG SET tenKH = @tenKH, sdt = @sdt, diachi = @diachi, idPLKH = @idPLKH WHERE id = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khách hàng'
            });
        }

        // Lấy lại thông tin khách hàng sau khi cập nhật
        const updatedResult = await pool.request()
            .input('id', sql.Int, id)
            .query(`SELECT k.id, k.maKH, k.tenKH, k.sdt, k.diachi, k.idPLKH, k.diemtichluy, k.tongchi, p.tenPLKH
                    FROM KHACHHANG k
                    LEFT JOIN PHANLOAI_KH p ON k.idPLKH = p.id
                    WHERE k.id = @id`);

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
app.delete('/api/khachhang/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM KHACHHANG WHERE id = @id');

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

// ================== HANGHOA APIs ==================
// GET all
app.get('/api/hanghoa', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query(`SELECT h.id, h.maHang, h.tenHang, h.idPLSP, h.soluong, h.gianhap, h.giaban, h.tonKhoToiThieu, h.ngayNhapCuoi, p.tenPLSP
                    FROM HANGHOA h
                    LEFT JOIN PHANLOAI_SANPHAM p ON h.idPLSP = p.id
                    ORDER BY h.tenHang`);

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
app.get('/api/hanghoa/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`SELECT h.id, h.maHang, h.tenHang, h.idPLSP, h.soluong, h.gianhap, h.giaban, h.tonKhoToiThieu, h.ngayNhapCuoi, p.tenPLSP
                    FROM HANGHOA h
                    LEFT JOIN PHANLOAI_SANPHAM p ON h.idPLSP = p.id
                    WHERE h.id = @id`);

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
    const { tenHang, idPLSP, soluong, gianhap, giaban, tonKhoToiThieu } = req.body;
    if (!tenHang || !idPLSP) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin bắt buộc: tenHang, idPLSP'
        });
    }
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('tenHang', sql.NVarChar(100), tenHang)
            .input('idPLSP', sql.Int, idPLSP)
            .input('soluong', sql.Int, soluong || 0)
            .input('gianhap', sql.Money, gianhap || null)
            .input('giaban', sql.Money, giaban || null)
            .input('tonKhoToiThieu', sql.Int, tonKhoToiThieu || 10)
            .query('INSERT INTO HANGHOA (tenHang, idPLSP, soluong, gianhap, giaban, tonKhoToiThieu) OUTPUT INSERTED.id, INSERTED.maHang, INSERTED.tenHang, INSERTED.idPLSP, INSERTED.soluong, INSERTED.gianhap, INSERTED.giaban, INSERTED.tonKhoToiThieu, INSERTED.ngayNhapCuoi VALUES (@tenHang, @idPLSP, @soluong, @gianhap, @giaban, @tonKhoToiThieu)');

        res.status(201).json({
            success: true,
            message: 'Thêm hàng hóa thành công',
            data: result.recordset[0]
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
app.put('/api/hanghoa/:id', async (req, res) => {
    const { id } = req.params;
    const { tenHang, idPLSP, soluong, gianhap, giaban, tonKhoToiThieu } = req.body;
    if (!tenHang || !idPLSP) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin bắt buộc: tenHang, idPLSP'
        });
    }
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('tenHang', sql.NVarChar(100), tenHang)
            .input('idPLSP', sql.Int, idPLSP)
            .input('soluong', sql.Int, soluong !== undefined ? soluong : null)
            .input('gianhap', sql.Money, gianhap || null)
            .input('giaban', sql.Money, giaban || null)
            .input('tonKhoToiThieu', sql.Int, tonKhoToiThieu || 10)
            .query('UPDATE HANGHOA SET tenHang = @tenHang, idPLSP = @idPLSP, soluong = COALESCE(@soluong, soluong), gianhap = @gianhap, giaban = @giaban, tonKhoToiThieu = @tonKhoToiThieu WHERE id = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hàng hóa'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật hàng hóa thành công',
            data: { id: parseInt(id), tenHang, idPLSP, soluong, gianhap, giaban, tonKhoToiThieu }
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
app.delete('/api/hanghoa/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM HANGHOA WHERE id = @id');

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

// ================== HOADON APIs ==================
// GET all
app.get('/api/hoadon', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query(`SELECT h.id, h.maHD, h.ngayLap, h.idNV, h.idKH, h.idKM, h.tongTien, h.loaiGiaoDich,
                    nv.maNV, nv.tenNV as tenNhanVien,
                    kh.maKH, kh.tenKH as tenKhachHang,
                    km.maKM, km.tenKM as tenKhuyenMai
                    FROM HOADON h
                    LEFT JOIN NHANVIEN nv ON h.idNV = nv.id
                    LEFT JOIN KHACHHANG kh ON h.idKH = kh.id
                    LEFT JOIN KHUYENMAI km ON h.idKM = km.id
                    ORDER BY h.ngayLap DESC`);

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
app.get('/api/hoadon/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`SELECT h.id, h.maHD, h.ngayLap, h.idNV, h.idKH, h.idKM, h.tongTien, h.loaiGiaoDich,
                    nv.maNV, nv.tenNV as tenNhanVien,
                    kh.maKH, kh.tenKH as tenKhachHang,
                    km.maKM, km.tenKM as tenKhuyenMai, km.phantramGiam
                    FROM HOADON h
                    LEFT JOIN NHANVIEN nv ON h.idNV = nv.id
                    LEFT JOIN KHACHHANG kh ON h.idKH = kh.id
                    LEFT JOIN KHUYENMAI km ON h.idKM = km.id
                    WHERE h.id = @id`);

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

// POST
app.post('/api/hoadon', async (req, res) => {
    const { idNV, idKH, idKM, loaiGiaoDich } = req.body;
    if (!idNV || !idKH) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin bắt buộc: idNV, idKH'
        });
    }
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('idNV', sql.Int, idNV)
            .input('idKH', sql.Int, idKH)
            .input('idKM', sql.Int, idKM || null)
            .input('loaiGiaoDich', sql.NVarChar(20), loaiGiaoDich || 'Bán hàng')
            .query('INSERT INTO HOADON (idNV, idKH, idKM, loaiGiaoDich) OUTPUT INSERTED.id, INSERTED.maHD, INSERTED.ngayLap, INSERTED.idNV, INSERTED.idKH, INSERTED.idKM, INSERTED.tongTien, INSERTED.loaiGiaoDich VALUES (@idNV, @idKH, @idKM, @loaiGiaoDich)');

        res.status(201).json({
            success: true,
            message: 'Thêm hóa đơn thành công',
            data: result.recordset[0]
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
app.put('/api/hoadon/:id', async (req, res) => {
    const { id } = req.params;
    const { idNV, idKH, idKM, loaiGiaoDich } = req.body;
    if (!idNV || !idKH) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin bắt buộc: idNV, idKH'
        });
    }
    try {
        const pool = await poolPromise;
        
        // Tính lại tổng tiền từ chi tiết
        const totalResult = await pool.request()
            .input('idHD', sql.Int, id)
            .query('SELECT SUM(thanhTien) as tongTien FROM CHITIET_HD WHERE idHD = @idHD');
        
        const tongTien = totalResult.recordset[0].tongTien || 0;
        
        // Áp dụng khuyến mãi nếu có
        let finalTongTien = tongTien;
        if (idKM) {
            const kmResult = await pool.request()
                .input('idKM', sql.Int, idKM)
                .query('SELECT phantramGiam FROM KHUYENMAI WHERE id = @idKM');
            
            if (kmResult.recordset.length > 0) {
                const phantramGiam = kmResult.recordset[0].phantramGiam;
                finalTongTien = tongTien * (1 - phantramGiam / 100);
            }
        }
        
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('idNV', sql.Int, idNV)
            .input('idKH', sql.Int, idKH)
            .input('idKM', sql.Int, idKM || null)
            .input('tongTien', sql.Money, finalTongTien)
            .input('loaiGiaoDich', sql.NVarChar(20), loaiGiaoDich || 'Bán hàng')
            .query('UPDATE HOADON SET idNV = @idNV, idKH = @idKH, idKM = @idKM, tongTien = @tongTien, loaiGiaoDich = @loaiGiaoDich WHERE id = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hóa đơn'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật hóa đơn thành công',
            data: { id: parseInt(id), idNV, idKH, idKM, tongTien: finalTongTien, loaiGiaoDich }
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
app.delete('/api/hoadon/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM HOADON WHERE id = @id');

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
            .query(`SELECT c.idHD, c.idHang, c.soluong, c.dongia, c.thanhTien,
                    h.maHD, hh.maHang, hh.tenHang
                    FROM CHITIET_HD c
                    LEFT JOIN HOADON h ON c.idHD = h.id
                    LEFT JOIN HANGHOA hh ON c.idHang = hh.id`);

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
app.get('/api/chitiethd/:idHD/:idHang', async (req, res) => {
    const { idHD, idHang } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('idHD', sql.Int, idHD)
            .input('idHang', sql.Int, idHang)
            .query(`SELECT c.idHD, c.idHang, c.soluong, c.dongia, c.thanhTien,
                    h.maHD, hh.maHang, hh.tenHang
                    FROM CHITIET_HD c
                    LEFT JOIN HOADON h ON c.idHD = h.id
                    LEFT JOIN HANGHOA hh ON c.idHang = hh.id
                    WHERE c.idHD = @idHD AND c.idHang = @idHang`);

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

// GET by idHD
app.get('/api/chitiethd/:idHD', async (req, res) => {
    const { idHD } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('idHD', sql.Int, idHD)
            .query(`SELECT c.idHD, c.idHang, c.soluong, c.dongia, c.thanhTien,
                    h.maHD, hh.maHang, hh.tenHang
                    FROM CHITIET_HD c
                    LEFT JOIN HOADON h ON c.idHD = h.id
                    LEFT JOIN HANGHOA hh ON c.idHang = hh.id
                    WHERE c.idHD = @idHD`);

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

// POST - Trigger sẽ tự động trừ kho và tích điểm
app.post('/api/chitiethd', async (req, res) => {
    const { idHD, idHang, soluong, dongia } = req.body;
    if (!idHD || !idHang || soluong === undefined || dongia === undefined) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin bắt buộc: idHD, idHang, soluong, dongia'
        });
    }
    try {
        const pool = await poolPromise;
        
        // Kiểm tra tồn kho
        const stockResult = await pool.request()
            .input('idHang', sql.Int, idHang)
            .query('SELECT soluong FROM HANGHOA WHERE id = @idHang');
        
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
        
        // Thêm chi tiết hóa đơn (trigger sẽ tự động trừ kho và tích điểm)
        // Không dùng OUTPUT vì bảng có trigger, phải query lại sau khi insert
        await pool.request()
            .input('idHD', sql.Int, idHD)
            .input('idHang', sql.Int, idHang)
            .input('soluong', sql.Int, soluong)
            .input('dongia', sql.Money, dongia)
            .query('INSERT INTO CHITIET_HD (idHD, idHang, soluong, dongia) VALUES (@idHD, @idHang, @soluong, @dongia)');

        // Query lại để lấy dữ liệu vừa insert (bao gồm thanhTien được tính tự động)
        const result = await pool.request()
            .input('idHD', sql.Int, idHD)
            .input('idHang', sql.Int, idHang)
            .query('SELECT idHD, idHang, soluong, dongia, thanhTien FROM CHITIET_HD WHERE idHD = @idHD AND idHang = @idHang');

        // Cập nhật tổng tiền hóa đơn
        await recalculateInvoiceTotal(idHD);

        res.status(201).json({
            success: true,
            message: 'Thêm chi tiết hóa đơn thành công',
            data: result.recordset[0]
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm chi tiết hóa đơn',
            error: err.message
        });
    }
});

// PUT
app.put('/api/chitiethd/:idHD/:idHang', async (req, res) => {
    const { idHD, idHang } = req.params;
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
            .input('idHD', sql.Int, idHD)
            .input('idHang', sql.Int, idHang)
            .query('SELECT soluong FROM CHITIET_HD WHERE idHD = @idHD AND idHang = @idHang');
        
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
                .input('idHang', sql.Int, idHang)
                .query('SELECT soluong FROM HANGHOA WHERE id = @idHang');
            
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
            
            // Trừ thêm kho
            await pool.request()
                .input('idHang', sql.Int, idHang)
                .input('soluong', sql.Int, diffSoluong)
                .query('UPDATE HANGHOA SET soluong = soluong - @soluong WHERE id = @idHang');
        } else if (diffSoluong < 0) {
            // Cộng lại kho nếu giảm số lượng
            await pool.request()
                .input('idHang', sql.Int, idHang)
                .input('soluong', sql.Int, -diffSoluong)
                .query('UPDATE HANGHOA SET soluong = soluong + @soluong WHERE id = @idHang');
        }
        
        const result = await pool.request()
            .input('idHD', sql.Int, idHD)
            .input('idHang', sql.Int, idHang)
            .input('soluong', sql.Int, soluong)
            .input('dongia', sql.Money, dongia)
            .query('UPDATE CHITIET_HD SET soluong = @soluong, dongia = @dongia WHERE idHD = @idHD AND idHang = @idHang');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy chi tiết hóa đơn'
            });
        }

        // Cập nhật tổng tiền hóa đơn
        await recalculateInvoiceTotal(idHD);

        res.status(200).json({
            success: true,
            message: 'Cập nhật chi tiết hóa đơn thành công',
            data: { idHD: parseInt(idHD), idHang: parseInt(idHang), soluong, dongia }
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
app.delete('/api/chitiethd/:idHD/:idHang', async (req, res) => {
    const { idHD, idHang } = req.params;
    try {
        const pool = await poolPromise;
        
        // Lấy số lượng trước khi xóa
        const detailResult = await pool.request()
            .input('idHD', sql.Int, idHD)
            .input('idHang', sql.Int, idHang)
            .query('SELECT soluong FROM CHITIET_HD WHERE idHD = @idHD AND idHang = @idHang');
        
        if (detailResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy chi tiết hóa đơn'
            });
        }
        
        const soluong = detailResult.recordset[0].soluong;
        
        // Xóa chi tiết
        const result = await pool.request()
            .input('idHD', sql.Int, idHD)
            .input('idHang', sql.Int, idHang)
            .query('DELETE FROM CHITIET_HD WHERE idHD = @idHD AND idHang = @idHang');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy chi tiết hóa đơn'
            });
        }

        // Cộng lại hàng vào kho
        await pool.request()
            .input('idHang', sql.Int, idHang)
            .input('soluong', sql.Int, soluong)
            .query('UPDATE HANGHOA SET soluong = soluong + @soluong WHERE id = @idHang');

        // Cập nhật tổng tiền hóa đơn
        await recalculateInvoiceTotal(idHD);

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
async function recalculateInvoiceTotal(idHD) {
    const pool = await poolPromise;
    
    // Calculate total from invoice details
    const totalResult = await pool.request()
        .input('idHD', sql.Int, idHD)
        .query('SELECT SUM(thanhTien) as tongTien FROM CHITIET_HD WHERE idHD = @idHD');
    
    const tongTien = totalResult.recordset[0].tongTien || 0;
    
    // Get invoice discount
    const invoiceResult = await pool.request()
        .input('idHD', sql.Int, idHD)
        .query('SELECT idKM FROM HOADON WHERE id = @idHD');
    
    let finalTongTien = tongTien;
    if (invoiceResult.recordset.length > 0 && invoiceResult.recordset[0].idKM) {
        const idKM = invoiceResult.recordset[0].idKM;
        const kmResult = await pool.request()
            .input('idKM', sql.Int, idKM)
            .query('SELECT phantramGiam FROM KHUYENMAI WHERE id = @idKM');
        
        if (kmResult.recordset.length > 0) {
            const phantramGiam = kmResult.recordset[0].phantramGiam;
            finalTongTien = tongTien * (1 - phantramGiam / 100);
        }
    }
    
    // Update invoice total
    await pool.request()
        .input('idHD', sql.Int, idHD)
        .input('tongTien', sql.Money, finalTongTien)
        .query('UPDATE HOADON SET tongTien = @tongTien WHERE id = @idHD');
}

// ================== HOME PAGE ==================
app.get('/', (req, res) => {
    res.send(`
        <h2>API FMSTYLE đang chạy!</h2>
        <h3>Danh sách các API endpoints:</h3>
        <ul>
            <li><strong>LOGIN:</strong> POST /api/login</li>
            <li><strong>VITRI:</strong> GET, POST, PUT, DELETE /api/vitri</li>
            <li><strong>PHANLOAI_KH:</strong> GET, POST, PUT, DELETE /api/phanloaikh</li>
            <li><strong>PHANLOAI_SANPHAM:</strong> GET, POST, PUT, DELETE /api/phanloaisanpham</li>
            <li><strong>KHUYENMAI:</strong> GET, POST, PUT, DELETE /api/khuyenmai</li>
            <li><strong>NHANVIEN:</strong> GET, POST, PUT, DELETE /api/nhanvien</li>
            <li><strong>KHACHHANG:</strong> GET, POST, PUT, DELETE /api/khachhang</li>
            <li><strong>HANGHOA:</strong> GET, POST, PUT, DELETE /api/hanghoa</li>
            <li><strong>HOADON:</strong> GET, POST, PUT, DELETE /api/hoadon</li>
            <li><strong>CHITIET_HD:</strong> GET, POST, PUT, DELETE /api/chitiethd</li>
        </ul>
    `);
});

app.listen(PORT, () => {
    console.log(`Server chạy tại http://localhost:${PORT}`);
    console.log(`CORS đã được bật – bạn có thể gọi API từ bất kỳ đâu!`);
});
