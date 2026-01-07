# PHÂN TÍCH TRIGGER - CÓ CẦN THIẾT KHÔNG?

## 1. Trigger `trg_CapNhatKhoSauBanHang` (trên bảng CHITIET_HD)
**CẦN THIẾT** ✅

**Chức năng:**
- Trừ kho khi thêm chi tiết hóa đơn
- Cập nhật `tongchi` và `diemtichluy` cho khách hàng

**Lý do cần:**
- Tự động hóa việc trừ kho và tích điểm
- Không thể thay thế bằng code Node.js vì phải đảm bảo tính nhất quán dữ liệu

**Kết luận:** GIỮ LẠI

---

## 2. Trigger `trg_CapNhatPhanLoaiKhiCapNhatTongChi` (trên bảng KHACHHANG)
**KHÔNG CẦN THIẾT** ❌

**Lý do không cần:**
1. Code Node.js đã tự động cập nhật phân loại:
   - Khi thêm chi tiết hóa đơn → gọi `updateAllCustomerClassification()`
   - Khi vào tab Khách Hàng → gọi `updateAllCustomerClassification()`

2. Trigger đang gây conflict:
   - Mỗi lần code cập nhật `idPLKH`, trigger lại chạy và có thể ghi đè
   - Phải DISABLE trigger mỗi lần cập nhật (tốn tài nguyên)

3. Logic đã được xử lý hoàn toàn trong Node.js:
   - Có log chi tiết để debug
   - Có xử lý lỗi tốt hơn
   - Dễ bảo trì hơn

**Kết luận:** XÓA BỎ

---

## KHUYẾN NGHỊ

### Script SQL để xóa trigger không cần thiết:

```sql
USE HeThongQuanLyCuaHang_FMSTYLE;
GO

-- XÓA trigger cập nhật phân loại (không cần thiết)
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_CapNhatPhanLoaiKhiCapNhatTongChi')
BEGIN
    DROP TRIGGER trg_CapNhatPhanLoaiKhiCapNhatTongChi;
    PRINT 'Đã xóa trigger: trg_CapNhatPhanLoaiKhiCapNhatTongChi';
END
GO

-- GIỮ LẠI trigger cập nhật kho và tongchi (cần thiết)
-- Trigger trg_CapNhatKhoSauBanHang vẫn hoạt động bình thường
```

### Sau khi xóa trigger:
- Code Node.js sẽ tự động cập nhật phân loại
- Không cần DISABLE/ENABLE trigger nữa
- Hiệu suất tốt hơn
- Không còn conflict

