CREATE DATABASE HeThongQuanLyCuaHang_FMSTYLE;
GO
USE HeThongQuanLyCuaHang_FMSTYLE;
GO

-- =============================================
-- 1. BẢNG DANH MỤC GỐC
-- =============================================

CREATE TABLE VITRI (
    id INT IDENTITY(1,1) PRIMARY KEY,
    tenVT NVARCHAR(40) NOT NULL
);

CREATE TABLE PHANLOAI_KH(
    id INT IDENTITY(1,1) PRIMARY KEY,
    maPLKH NVARCHAR(10) UNIQUE, -- 'LE', 'THANHVIEN', 'VIP'
    tenPLKH NVARCHAR(40) NOT NULL,
    nguongChiMin MONEY DEFAULT 0
);

CREATE TABLE PHANLOAI_SANPHAM(
    id INT IDENTITY(1,1) PRIMARY KEY,
    maPLSP NVARCHAR(10) UNIQUE, -- 'NAM', 'NU', 'PK'
    tenPLSP NVARCHAR(40) NOT NULL
);

CREATE TABLE KHUYENMAI(
    id INT IDENTITY(1,1) PRIMARY KEY,
    maKM NVARCHAR(20) UNIQUE,
    tenKM NVARCHAR(100),
    phantramGiam INT CHECK(phantramGiam BETWEEN 0 AND 100),
    ngayBD DATE,
    ngayKT DATE,
    trangthai AS (CASE WHEN GETDATE() BETWEEN ngayBD AND ngayKT THEN 1 ELSE 0 END)
);

-- =============================================
-- 2. NHÂN VIÊN & TÀI KHOẢN
-- =============================================

CREATE TABLE NHANVIEN(
    id INT IDENTITY(1,1) PRIMARY KEY, -- Dùng ID này làm Khóa chính để liên kết
    maNV AS ('NV' + RIGHT('000' + CAST(id AS VARCHAR(5)), 5)) PERSISTED, 
    tenNV NVARCHAR(40) NOT NULL,
    gioitinh NVARCHAR(3) CHECK(gioitinh IN (N'Nam', N'Nữ')), 
    sdt VARCHAR(10),
    idVT INT NOT NULL,
    trangthai BIT DEFAULT 1,
    CONSTRAINT fk_NV_VT FOREIGN KEY(idVT) REFERENCES VITRI(id)
);

CREATE TABLE USERS (
    userId INT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(50) NOT NULL UNIQUE,         -- Tên đăng nhập
    passwordHash VARCHAR(64) NOT NULL,            -- Mật khẩu mã hóa SHA2_256
    role NVARCHAR(20) NOT NULL CHECK (role IN ('admin', 'user', 'seller', 'warehouse')), 
    idNV INT NULL,                                -- FK trỏ đến id (INT) của NHANVIEN
    trangthai BIT DEFAULT 1,                       -- 1: Hoạt động, 0: Khóa
    ngaytao DATETIME DEFAULT GETDATE(),

    CONSTRAINT fk_USERS_NV FOREIGN KEY (idNV)
        REFERENCES NHANVIEN(id)                   -- Ràng buộc với cột id (INT)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- =============================================
-- 3. KHÁCH HÀNG & HÀNG HÓA
-- =============================================

CREATE TABLE KHACHHANG(
    id INT IDENTITY(1,1) PRIMARY KEY,
    maKH AS ('KH' + RIGHT('000' + CAST(id AS VARCHAR(5)), 5)) PERSISTED,
    tenKH NVARCHAR(40) NOT NULL,
    sdt VARCHAR(10) UNIQUE,
    diachi NVARCHAR(100),
    idPLKH INT NOT NULL,
    diemtichluy INT DEFAULT 0,
    tongchi MONEY DEFAULT 0,
    CONSTRAINT fk_KH_PLKH FOREIGN KEY (idPLKH) REFERENCES PHANLOAI_KH(id)
);

CREATE TABLE HANGHOA(
    id INT IDENTITY(1,1) PRIMARY KEY,
    maHang AS ('SP' + RIGHT('000' + CAST(id AS VARCHAR(5)), 5)) PERSISTED,
    tenHang NVARCHAR(100) NOT NULL,
    idPLSP INT NOT NULL,
    soluong INT DEFAULT 0 CHECK(soluong >= 0),
    gianhap MONEY,
    giaban MONEY,
    tonKhoToiThieu INT DEFAULT 10,
    ngayNhapCuoi DATE DEFAULT GETDATE(),
    CONSTRAINT fk_HH_PLSP FOREIGN KEY(idPLSP) REFERENCES PHANLOAI_SANPHAM(id)
);

-- =============================================
-- 4. HÓA ĐƠN & PHIẾU NHẬP
-- =============================================

CREATE TABLE HOADON(
    id INT IDENTITY(1,1) PRIMARY KEY,
    maHD AS ('HD' + RIGHT('000' + CAST(id AS VARCHAR(5)), 5)) PERSISTED,
    ngayLap DATETIME DEFAULT GETDATE(),
    idNV INT NOT NULL, -- Liên kết id nhân viên
    idKH INT NOT NULL, -- Liên kết id khách hàng
    idKM INT NULL,     -- Liên kết id khuyến mãi
    tongTien MONEY DEFAULT 0,
    loaiGiaoDich NVARCHAR(20) DEFAULT N'Bán hàng',
    CONSTRAINT fk_HD_NV FOREIGN KEY(idNV) REFERENCES NHANVIEN(id),
    CONSTRAINT fk_HD_KH FOREIGN KEY(idKH) REFERENCES KHACHHANG(id),
    CONSTRAINT fk_HD_KM FOREIGN KEY(idKM) REFERENCES KHUYENMAI(id)
);

CREATE TABLE CHITIET_HD(
    idHD INT NOT NULL,
    idHang INT NOT NULL,
    soluong INT NOT NULL,
    dongia MONEY,
    thanhTien AS (soluong * dongia) PERSISTED,
    PRIMARY KEY (idHD, idHang),
    CONSTRAINT fk_CTHD_HD FOREIGN KEY(idHD) REFERENCES HOADON(id),
    CONSTRAINT fk_CTHD_HH FOREIGN KEY(idHang) REFERENCES HANGHOA(id)
);

GO
-- =============================================
-- 5. TRIGGER TỰ ĐỘNG CẬP NHẬT KHO
-- =============================================

CREATE OR ALTER TRIGGER trg_CapNhatKhoSauBanHang
ON CHITIET_HD
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    -- Trừ kho
    UPDATE HANGHOA SET soluong = HANGHOA.soluong - i.soluong
    FROM HANGHOA JOIN inserted i ON HANGHOA.id = i.idHang;

    -- Tích điểm cho khách
    UPDATE KHACHHANG SET tongchi = tongchi + i.thanhTien,
                         diemtichluy = diemtichluy + (CAST(i.thanhTien AS INT) / 100000)
    FROM KHACHHANG 
    JOIN HOADON h ON KHACHHANG.id = h.idKH
    JOIN inserted i ON h.id = i.idHD;
END;
GO