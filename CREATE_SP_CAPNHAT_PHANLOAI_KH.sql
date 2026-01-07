-- =============================================
-- STORED PROCEDURE CẬP NHẬT PHÂN LOẠI KHÁCH HÀNG
-- =============================================

USE HeThongQuanLyCuaHang_FMSTYLE;
GO

-- Tạo stored procedure để cập nhật phân loại cho một khách hàng
CREATE OR ALTER PROCEDURE sp_CapNhatPhanLoaiKhachHang
    @idKH INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Cập nhật phân loại khách hàng dựa trên tongchi
    UPDATE KHACHHANG
    SET idPLKH = (
        SELECT TOP 1 pl.id
        FROM PHANLOAI_KH pl
        WHERE pl.nguongChiMin <= KHACHHANG.tongchi
        ORDER BY pl.nguongChiMin DESC
    )
    WHERE id = @idKH
    AND EXISTS (
        SELECT 1 
        FROM PHANLOAI_KH pl
        WHERE pl.nguongChiMin <= KHACHHANG.tongchi
    );
    
    -- Trả về kết quả
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
    WHERE k.id = @idKH;
END;
GO

PRINT 'Đã tạo stored procedure: sp_CapNhatPhanLoaiKhachHang';
GO

-- Test stored procedure
-- EXEC sp_CapNhatPhanLoaiKhachHang @idKH = 1;
-- GO

