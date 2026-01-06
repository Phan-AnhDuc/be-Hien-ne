# MẪU TIỂU LUẬN HỆ CƠ SỞ DỮ LIỆU

**Đề tài: XÂY DỰNG HỆ THỐNG QUẢN LÝ CỬA HÀNG THỜI TRANG FMSTYLE**

---

## A/ PHẦN MỞ ĐẦU

### CHƯƠNG 1. TÍNH CẤP THIẾT CỦA ĐỀ TÀI

Trong bối cảnh kinh tế thị trường hiện đại, việc quản lý cửa hàng bán lẻ một cách hiệu quả đóng vai trò quan trọng trong việc nâng cao năng suất và chất lượng phục vụ khách hàng. Đặc biệt đối với các cửa hàng thời trang, việc quản lý hàng hóa, khách hàng, hóa đơn và thống kê doanh thu một cách thủ công đã trở nên lỗi thời và không còn phù hợp với quy mô kinh doanh hiện đại.

Hệ thống quản lý cửa hàng thời trang FMSTYLE được xây dựng nhằm giải quyết các vấn đề:

1. **Quản lý kho hàng**: Theo dõi số lượng tồn kho, cảnh báo hàng sắp hết, quản lý giá nhập và giá bán một cách chính xác.

2. **Quản lý bán hàng**: Tạo hóa đơn nhanh chóng, áp dụng khuyến mãi, tích điểm cho khách hàng, xuất hóa đơn PDF/Excel.

3. **Quản lý khách hàng**: Lưu trữ thông tin khách hàng, theo dõi điểm tích lũy, phân loại khách hàng theo mức độ thân thiết.

4. **Thống kê và báo cáo**: Báo cáo doanh thu theo ngày, tuần, tháng, quý, năm; thống kê sản phẩm bán chạy, nhân viên xuất sắc.

5. **Quản lý nhân viên**: Phân quyền theo vai trò (admin, nhân viên bán hàng, thủ kho), theo dõi hoạt động của nhân viên.

Việc ứng dụng công nghệ thông tin vào quản lý cửa hàng sẽ giúp giảm thiểu sai sót, tăng hiệu quả làm việc, và cải thiện trải nghiệm khách hàng.

---

### CHƯƠNG 2. MỤC ĐÍCH VÀ YÊU CẦU CỦA ĐỀ TÀI

#### 2.1. Mục đích của đề tài

- **Xây dựng hệ thống quản lý cửa hàng thời trang hoàn chỉnh** với đầy đủ các chức năng từ quản lý kho, bán hàng, đến thống kê doanh thu.

- **Ứng dụng công nghệ web hiện đại** (Node.js, Express.js, SQL Server) để xây dựng hệ thống có khả năng mở rộng và bảo trì dễ dàng.

- **Tự động hóa các quy trình nghiệp vụ** như trừ/cộng kho, tích điểm khách hàng, tính tổng tiền hóa đơn thông qua triggers và computed columns trong database.

- **Phân quyền người dùng** theo vai trò để đảm bảo bảo mật và quản lý hiệu quả.

- **Xuất báo cáo** dưới dạng PDF và Excel để phục vụ công tác quản lý và kế toán.

#### 2.2. Yêu cầu của đề tài

**2.2.1. Yêu cầu chức năng:**

- Quản lý hàng hóa: Thêm, sửa, xóa, tìm kiếm hàng hóa; theo dõi tồn kho; cảnh báo hàng sắp hết.
- Quản lý bán hàng: Tạo hóa đơn, chọn sản phẩm, áp dụng khuyến mãi, sử dụng điểm tích lũy, xuất PDF/Excel.
- Quản lý khách hàng: Lưu trữ thông tin, theo dõi điểm tích lũy, phân loại khách hàng.
- Quản lý nhân viên: Thêm, sửa, xóa nhân viên; phân quyền theo vai trò.
- Quản lý phiếu nhập: Tạo phiếu nhập hàng, tự động cộng kho, cập nhật giá nhập.
- Thống kê doanh thu: Báo cáo theo thời gian, theo nhân viên, sản phẩm bán chạy.
- Lịch sử hoạt động: Ghi lại mọi thao tác trong hệ thống để kiểm tra và đối chiếu.

**2.2.2. Yêu cầu phi chức năng:**

- **Hiệu năng**: Hệ thống phải phản hồi nhanh, hỗ trợ nhiều người dùng đồng thời.
- **Bảo mật**: Mã hóa mật khẩu bằng SHA-256, phân quyền theo vai trò, kiểm tra quyền truy cập.
- **Giao diện**: Thân thiện, dễ sử dụng, responsive trên các thiết bị khác nhau.
- **Độ tin cậy**: Đảm bảo tính nhất quán dữ liệu thông qua ràng buộc và triggers.
- **Khả năng mở rộng**: Dễ dàng thêm chức năng mới, mở rộng quy mô hệ thống.

---

## B/ NỘI DUNG

### CHƯƠNG 3. CƠ SỞ LÝ THUYẾT

#### 3.1. Khái niệm về hệ quản trị cơ sở dữ liệu (DBMS)

Hệ quản trị cơ sở dữ liệu (Database Management System - DBMS) là phần mềm được thiết kế để quản lý, lưu trữ và truy xuất dữ liệu một cách hiệu quả. Microsoft SQL Server là một hệ quản trị cơ sở dữ liệu quan hệ (RDBMS) mạnh mẽ, được sử dụng rộng rãi trong các ứng dụng doanh nghiệp.

**Đặc điểm của SQL Server:**
- Hỗ trợ giao dịch (ACID): Đảm bảo tính nhất quán dữ liệu
- Triggers: Tự động thực thi các hành động khi có sự kiện xảy ra
- Stored Procedures: Lưu trữ các câu lệnh SQL để tái sử dụng
- Computed Columns: Tự động tính toán giá trị dựa trên các cột khác
- Indexes: Tăng tốc độ truy vấn dữ liệu

#### 3.2. Khái niệm về Node.js và Express.js

**Node.js** là một runtime environment mã nguồn mở, cho phép chạy JavaScript trên server. Node.js sử dụng event-driven, non-blocking I/O model, giúp tạo ra các ứng dụng web hiệu quả và có khả năng mở rộng cao.

**Express.js** là một web framework nhỏ gọn và linh hoạt cho Node.js, cung cấp các tính năng mạnh mẽ để xây dựng các ứng dụng web và API. Express.js hỗ trợ:
- Routing: Định tuyến các request đến các handler tương ứng
- Middleware: Xử lý các request trước khi đến route handler
- Template engines: Render HTML động
- Static files: Phục vụ các file tĩnh (CSS, JS, images)

#### 3.3. Khái niệm về RESTful API

REST (Representational State Transfer) là một kiến trúc phần mềm để thiết kế các ứng dụng web. RESTful API là một API tuân theo các nguyên tắc REST:

- **Stateless**: Mỗi request phải chứa đầy đủ thông tin để server xử lý
- **Resource-based**: Sử dụng URL để định danh tài nguyên
- **HTTP Methods**: Sử dụng GET, POST, PUT, DELETE để thao tác với tài nguyên
- **JSON**: Trao đổi dữ liệu dưới dạng JSON

**Ví dụ trong hệ thống:**
- `GET /api/hanghoa` - Lấy danh sách hàng hóa
- `POST /api/hanghoa` - Tạo hàng hóa mới
- `PUT /api/hanghoa/:id` - Cập nhật hàng hóa
- `DELETE /api/hanghoa/:id` - Xóa hàng hóa

#### 3.4. Khái niệm về Trigger trong SQL Server

Trigger là một stored procedure đặc biệt được tự động thực thi khi có sự kiện INSERT, UPDATE, hoặc DELETE xảy ra trên một bảng cụ thể.

**Các loại Trigger:**
- **AFTER Trigger**: Thực thi sau khi sự kiện hoàn thành
- **INSTEAD OF Trigger**: Thay thế hành động gốc

**Ứng dụng trong hệ thống:**
- `trg_CapNhatKhoSauBanHang`: Tự động trừ kho và tích điểm khi bán hàng
- `trg_CapNhatKhoSauNhapHang`: Tự động cộng kho khi nhập hàng
- `trg_CapNhatTongTienPhieuNhap_Delete`: Cập nhật tổng tiền khi xóa chi tiết phiếu nhập

#### 3.5. Khái niệm về Computed Columns

Computed Columns là các cột trong bảng có giá trị được tính toán tự động dựa trên các cột khác hoặc các biểu thức.

**Ví dụ trong hệ thống:**
- `maHD AS ('HD' + RIGHT('000' + CAST(id AS VARCHAR(5)), 5))`: Tự động sinh mã hóa đơn
- `thanhTien AS (soluong * dongia)`: Tự động tính thành tiền
- `trangthai AS (CASE WHEN GETDATE() BETWEEN ngayBD AND ngayKT THEN 1 ELSE 0 END)`: Tự động xác định trạng thái khuyến mãi

#### 3.6. Mối quan hệ giữa các thành phần trong hệ thống

**Kiến trúc 3 tầng (3-Tier Architecture):**

1. **Presentation Layer (Frontend)**: 
   - HTML, CSS, JavaScript
   - Giao diện người dùng, xử lý tương tác

2. **Business Logic Layer (Backend)**:
   - Node.js + Express.js
   - Xử lý logic nghiệp vụ, xác thực, phân quyền

3. **Data Layer (Database)**:
   - SQL Server
   - Lưu trữ dữ liệu, triggers, stored procedures

**Luồng xử lý:**
```
User → Frontend → API Request → Backend → Database → Response → Frontend → User
```

#### 3.7. Khái niệm về Authentication và Authorization

**Authentication (Xác thực)**: Xác minh danh tính người dùng thông qua username và password. Hệ thống sử dụng SHA-256 để mã hóa mật khẩu.

**Authorization (Phân quyền)**: Xác định quyền truy cập của người dùng vào các tài nguyên và chức năng. Hệ thống hỗ trợ 4 vai trò:
- `admin`: Quản lý toàn bộ hệ thống
- `user`: Người dùng thông thường
- `seller`: Nhân viên bán hàng
- `warehouse`: Thủ kho

---

### CHƯƠNG 4. THỰC TRẠNG, ƯU ĐIỂM VÀ KHUYẾT ĐIỂM KHI SỬ DỤNG HỆ THỐNG QUẢN LÝ CỬA HÀNG

#### 4.1. Thực trạng khi sử dụng hệ thống quản lý cửa hàng

**4.1.1. Quản lý thủ công:**
- Ghi chép bằng sổ sách, dễ mất mát, khó tìm kiếm
- Tính toán thủ công dễ sai sót
- Không có cảnh báo tự động về hàng sắp hết
- Khó thống kê và báo cáo

**4.1.2. Sử dụng phần mềm đơn giản:**
- Excel: Khó quản lý khi dữ liệu lớn, không có ràng buộc dữ liệu
- Phần mềm đóng gói: Không phù hợp với quy trình nghiệp vụ cụ thể, khó tùy chỉnh

**4.1.3. Nhu cầu thực tế:**
- Cần hệ thống tự động hóa các quy trình
- Cần tích hợp nhiều chức năng trong một hệ thống
- Cần báo cáo và thống kê nhanh chóng
- Cần phân quyền và bảo mật

#### 4.2. Ưu điểm khi sử dụng hệ thống quản lý cửa hàng FMSTYLE

**4.2.1. Tự động hóa:**
- ✅ Tự động trừ/cộng kho khi bán/nhập hàng
- ✅ Tự động tích điểm cho khách hàng (100.000đ = 1 điểm)
- ✅ Tự động tính tổng tiền hóa đơn/phiếu nhập
- ✅ Tự động sinh mã (HD, PN, KH, NV, SP)
- ✅ Tự động cảnh báo hàng tồn kho thấp

**4.2.2. Quản lý tập trung:**
- ✅ Tất cả dữ liệu được lưu trữ tập trung trong database
- ✅ Dễ dàng tìm kiếm và truy vấn
- ✅ Đảm bảo tính nhất quán dữ liệu

**4.2.3. Báo cáo và thống kê:**
- ✅ Thống kê doanh thu theo nhiều tiêu chí (ngày, tuần, tháng, quý, năm)
- ✅ Thống kê sản phẩm bán chạy, nhân viên xuất sắc
- ✅ Xuất báo cáo PDF/Excel
- ✅ Dashboard tổng quan hệ thống

**4.2.4. Bảo mật và phân quyền:**
- ✅ Mã hóa mật khẩu bằng SHA-256
- ✅ Phân quyền theo vai trò
- ✅ Lịch sử hoạt động để kiểm tra

**4.2.5. Giao diện thân thiện:**
- ✅ Thiết kế hiện đại, dễ sử dụng
- ✅ Responsive trên nhiều thiết bị
- ✅ Tìm kiếm và lọc dữ liệu nhanh chóng

#### 4.3. Khuyết điểm và hạn chế

**4.3.1. Hạn chế về công nghệ:**
- ⚠️ Yêu cầu kết nối internet để sử dụng (nếu deploy trên server)
- ⚠️ Phụ thuộc vào trình duyệt web
- ⚠️ Cần cấu hình database ban đầu

**4.3.2. Hạn chế về chức năng:**
- ⚠️ Chưa hỗ trợ thanh toán trực tuyến
- ⚠️ Chưa có ứng dụng mobile
- ⚠️ Chưa tích hợp với các hệ thống kế toán khác

**4.3.3. Hạn chế về quy mô:**
- ⚠️ Phù hợp với cửa hàng vừa và nhỏ
- ⚠️ Cần tối ưu hóa khi dữ liệu lớn

---

### CHƯƠNG 5. XÂY DỰNG BÀI TOÁN QUẢN LÝ

#### 5.1. Phân tích yêu cầu và thiết kế hệ thống

**5.1.1. Phân tích nghiệp vụ:**

Hệ thống quản lý cửa hàng FMSTYLE cần đáp ứng các nghiệp vụ chính:

1. **Quản lý hàng hóa:**
   - Thêm, sửa, xóa hàng hóa
   - Theo dõi tồn kho
   - Cảnh báo hàng sắp hết
   - Quản lý giá nhập và giá bán

2. **Quản lý bán hàng:**
   - Tạo hóa đơn
   - Chọn sản phẩm từ kho
   - Áp dụng khuyến mãi
   - Sử dụng điểm tích lũy
   - Xuất hóa đơn PDF/Excel

3. **Quản lý khách hàng:**
   - Lưu trữ thông tin khách hàng
   - Theo dõi điểm tích lũy
   - Phân loại khách hàng

4. **Quản lý nhân viên:**
   - Thêm, sửa, xóa nhân viên
   - Phân quyền theo vai trò
   - Theo dõi hoạt động

5. **Quản lý phiếu nhập:**
   - Tạo phiếu nhập hàng
   - Tự động cộng kho
   - Cập nhật giá nhập

6. **Thống kê và báo cáo:**
   - Doanh thu theo thời gian
   - Sản phẩm bán chạy
   - Nhân viên xuất sắc

**5.1.2. Thiết kế cơ sở dữ liệu:**

**Các bảng chính:**

1. **VITRI**: Vị trí nhân viên (Quản lý, Thủ kho, Bán hàng)
2. **NHANVIEN**: Thông tin nhân viên
3. **USERS**: Tài khoản đăng nhập
4. **KHACHHANG**: Thông tin khách hàng
5. **HANGHOA**: Thông tin hàng hóa
6. **HOADON**: Hóa đơn bán hàng
7. **CHITIET_HD**: Chi tiết hóa đơn
8. **PHIEUNHAP**: Phiếu nhập hàng
9. **CHITIET_PHIEUNHAP**: Chi tiết phiếu nhập
10. **NHACUNGCAP**: Nhà cung cấp
11. **KHUYENMAI**: Khuyến mãi
12. **PHANLOAI_KH**: Phân loại khách hàng
13. **PHANLOAI_SANPHAM**: Phân loại sản phẩm
14. **LICHSU_HOATDONG**: Lịch sử hoạt động

**Mối quan hệ giữa các bảng:**
- NHANVIEN → VITRI (nhiều-nhiều)
- HOADON → NHANVIEN, KHACHHANG, KHUYENMAI
- CHITIET_HD → HOADON, HANGHOA
- PHIEUNHAP → NHANVIEN, NHACUNGCAP
- CHITIET_PHIEUNHAP → PHIEUNHAP, HANGHOA

#### 5.2. Xây dựng hệ thống ban đầu

**5.2.1. Cài đặt môi trường:**

```bash
# Cài đặt Node.js và npm
# Tạo project mới
npm init -y

# Cài đặt các package cần thiết
npm install express mssql cors dotenv
npm install pdfkit exceljs
npm install nodemon --save-dev
```

**5.2.2. Cấu trúc thư mục:**

```
be-Hien-ne/
├── server.js              # Backend API server
├── db.config.js           # Database configuration
├── package.json           # Dependencies
├── README.md             # Documentation
├── src/
│   ├── pages/            # Frontend pages
│   │   ├── login.html
│   │   ├── admin.html
│   │   ├── staff.html
│   │   └── warehouse.html
│   ├── js/               # JavaScript files
│   │   ├── api.js
│   │   ├── auth.js
│   │   ├── app.js
│   │   └── pages.js
│   └── css/              # Stylesheets
│       └── style.css
```

**5.2.3. Tạo database và các bảng:**

Sử dụng các script SQL trong file `README.md` để tạo database và các bảng với đầy đủ ràng buộc, triggers, và indexes.

#### 5.3. Thiết kế API và Backend

**5.3.1. Các API endpoints chính:**

**Authentication:**
- `POST /api/login` - Đăng nhập

**Hàng Hóa:**
- `GET /api/hanghoa` - Lấy danh sách hàng hóa
- `POST /api/hanghoa` - Tạo hàng hóa mới
- `PUT /api/hanghoa/:id` - Cập nhật hàng hóa
- `DELETE /api/hanghoa/:id` - Xóa hàng hóa

**Hóa Đơn:**
- `GET /api/hoadon` - Lấy danh sách hóa đơn
- `POST /api/hoadon` - Tạo hóa đơn mới
- `GET /api/hoadon/:id` - Lấy chi tiết hóa đơn
- `GET /api/hoadon/:id/pdf` - Xuất PDF hóa đơn
- `GET /api/hoadon/:id/export` - Xuất Excel/JSON

**Phiếu Nhập:**
- `GET /api/phieunhap` - Lấy danh sách phiếu nhập
- `POST /api/phieunhap` - Tạo phiếu nhập mới
- `GET /api/chitietphieunhap/:idPN` - Lấy chi tiết phiếu nhập

**Thống Kê:**
- `GET /api/thongke/doanhthu` - Thống kê doanh thu

**5.3.2. Xử lý logic nghiệp vụ:**

- Xác thực và phân quyền người dùng
- Validate dữ liệu đầu vào
- Xử lý lỗi và trả về response phù hợp
- Ghi log lịch sử hoạt động

#### 5.4. Thiết kế giao diện người dùng

**5.4.1. Trang đăng nhập (login.html):**
- Form đăng nhập với username và password
- Xử lý lỗi đăng nhập
- Chuyển hướng theo vai trò người dùng

**5.4.2. Trang Admin (admin.html):**
- Dashboard tổng quan
- Quản lý các danh mục (Vị trí, Phân loại KH, Phân loại SP, Khuyến mãi)
- Quản lý nhân viên, khách hàng, hàng hóa
- Quản lý hóa đơn và phiếu nhập
- Thống kê và báo cáo

**5.4.3. Trang Staff (staff.html):**
- Dashboard với thống kê nhanh
- Kho hàng hóa với tìm kiếm
- Tạo hóa đơn với giỏ hàng
- Danh sách hóa đơn
- Quản lý khách hàng
- Thống kê doanh thu
- Phiếu nhập hàng
- Trả hàng và đổi hàng

**5.4.4. Trang Warehouse (warehouse.html):**
- Dashboard tổng quan
- Quản lý phiếu nhập hàng
- Quản lý hàng hóa
- Lịch sử hoạt động

**5.4.5. Tính năng giao diện:**
- Responsive design
- Tìm kiếm và lọc dữ liệu
- Modal để thêm/sửa/xóa
- Toast notifications
- Export PDF/Excel

#### 5.5. Thiết kế triggers và tự động hóa

**5.5.1. Trigger trừ kho khi bán hàng:**

```sql
CREATE OR ALTER TRIGGER trg_CapNhatKhoSauBanHang
ON CHITIET_HD
AFTER INSERT
AS
BEGIN
    -- Trừ kho
    UPDATE HANGHOA SET soluong = HANGHOA.soluong - i.soluong
    FROM HANGHOA JOIN inserted i ON HANGHOA.id = i.idHang;
    
    -- Tích điểm cho khách hàng
    UPDATE KHACHHANG SET tongchi = tongchi + i.thanhTien,
                         diemtichluy = diemtichluy + (CAST(i.thanhTien AS INT) / 100000)
    FROM KHACHHANG 
    JOIN HOADON h ON KHACHHANG.id = h.idKH
    JOIN inserted i ON h.id = i.idHD;
END;
```

**5.5.2. Trigger cộng kho khi nhập hàng:**

```sql
CREATE OR ALTER TRIGGER trg_CapNhatKhoSauNhapHang
ON CHITIET_PHIEUNHAP
AFTER INSERT
AS
BEGIN
    -- Cộng hàng vào kho
    UPDATE HANGHOA 
    SET soluong = HANGHOA.soluong + i.soluong,
        gianhap = i.dongia,
        ngayNhapCuoi = CAST(GETDATE() AS DATE)
    FROM HANGHOA 
    JOIN inserted i ON HANGHOA.id = i.idHang;
    
    -- Cập nhật tổng tiền phiếu nhập
    UPDATE PHIEUNHAP
    SET tongTien = (SELECT ISNULL(SUM(thanhTien), 0)
                    FROM CHITIET_PHIEUNHAP
                    WHERE idPN = PHIEUNHAP.id)
    WHERE id IN (SELECT DISTINCT idPN FROM inserted);
END;
```

**5.5.3. Computed Columns:**

- `maHD`, `maPN`, `maKH`, `maNV`, `maHang`, `maNCC`: Tự động sinh mã
- `thanhTien`: Tự động tính thành tiền
- `trangthai`: Tự động xác định trạng thái khuyến mãi

#### 5.6. Kiểm thử và triển khai hệ thống

**5.6.1. Kiểm thử chức năng:**

- ✅ Kiểm thử đăng nhập và phân quyền
- ✅ Kiểm thử CRUD các bảng
- ✅ Kiểm thử tạo hóa đơn và tự động trừ kho
- ✅ Kiểm thử tạo phiếu nhập và tự động cộng kho
- ✅ Kiểm thử tích điểm khách hàng
- ✅ Kiểm thử xuất PDF/Excel
- ✅ Kiểm thử thống kê và báo cáo

**5.6.2. Kiểm thử hiệu năng:**

- Kiểm tra tốc độ truy vấn database
- Kiểm tra khả năng xử lý nhiều request đồng thời
- Tối ưu hóa các câu truy vấn phức tạp

**5.6.3. Triển khai:**

- Cấu hình database trên server
- Deploy backend lên server (Node.js)
- Deploy frontend lên web server
- Cấu hình domain và SSL
- Backup database định kỳ

---

### CHƯƠNG 6. KẾT LUẬN VÀ PHÁT TRIỂN

#### 6.1. Kết luận

Hệ thống quản lý cửa hàng thời trang FMSTYLE đã được xây dựng thành công với đầy đủ các chức năng cần thiết cho việc quản lý một cửa hàng bán lẻ hiện đại. Hệ thống đạt được các mục tiêu:

**6.1.1. Về mặt kỹ thuật:**
- ✅ Sử dụng công nghệ web hiện đại (Node.js, Express.js, SQL Server)
- ✅ Kiến trúc 3 tầng rõ ràng, dễ bảo trì và mở rộng
- ✅ API RESTful chuẩn, dễ tích hợp
- ✅ Database được thiết kế tối ưu với triggers và computed columns

**6.1.2. Về mặt chức năng:**
- ✅ Đầy đủ các chức năng quản lý: hàng hóa, khách hàng, nhân viên, hóa đơn, phiếu nhập
- ✅ Tự động hóa các quy trình: trừ/cộng kho, tích điểm, tính tổng tiền
- ✅ Thống kê và báo cáo đa dạng
- ✅ Xuất báo cáo PDF/Excel

**6.1.3. Về mặt bảo mật:**
- ✅ Mã hóa mật khẩu bằng SHA-256
- ✅ Phân quyền theo vai trò
- ✅ Lịch sử hoạt động để kiểm tra

**6.1.4. Về mặt giao diện:**
- ✅ Thiết kế hiện đại, thân thiện với người dùng
- ✅ Responsive trên nhiều thiết bị
- ✅ Tìm kiếm và lọc dữ liệu nhanh chóng

**6.1.5. Đóng góp của đề tài:**

- Cung cấp giải pháp quản lý cửa hàng hoàn chỉnh, có thể áp dụng ngay vào thực tế
- Minh chứng việc ứng dụng công nghệ thông tin vào quản lý kinh doanh
- Tài liệu và mã nguồn có thể tham khảo cho các dự án tương tự

#### 6.2. Hướng phát triển

**6.2.1. Mở rộng chức năng:**

- 📱 **Ứng dụng mobile**: Phát triển ứng dụng Android/iOS để nhân viên có thể sử dụng trên điện thoại
- 💳 **Thanh toán trực tuyến**: Tích hợp các cổng thanh toán (VNPay, Momo, ZaloPay)
- 📧 **Gửi email**: Gửi hóa đơn qua email cho khách hàng
- 📱 **SMS thông báo**: Gửi SMS thông báo khuyến mãi, hàng mới
- 🛒 **Bán hàng online**: Tích hợp website bán hàng online

**6.2.2. Cải thiện hiệu năng:**

- ⚡ **Caching**: Sử dụng Redis để cache dữ liệu thường xuyên truy cập
- ⚡ **Load balancing**: Phân tải khi có nhiều người dùng
- ⚡ **CDN**: Sử dụng CDN để tăng tốc độ tải trang
- ⚡ **Database optimization**: Tối ưu hóa các câu truy vấn, thêm indexes

**6.2.3. Nâng cao bảo mật:**

- 🔒 **JWT Authentication**: Sử dụng JWT thay vì session
- 🔒 **HTTPS**: Bắt buộc sử dụng HTTPS
- 🔒 **Rate limiting**: Giới hạn số lượng request
- 🔒 **Input validation**: Validate dữ liệu đầu vào chặt chẽ hơn

**6.2.4. Tích hợp hệ thống:**

- 🔗 **Kế toán**: Tích hợp với phần mềm kế toán
- 🔗 **Kho hàng**: Tích hợp với hệ thống quản lý kho lớn
- 🔗 **CRM**: Tích hợp với hệ thống CRM để quản lý khách hàng tốt hơn
- 🔗 **Báo cáo**: Tích hợp với các công cụ báo cáo chuyên nghiệp

**6.2.5. Trí tuệ nhân tạo:**

- 🤖 **Dự đoán xu hướng**: Sử dụng AI để dự đoán xu hướng bán hàng
- 🤖 **Gợi ý sản phẩm**: Gợi ý sản phẩm cho khách hàng dựa trên lịch sử mua hàng
- 🤖 **Tối ưu giá**: Sử dụng AI để đề xuất giá bán tối ưu

**6.2.6. Báo cáo nâng cao:**

- 📊 **Dashboard tương tác**: Dashboard với biểu đồ tương tác
- 📊 **Báo cáo tự động**: Tự động gửi báo cáo định kỳ
- 📊 **Phân tích dữ liệu**: Phân tích sâu hơn về hành vi khách hàng

---

## TÀI LIỆU THAM KHẢO

1. Microsoft SQL Server Documentation. (2024). *SQL Server Technical Documentation*. Microsoft Corporation.

2. Node.js Foundation. (2024). *Node.js Documentation*. https://nodejs.org/docs/

3. Express.js. (2024). *Express.js Guide*. https://expressjs.com/

4. Elmasri, R., & Navathe, S. (2016). *Fundamentals of Database Systems* (7th ed.). Pearson.

5. Silberschatz, A., Korth, H. F., & Sudarshan, S. (2019). *Database System Concepts* (7th ed.). McGraw-Hill Education.

6. Fielding, R. T. (2000). *Architectural Styles and the Design of Network-based Software Architectures*. University of California, Irvine.

7. Richardson, L., & Ruby, S. (2013). *RESTful Web APIs*. O'Reilly Media.

---

## PHỤ LỤC

### Phụ lục A: Sơ đồ cơ sở dữ liệu

[Vẽ sơ đồ ERD mô tả mối quan hệ giữa các bảng]

### Phụ lục B: Mã nguồn chính

[Liệt kê các file mã nguồn quan trọng]

### Phụ lục C: Hướng dẫn cài đặt

[Xem README.md trong project]

### Phụ lục D: Hướng dẫn sử dụng

[Xem README.md trong project]

---

**Người thực hiện:** [Tên sinh viên]

**Lớp:** [Tên lớp]

**Giảng viên hướng dẫn:** [Tên giảng viên]

**Năm học:** 2024-2025

