-- =============================================
-- SỬA TRIGGER ĐỂ TRÁNH GHI ĐÈ PHÂN LOẠI
-- =============================================

USE HeThongQuanLyCuaHang_FMSTYLE;
GO

-- Xóa trigger cũ nếu có vấn đề
-- DROP TRIGGER IF EXISTS trg_CapNhatPhanLoaiKhiCapNhatTongChi;
-- GO

-- Sửa trigger để CHỈ cập nhật phân loại khi tongchi thay đổi
-- VÀ không cập nhật nếu idPLKH đã được set thủ công (trong cùng transaction)
CREATE OR ALTER TRIGGER trg_CapNhatPhanLoaiKhiCapNhatTongChi
ON KHACHHANG
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Chỉ xử lý nếu tongchi thay đổi VÀ idPLKH không được cập nhật trong cùng lúc
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

-- Kiểm tra trigger hiện tại
SELECT 
    t.name AS TriggerName,
    OBJECT_NAME(t.parent_id) AS TableName,
    OBJECT_DEFINITION(t.object_id) AS TriggerDefinition
FROM sys.triggers t
WHERE t.parent_id = OBJECT_ID('KHACHHANG')
ORDER BY t.name;
GO

-- Cập nhật lại phân loại cho tất cả khách hàng
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
GO

-- Kiểm tra kết quả
SELECT 
    k.id,
    k.maKH,
    k.tenKH,
    k.tongchi,
    k.idPLKH,
    p.tenPLKH,
    p.nguongChiMin
FROM KHACHHANG k
LEFT JOIN PHANLOAI_KH p ON k.idPLKH = p.id
ORDER BY k.tongchi DESC;
GO

