-- =============================================
-- XÓA TRIGGER KHÔNG CẦN THIẾT
-- Trigger cập nhật phân loại đã được xử lý trong Node.js
-- =============================================

USE HeThongQuanLyCuaHang_FMSTYLE;
GO

-- XÓA trigger cập nhật phân loại (không cần thiết nữa)
-- Vì code Node.js đã tự động cập nhật phân loại khi:
-- 1. Thêm chi tiết hóa đơn
-- 2. Vào tab Khách Hàng
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_CapNhatPhanLoaiKhiCapNhatTongChi')
BEGIN
    DROP TRIGGER trg_CapNhatPhanLoaiKhiCapNhatTongChi;
    PRINT '✅ Đã xóa trigger: trg_CapNhatPhanLoaiKhiCapNhatTongChi';
    PRINT '   Lý do: Code Node.js đã tự động cập nhật phân loại';
END
ELSE
BEGIN
    PRINT '⚠️ Trigger trg_CapNhatPhanLoaiKhiCapNhatTongChi không tồn tại';
END
GO

-- Kiểm tra các trigger còn lại
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
PRINT 'Trigger trg_CapNhatKhoSauBanHang vẫn hoạt động bình thường (cần thiết để cập nhật tongchi và trừ kho)';
GO

