-- =============================================
-- CẬP NHẬT TRIGGER ĐỂ NGAYNHAPCUOI THEO NGAYNHAP CỦA PHIẾU NHẬP
-- =============================================

USE HeThongQuanLyCuaHang_FMSTYLE;
GO

-- Sửa trigger để lấy ngayNhap từ PHIEUNHAP thay vì dùng GETDATE()
CREATE OR ALTER TRIGGER trg_CapNhatKhoSauNhapHang
ON CHITIET_PHIEUNHAP
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Cộng hàng vào kho
    UPDATE HANGHOA 
    SET soluong = HANGHOA.soluong + i.soluong,
        gianhap = i.dongia, -- Cập nhật giá nhập mới nhất
        ngayNhapCuoi = CAST(pn.ngayNhap AS DATE) -- Lấy ngày nhập từ phiếu nhập
    FROM HANGHOA 
    JOIN inserted i ON HANGHOA.id = i.idHang
    JOIN PHIEUNHAP pn ON i.idPN = pn.id;
    
    -- Cập nhật tổng tiền của phiếu nhập
    UPDATE PHIEUNHAP
    SET tongTien = (
        SELECT ISNULL(SUM(thanhTien), 0)
        FROM CHITIET_PHIEUNHAP
        WHERE idPN = PHIEUNHAP.id
    )
    WHERE id IN (SELECT DISTINCT idPN FROM inserted);
END;
GO

