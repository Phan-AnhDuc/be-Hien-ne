-- =============================================
-- CẬP NHẬT BẢNG PHIẾU NHẬP ĐỂ THÊM NHÀ CUNG CẤP
-- =============================================

USE HeThongQuanLyCuaHang_FMSTYLE;
GO

-- Bước 1: Tạo bảng NHACUNGCAP (nếu chưa có)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'NHACUNGCAP')
BEGIN
    CREATE TABLE NHACUNGCAP(
        id INT IDENTITY(1,1) PRIMARY KEY,
        maNCC AS ('NCC' + RIGHT('000' + CAST(id AS VARCHAR(5)), 5)) PERSISTED,
        tenNCC NVARCHAR(100) NOT NULL,
        sdt VARCHAR(15),
        email NVARCHAR(100),
        diachi NVARCHAR(200),
        ghiChu NVARCHAR(500),
        trangthai BIT DEFAULT 1, -- 1: Hoạt động, 0: Ngừng hợp tác
        ngayTao DATETIME DEFAULT GETDATE()
    );
    PRINT 'Đã tạo bảng NHACUNGCAP';
END
ELSE
BEGIN
    PRINT 'Bảng NHACUNGCAP đã tồn tại';
END
GO

-- Bước 2: Kiểm tra và thêm cột idNCC vào bảng PHIEUNHAP (nếu chưa có)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PHIEUNHAP') AND name = 'idNCC')
BEGIN
    ALTER TABLE PHIEUNHAP
    ADD idNCC INT NULL;
    PRINT 'Đã thêm cột idNCC vào bảng PHIEUNHAP';
END
ELSE
BEGIN
    PRINT 'Cột idNCC đã tồn tại trong bảng PHIEUNHAP';
END
GO

-- Bước 3: Kiểm tra và thêm foreign key constraint (nếu chưa có)
IF NOT EXISTS (
    SELECT * FROM sys.foreign_keys 
    WHERE name = 'fk_PN_NCC' 
    AND parent_object_id = OBJECT_ID('PHIEUNHAP')
)
BEGIN
    ALTER TABLE PHIEUNHAP
    ADD CONSTRAINT fk_PN_NCC FOREIGN KEY(idNCC) REFERENCES NHACUNGCAP(id);
    PRINT 'Đã thêm foreign key constraint fk_PN_NCC';
END
ELSE
BEGIN
    PRINT 'Foreign key constraint fk_PN_NCC đã tồn tại';
END
GO

-- Bước 4: Tạo index để tối ưu truy vấn (nếu chưa có)
IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'idx_PN_NCC' 
    AND object_id = OBJECT_ID('PHIEUNHAP')
)
BEGIN
    CREATE INDEX idx_PN_NCC ON PHIEUNHAP(idNCC);
    PRINT 'Đã tạo index idx_PN_NCC';
END
ELSE
BEGIN
    PRINT 'Index idx_PN_NCC đã tồn tại';
END
GO

PRINT 'Hoàn tất cập nhật!';
GO

