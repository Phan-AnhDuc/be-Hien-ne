-- =============================================
-- TRIGGER TỰ ĐỘNG CẬP NHẬT PHÂN LOẠI KHÁCH HÀNG
-- Khi tổng chi tiêu (tongchi) đạt ngưỡng, tự động nâng cấp phân loại
-- =============================================

USE HeThongQuanLyCuaHang_FMSTYLE;
GO

-- Sửa trigger hiện tại để thêm logic cập nhật phân loại
CREATE OR ALTER TRIGGER trg_CapNhatKhoSauBanHang
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
    UPDATE KHACHHANG 
    SET tongchi = tongchi + i.thanhTien,
        diemtichluy = diemtichluy + (CAST(i.thanhTien AS INT) / 100000)
    FROM KHACHHANG 
    JOIN HOADON h ON KHACHHANG.id = h.idKH
    JOIN inserted i ON h.id = i.idHD
    WHERE h.idKH IS NOT NULL; -- Chỉ cập nhật nếu có khách hàng
    
    -- Tự động cập nhật phân loại khách hàng dựa trên tổng chi tiêu mới
    -- Tìm phân loại phù hợp nhất (ngưỡng cao nhất mà khách hàng đạt được)
    UPDATE KHACHHANG
    SET idPLKH = (
        SELECT TOP 1 pl.id
        FROM PHANLOAI_KH pl
        WHERE pl.nguongChiMin <= KHACHHANG.tongchi
        ORDER BY pl.nguongChiMin DESC
    )
    FROM KHACHHANG
    INNER JOIN HOADON h ON KHACHHANG.id = h.idKH
    INNER JOIN inserted i ON h.id = i.idHD
    WHERE h.idKH IS NOT NULL
    AND EXISTS (
        -- Chỉ cập nhật nếu có phân loại phù hợp
        SELECT 1 
        FROM PHANLOAI_KH pl
        WHERE pl.nguongChiMin <= KHACHHANG.tongchi
    );
END;
GO

-- Trigger để cập nhật phân loại khi cập nhật trực tiếp tongchi (nếu có)
CREATE OR ALTER TRIGGER trg_CapNhatPhanLoaiKhiCapNhatTongChi
ON KHACHHANG
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Chỉ xử lý nếu tongchi thay đổi
    IF UPDATE(tongchi)
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

-- =============================================
-- SCRIPT CẬP NHẬT LẠI PHÂN LOẠI CHO TẤT CẢ KHÁCH HÀNG HIỆN TẠI
-- Chạy script này để cập nhật lại phân loại cho các khách hàng đã có
-- =============================================

-- Cập nhật phân loại cho tất cả khách hàng dựa trên tongchi hiện tại
UPDATE KHACHHANG
SET idPLKH = (
    SELECT TOP 1 pl.id
    FROM PHANLOAI_KH pl
    WHERE pl.nguongChiMin <= KHACHHANG.tongchi
    ORDER BY pl.nguongChiMin DESC
)
WHERE EXISTS (
    -- Chỉ cập nhật nếu có phân loại phù hợp
    SELECT 1 
    FROM PHANLOAI_KH pl
    WHERE pl.nguongChiMin <= KHACHHANG.tongchi
);

-- Kiểm tra kết quả
SELECT 
    k.id,
    k.maKH,
    k.tenKH,
    k.tongchi,
    k.idPLKH,
    pl.tenPLKH,
    pl.nguongChiMin
FROM KHACHHANG k
LEFT JOIN PHANLOAI_KH pl ON k.idPLKH = pl.id
ORDER BY k.tongchi DESC;

GO

