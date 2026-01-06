-- =============================================
-- TẠO BẢNG LỊCH SỬ HOẠT ĐỘNG
-- =============================================

USE HeThongQuanLyCuaHang_FMSTYLE;
GO

CREATE TABLE LICHSU_HOATDONG (
    id INT IDENTITY(1,1) PRIMARY KEY,
    idNV INT NOT NULL, -- Nhân viên thực hiện
    loaiHoatDong NVARCHAR(50) NOT NULL, -- 'Tạo hóa đơn', 'Tạo phiếu nhập', 'Sửa hóa đơn', 'Xóa hóa đơn', 'Sửa phiếu nhập', 'Tạo khách hàng', 'Sửa khách hàng', 'Tạo hàng hóa', 'Sửa hàng hóa', v.v.
    moTa NVARCHAR(500), -- Mô tả chi tiết: "Tạo hóa đơn HD00001 với tổng tiền 500,000đ"
    thamChieu NVARCHAR(50), -- Mã tham chiếu: maHD, maPN, maKH, maHang, v.v.
    idThamChieu INT NULL, -- ID tham chiếu: idHD, idPN, idKH, idHang, v.v.
    thoiGian DATETIME DEFAULT GETDATE(),
    CONSTRAINT fk_LSHD_NV FOREIGN KEY(idNV) REFERENCES NHANVIEN(id)
);
GO

-- Tạo index để tìm kiếm nhanh
CREATE INDEX idx_LSHD_idNV ON LICHSU_HOATDONG(idNV);
CREATE INDEX idx_LSHD_thoiGian ON LICHSU_HOATDONG(thoiGian DESC);
CREATE INDEX idx_LSHD_loaiHoatDong ON LICHSU_HOATDONG(loaiHoatDong);
GO

