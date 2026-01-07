-- =============================================
-- XÓA VÀ TẠO LẠI TRIGGER CẬP NHẬT PHÂN LOẠI KHÁCH HÀNG
-- =============================================

USE HeThongQuanLyCuaHang_FMSTYLE;
GO

-- =============================================
-- BƯỚC 1: XÓA TẤT CẢ TRIGGER CŨ
-- =============================================

-- Xóa trigger cập nhật phân loại khi cập nhật tongchi
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_CapNhatPhanLoaiKhiCapNhatTongChi')
BEGIN
    DROP TRIGGER trg_CapNhatPhanLoaiKhiCapNhatTongChi;
    PRINT 'Đã xóa trigger: trg_CapNhatPhanLoaiKhiCapNhatTongChi';
END
GO

-- Xóa trigger cập nhật kho sau bán hàng (để tạo lại với logic mới)
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_CapNhatKhoSauBanHang')
BEGIN
    DROP TRIGGER trg_CapNhatKhoSauBanHang;
    PRINT 'Đã xóa trigger: trg_CapNhatKhoSauBanHang';
END
GO

-- =============================================
-- BƯỚC 2: TẠO LẠI TRIGGER CẬP NHẬT KHO SAU BÁN HÀNG
-- Trigger này CHỈ cập nhật tongchi và diemtichluy
-- KHÔNG cập nhật idPLKH (để code Node.js tự xử lý)
-- =============================================

CREATE TRIGGER trg_CapNhatKhoSauBanHang
ON CHITIET_HD
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Trừ kho
    UPDATE HANGHOA 
    SET soluong = HANGHOA.soluong - i.soluong
    FROM HANGHOA 
    JOIN inserted i ON HANGHOA.id = i.idHang;
    
    -- Cập nhật tổng chi tiêu và điểm tích lũy cho khách hàng
    -- KHÔNG cập nhật idPLKH ở đây - để code Node.js xử lý
    UPDATE KHACHHANG 
    SET tongchi = tongchi + i.thanhTien,
        diemtichluy = diemtichluy + (CAST(i.thanhTien AS INT) / 100000)
    FROM KHACHHANG 
    JOIN HOADON h ON KHACHHANG.id = h.idKH
    JOIN inserted i ON h.id = i.idHD
    WHERE h.idKH IS NOT NULL; -- Chỉ cập nhật nếu có khách hàng
END;
GO

PRINT 'Đã tạo lại trigger: trg_CapNhatKhoSauBanHang';
GO

-- =============================================
-- BƯỚC 3: TẠO TRIGGER CẬP NHẬT PHÂN LOẠI KHI TONGCHI THAY ĐỔI
-- Trigger này CHỈ chạy khi tongchi được cập nhật TRỰC TIẾP trong database
-- KHÔNG chạy khi idPLKH được cập nhật (để tránh conflict với code Node.js)
-- =============================================

CREATE TRIGGER trg_CapNhatPhanLoaiKhiCapNhatTongChi
ON KHACHHANG
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- CHỈ xử lý nếu tongchi thay đổi VÀ idPLKH KHÔNG được cập nhật trong cùng lúc
    -- Điều này đảm bảo trigger không ghi đè khi code Node.js cập nhật idPLKH
    IF UPDATE(tongchi) AND NOT UPDATE(idPLKH)
    BEGIN
        -- Tự động cập nhật phân loại dựa trên tổng chi tiêu mới
        UPDATE KHACHHANG
        SET idPLKH = (
            SELECT TOP 1 pl.id
            FROM PHANLOAI_KH pl
            WHERE pl.nguongChiMin <= KHACHHANG.tongchi
            ORDER BY pl.nguongChiMin DESC
        )
        FROM KHACHHANG
        INNER JOIN inserted i ON KHACHHANG.id = i.id
        WHERE EXISTS (
            -- Chỉ cập nhật nếu có phân loại phù hợp
            SELECT 1 
            FROM PHANLOAI_KH pl
            WHERE pl.nguongChiMin <= KHACHHANG.tongchi
        )
        AND (
            -- Chỉ cập nhật nếu phân loại thay đổi
            KHACHHANG.idPLKH IS NULL 
            OR KHACHHANG.idPLKH <> (
                SELECT TOP 1 pl.id
                FROM PHANLOAI_KH pl
                WHERE pl.nguongChiMin <= KHACHHANG.tongchi
                ORDER BY pl.nguongChiMin DESC
            )
        );
    END;
END;
GO

PRINT 'Đã tạo lại trigger: trg_CapNhatPhanLoaiKhiCapNhatTongChi';
GO

-- =============================================
-- BƯỚC 4: CẬP NHẬT LẠI PHÂN LOẠI CHO TẤT CẢ KHÁCH HÀNG HIỆN TẠI
-- =============================================

UPDATE KHACHHANG
SET idPLKH = (
    SELECT TOP 1 pl.id
    FROM PHANLOAI_KH pl
    WHERE pl.nguongChiMin <= KHACHHANG.tongchi
    ORDER BY pl.nguongChiMin DESC
)
WHERE EXISTS (
    SELECT 1 
    FROM PHANLOAI_KH pl
    WHERE pl.nguongChiMin <= KHACHHANG.tongchi
);

PRINT 'Đã cập nhật phân loại cho tất cả khách hàng';
GO

-- =============================================
-- BƯỚC 5: KIỂM TRA KẾT QUẢ
-- =============================================

SELECT 
    k.id,
    k.maKH,
    k.tenKH,
    k.tongchi,
    k.idPLKH,
    p.tenPLKH,
    p.nguongChiMin,
    CASE 
        WHEN k.tongchi >= p.nguongChiMin THEN 'ĐÚNG'
        ELSE 'SAI'
    END AS TrangThai
FROM KHACHHANG k
LEFT JOIN PHANLOAI_KH p ON k.idPLKH = p.id
ORDER BY k.tongchi DESC;
GO

-- Kiểm tra các trigger đã được tạo
SELECT 
    t.name AS TriggerName,
    OBJECT_NAME(t.parent_id) AS TableName,
    CASE 
        WHEN t.is_disabled = 1 THEN 'DISABLED'
        ELSE 'ENABLED'
    END AS Status
FROM sys.triggers t
WHERE t.parent_id IN (OBJECT_ID('KHACHHANG'), OBJECT_ID('CHITIET_HD'))
ORDER BY t.name;
GO

PRINT 'Hoàn tất!';
GO

