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

#### 5.1. Xây dựng hệ thống ban đầu

**5.1.1. Thiết lập môi trường phát triển:**

Hệ thống được xây dựng trên nền tảng Node.js với các công nghệ hiện đại:

**Cài đặt các công cụ cần thiết:**
```bash
# Cài đặt Node.js (phiên bản >= 14.x)
# Tạo thư mục dự án
mkdir be-Hien-ne
cd be-Hien-ne

# Khởi tạo project Node.js
npm init -y

# Cài đặt các package backend
npm install express mssql cors dotenv
npm install pdfkit exceljs

# Cài đặt công cụ phát triển
npm install nodemon --save-dev
```

**Cấu hình file package.json:**
```json
{
  "name": "demo-connect-sql-server",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^17.2.3",
    "exceljs": "^4.4.0",
    "express": "^5.1.0",
    "mssql": "^12.1.1",
    "pdfkit": "^0.15.0"
  }
}
```

**5.1.2. Cấu trúc thư mục dự án:**

```
be-Hien-ne/
├── server.js                          # Backend API server (4208 dòng)
├── db.config.js                       # Cấu hình kết nối database
├── package.json                        # Dependencies và scripts
├── package-lock.json                  # Lock file dependencies
├── README.md                          # Tài liệu hướng dẫn
├── TIEU_LUAN_HE_CO_SO_DU_LIEU.md      # Tài liệu tiểu luận
│
├── CREATE_PHIEUNHAP.sql               # Script tạo bảng phiếu nhập
├── CREATE_LICHSU_HOATDONG.sql         # Script tạo bảng lịch sử
├── UPDATE_PHIEUNHAP_ADD_NCC.sql       # Script cập nhật nhà cung cấp
├── UPDATE_TRIGGER_NGAYNHAPCUOI.sql    # Script cập nhật trigger
│
├── src/
│   ├── pages/                         # Các trang HTML
│   │   ├── login.html                 # Trang đăng nhập
│   │   ├── admin.html                 # Trang quản trị (Admin)
│   │   ├── staff.html                 # Trang nhân viên bán hàng
│   │   └── warehouse.html             # Trang thủ kho
│   │
│   ├── js/                            # JavaScript files
│   │   ├── api.js                     # API client functions
│   │   ├── auth.js                     # Authentication logic
│   │   ├── app.js                     # Admin panel logic
│   │   └── pages.js                    # Page configurations
│   │
│   ├── css/                           # Stylesheets
│   │   └── style.css                  # Global styles
│   │
│   ├── partials/                      # HTML partials
│   │   ├── modal.html                 # Modal components
│   │   └── sidebar.html               # Sidebar component
│   │
│   └── assets/                        # Static assets
│       ├── 1.png                      # Background image
│       └── FM.jpg                      # Logo
│
└── node_modules/                      # Dependencies
```

**5.1.3. Cấu hình kết nối database:**

File `db.config.js` được thiết lập để kết nối với SQL Server:

```javascript
require('dotenv').config();
const sql = require('mssql');

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT),
    options: {
        encrypt: false,
        trustServerCertificate: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};
```

**5.1.4. Tạo database và các bảng:**

Hệ thống sử dụng database `HeThongQuanLyCuaHang_FMSTYLE` với 14 bảng chính:

1. **VITRI** - Quản lý vị trí nhân viên
2. **PHANLOAI_KH** - Phân loại khách hàng
3. **PHANLOAI_SANPHAM** - Phân loại sản phẩm
4. **KHUYENMAI** - Quản lý khuyến mãi
5. **NHANVIEN** - Thông tin nhân viên
6. **USERS** - Tài khoản đăng nhập
7. **KHACHHANG** - Thông tin khách hàng
8. **HANGHOA** - Thông tin hàng hóa
9. **HOADON** - Hóa đơn bán hàng
10. **CHITIET_HD** - Chi tiết hóa đơn
11. **PHIEUNHAP** - Phiếu nhập hàng
12. **CHITIET_PHIEUNHAP** - Chi tiết phiếu nhập
13. **NHACUNGCAP** - Nhà cung cấp
14. **LICHSU_HOATDONG** - Lịch sử hoạt động

**5.1.5. Thiết lập Backend Server:**

File `server.js` được cấu hình với Express.js:

```javascript
const express = require('express');
const cors = require('cors');
const { poolPromise, sql } = require('./db.config');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('src'));

// Khởi động server
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
```

**5.1.6. Thiết lập Frontend:**

Frontend được xây dựng với HTML5, CSS3 và Vanilla JavaScript, không sử dụng framework để đảm bảo hiệu năng và dễ bảo trì.

#### 5.2. Nhập dữ liệu cho các bảng

**5.2.1. Nhập dữ liệu danh mục gốc:**

**Bảng VITRI (Vị trí nhân viên):**
```sql
INSERT INTO VITRI (tenVT) VALUES 
(N'Quản lý'),
(N'Thủ kho'),
(N'Bán hàng'),
(N'Kế toán');
```

**Bảng PHANLOAI_KH (Phân loại khách hàng):**
```sql
INSERT INTO PHANLOAI_KH (maPLKH, tenPLKH, nguongChiMin) VALUES 
('LE', N'Lẻ', 0),
('THANHVIEN', N'Thành viên', 1000000),
('VIP', N'VIP', 5000000);
```

**Bảng PHANLOAI_SANPHAM (Phân loại sản phẩm):**
```sql
INSERT INTO PHANLOAI_SANPHAM (maPLSP, tenPLSP) VALUES 
('NAM', N'Nam'),
('NU', N'Nữ'),
('PK', N'Phụ kiện');
```

**5.2.2. Nhập dữ liệu nhân viên và tài khoản:**

**Tạo nhân viên Admin:**
```sql
-- Tạo vị trí Quản lý
INSERT INTO VITRI (tenVT) VALUES (N'Quản lý');

-- Tạo nhân viên admin
INSERT INTO NHANVIEN (tenNV, gioitinh, sdt, idVT) 
VALUES (N'Admin', N'Nam', '0123456789', 1);

-- Tạo tài khoản admin (password: admin123)
INSERT INTO USERS (username, passwordHash, role, idNV)
VALUES ('admin', 
        UPPER(CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', 'admin123'), 2)), 
        'admin', 
        1);
```

**5.2.3. Nhập dữ liệu khách hàng:**

```sql
-- Lấy id phân loại khách hàng mặc định
DECLARE @idPLKH INT = (SELECT TOP 1 id FROM PHANLOAI_KH WHERE maPLKH = 'THANHVIEN');

-- Nhập khách hàng mẫu
INSERT INTO KHACHHANG (tenKH, sdt, diachi, idPLKH) VALUES
(N'Nguyễn Văn A', '0901234567', N'123 Đường ABC, Quận 1, TP.HCM', @idPLKH),
(N'Trần Thị B', '0902345678', N'456 Đường XYZ, Quận 2, TP.HCM', @idPLKH);
```

**5.2.4. Nhập dữ liệu hàng hóa:**

```sql
-- Lấy id phân loại sản phẩm
DECLARE @idPLSP_NAM INT = (SELECT id FROM PHANLOAI_SANPHAM WHERE maPLSP = 'NAM');
DECLARE @idPLSP_NU INT = (SELECT id FROM PHANLOAI_SANPHAM WHERE maPLSP = 'NU');

-- Nhập hàng hóa mẫu
INSERT INTO HANGHOA (tenHang, idPLSP, soluong, gianhap, giaban, tonKhoToiThieu) VALUES
(N'Áo sơ mi nam trắng', @idPLSP_NAM, 50, 200000, 350000, 10),
(N'Áo thun nữ hồng', @idPLSP_NU, 30, 150000, 250000, 10),
(N'Quần jean nam', @idPLSP_NAM, 40, 400000, 600000, 10);
```

**5.2.5. Nhập dữ liệu nhà cung cấp:**

```sql
INSERT INTO NHACUNGCAP (tenNCC, sdt, email, diachi, trangthai) VALUES
(N'Công ty Thời trang ABC', '0281234567', 'contact@abc.com', N'789 Đường DEF, TP.HCM', 1),
(N'Công ty May mặc XYZ', '0282345678', 'info@xyz.com', N'321 Đường GHI, TP.HCM', 1);
```

**5.2.6. Nhập dữ liệu khuyến mãi:**

```sql
INSERT INTO KHUYENMAI (maKM, tenKM, phantramGiam, ngayBD, ngayKT) VALUES
('KM001', N'Giảm giá 10%', 10, '2024-01-01', '2024-12-31'),
('KM002', N'Giảm giá 20%', 20, '2024-06-01', '2024-06-30');
```

**5.2.7. Quy trình nhập dữ liệu qua giao diện:**

Hệ thống cung cấp các form nhập liệu trực quan:

- **Form nhập nhân viên**: Admin có thể thêm nhân viên mới với đầy đủ thông tin và phân quyền
- **Form nhập khách hàng**: Nhân viên có thể thêm khách hàng mới khi bán hàng
- **Form nhập hàng hóa**: Admin và thủ kho có thể thêm hàng hóa mới vào hệ thống
- **Form tạo phiếu nhập**: Thủ kho có thể tạo phiếu nhập hàng với chi tiết từng sản phẩm

#### 5.3. Thiết kế truy vấn dữ liệu

**5.3.1. Truy vấn cơ bản (SELECT):**

**Lấy danh sách hàng hóa:**
```sql
SELECT h.id, h.maHang, h.tenHang, pl.tenPLSP, 
       h.soluong, h.gianhap, h.giaban, h.ngayNhapCuoi
FROM HANGHOA h
JOIN PHANLOAI_SANPHAM pl ON h.idPLSP = pl.id
ORDER BY h.tenHang;
```

**Lấy danh sách hóa đơn với thông tin liên quan:**
```sql
SELECT h.id, h.maHD, h.ngayLap, h.tongTien,
       nv.maNV, nv.tenNV as tenNhanVien,
       kh.maKH, kh.tenKH as tenKhachHang,
       km.maKM, km.tenKM as tenKhuyenMai, km.phantramGiam
FROM HOADON h
LEFT JOIN NHANVIEN nv ON h.idNV = nv.id
LEFT JOIN KHACHHANG kh ON h.idKH = kh.id
LEFT JOIN KHUYENMAI km ON h.idKM = km.id
ORDER BY h.ngayLap DESC;
```

**5.3.2. Truy vấn với điều kiện (WHERE):**

**Tìm kiếm hàng hóa theo tên:**
```sql
SELECT * FROM HANGHOA 
WHERE tenHang LIKE N'%áo%'
ORDER BY tenHang;
```

**Lấy hàng hóa sắp hết (tồn kho thấp):**
```sql
SELECT maHang, tenHang, soluong, tonKhoToiThieu
FROM HANGHOA
WHERE soluong <= tonKhoToiThieu
ORDER BY soluong ASC;
```

**5.3.3. Truy vấn với JOIN:**

**Lấy chi tiết hóa đơn:**
```sql
SELECT h.maHD, h.ngayLap, h.tongTien,
       hh.maHang, hh.tenHang,
       ct.soluong, ct.dongia, ct.thanhTien
FROM HOADON h
JOIN CHITIET_HD ct ON h.id = ct.idHD
JOIN HANGHOA hh ON ct.idHang = hh.id
WHERE h.id = @idHD;
```

**5.3.4. Truy vấn thống kê (GROUP BY, AGGREGATE):**

**Thống kê doanh thu theo ngày:**
```sql
SELECT CAST(ngayLap AS DATE) as ngay,
       COUNT(*) as soHoaDon,
       SUM(tongTien) as tongDoanhThu
FROM HOADON
WHERE CAST(ngayLap AS DATE) BETWEEN @startDate AND @endDate
GROUP BY CAST(ngayLap AS DATE)
ORDER BY ngay DESC;
```

**Thống kê doanh thu theo nhân viên:**
```sql
SELECT nv.maNV, nv.tenNV,
       COUNT(*) as soHoaDon,
       SUM(h.tongTien) as tongDoanhThu
FROM HOADON h
JOIN NHANVIEN nv ON h.idNV = nv.id
WHERE CAST(h.ngayLap AS DATE) BETWEEN @startDate AND @endDate
GROUP BY nv.maNV, nv.tenNV
ORDER BY tongDoanhThu DESC;
```

**5.3.5. Truy vấn với Subquery:**

**Lấy tổng tiền từ chi tiết hóa đơn:**
```sql
UPDATE HOADON
SET tongTien = (
    SELECT ISNULL(SUM(thanhTien), 0)
    FROM CHITIET_HD
    WHERE idHD = HOADON.id
)
WHERE id = @idHD;
```

**5.3.6. Truy vấn phức tạp - Thống kê sản phẩm bán chạy:**
```sql
SELECT TOP 10
    hh.maHang, hh.tenHang,
    SUM(ct.soluong) as tongSoLuongBan,
    SUM(ct.thanhTien) as tongDoanhThu
FROM CHITIET_HD ct
JOIN HANGHOA hh ON ct.idHang = hh.id
JOIN HOADON h ON ct.idHD = h.id
WHERE CAST(h.ngayLap AS DATE) BETWEEN @startDate AND @endDate
GROUP BY hh.maHang, hh.tenHang
ORDER BY tongSoLuongBan DESC;
```

**5.3.7. Tối ưu hóa truy vấn:**

Hệ thống sử dụng các kỹ thuật tối ưu:

- **Indexes**: Tạo index trên các cột thường xuyên được tìm kiếm
  ```sql
  CREATE INDEX idx_HANGHOA_tenHang ON HANGHOA(tenHang);
  CREATE INDEX idx_HOADON_ngayLap ON HOADON(ngayLap DESC);
  CREATE INDEX idx_LSHD_idNV ON LICHSU_HOATDONG(idNV);
  ```

- **Computed Columns**: Sử dụng computed columns để tự động tính toán
  ```sql
  maHD AS ('HD' + RIGHT('000' + CAST(id AS VARCHAR(5)), 5)) PERSISTED
  thanhTien AS (soluong * dongia) PERSISTED
  ```

- **Parameterized Queries**: Sử dụng parameterized queries để tránh SQL injection
  ```javascript
  await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM HANGHOA WHERE id = @id');
  ```

#### 5.4. Thiết kế biểu mẫu

**5.4.1. Biểu mẫu đăng nhập (login.html):**

**Chức năng:**
- Xác thực người dùng với username và password
- Mã hóa password bằng SHA-256
- Chuyển hướng theo vai trò (admin, seller, warehouse)

**Thiết kế:**
- Form đơn giản với 2 trường: username và password
- Validation phía client và server
- Hiển thị thông báo lỗi rõ ràng
- Responsive design

**5.4.2. Biểu mẫu quản lý nhân viên (admin.html):**

**Chức năng:**
- Thêm nhân viên mới
- Sửa thông tin nhân viên
- Xóa nhân viên
- Tạo tài khoản đăng nhập cho nhân viên
- Phân quyền theo vai trò

**Các trường dữ liệu:**
- Tên nhân viên (bắt buộc)
- Giới tính (Nam/Nữ)
- Số điện thoại
- Vị trí (dropdown từ bảng VITRI)
- Trạng thái (Hoạt động/Khóa)

**5.4.3. Biểu mẫu quản lý khách hàng:**

**Chức năng:**
- Thêm khách hàng mới
- Cập nhật thông tin khách hàng
- Xem điểm tích lũy và tổng chi tiêu
- Phân loại khách hàng

**Các trường dữ liệu:**
- Tên khách hàng (bắt buộc)
- Số điện thoại (unique)
- Địa chỉ
- Phân loại khách hàng (dropdown)
- Điểm tích lũy (tự động tính)
- Tổng chi tiêu (tự động tính)

**5.4.4. Biểu mẫu quản lý hàng hóa:**

**Chức năng:**
- Thêm hàng hóa mới
- Cập nhật thông tin hàng hóa
- Xóa hàng hóa
- Theo dõi tồn kho
- Cảnh báo hàng sắp hết

**Các trường dữ liệu:**
- Tên hàng hóa (bắt buộc)
- Phân loại sản phẩm (dropdown)
- Số lượng tồn kho
- Giá nhập
- Giá bán
- Tồn kho tối thiểu
- Ngày nhập cuối (tự động cập nhật)

**5.4.5. Biểu mẫu tạo hóa đơn (staff.html):**

**Chức năng:**
- Chọn sản phẩm từ kho
- Thêm vào giỏ hàng
- Chọn/Thêm khách hàng
- Áp dụng mã giảm giá
- Sử dụng điểm tích lũy
- Chọn nhân viên bán hàng
- Tính tổng tiền tự động
- In hóa đơn/ Xuất PDF

**Luồng xử lý:**
1. Nhân viên chọn sản phẩm từ danh sách kho
2. Thêm sản phẩm vào giỏ hàng với số lượng
3. Chọn khách hàng hoặc thêm khách hàng mới
4. (Tùy chọn) Áp dụng mã giảm giá
5. (Tùy chọn) Sử dụng điểm tích lũy (1 điểm = 1.000đ)
6. Hệ thống tự động tính tổng tiền
7. Xác nhận và tạo hóa đơn
8. Trigger tự động trừ kho và tích điểm

**5.4.6. Biểu mẫu tạo phiếu nhập hàng:**

**Chức năng:**
- Chọn hàng hóa có sẵn hoặc thêm hàng hóa mới
- Nhập số lượng và giá nhập
- Chọn nhà cung cấp
- Chọn người nhập (quản lý/thủ kho)
- Tính tổng tiền tự động
- Tự động cộng hàng vào kho khi tạo phiếu nhập

**Các trường dữ liệu:**
- Ngày nhập (mặc định: ngày hiện tại)
- Người nhập (dropdown từ NHANVIEN)
- Nhà cung cấp (dropdown từ NHACUNGCAP, có thể NULL)
- Chi tiết sản phẩm:
  - Hàng hóa (dropdown hoặc thêm mới)
  - Số lượng (bắt buộc > 0)
  - Đơn giá nhập (bắt buộc)
  - Thành tiền (tự động tính)

**5.4.7. Biểu mẫu thống kê doanh thu:**

**Chức năng:**
- Lọc theo khoảng thời gian (ngày, tuần, tháng, quý, năm)
- Lọc theo nhân viên (tùy chọn)
- Hiển thị biểu đồ doanh thu
- Xuất báo cáo Excel/PDF

**Các tùy chọn lọc:**
- Khoảng thời gian: Từ ngày - Đến ngày
- Nhân viên: Tất cả hoặc chọn nhân viên cụ thể
- Sắp xếp: Theo doanh thu (cao → thấp) hoặc theo ngày

**5.4.8. Tính năng chung của các biểu mẫu:**

- **Validation**: Kiểm tra dữ liệu đầu vào trước khi submit
- **Auto-complete**: Gợi ý khi nhập liệu
- **Modal**: Sử dụng modal để thêm/sửa dữ liệu
- **Toast Notification**: Thông báo kết quả thao tác
- **Responsive**: Tương thích với nhiều kích thước màn hình
- **Loading State**: Hiển thị trạng thái đang xử lý

#### 5.5. Thiết kế báo cáo

**5.5.1. Báo cáo hóa đơn:**

**Báo cáo chi tiết hóa đơn (PDF):**
- Header: Logo, tên cửa hàng, địa chỉ
- Thông tin hóa đơn: Mã HD, ngày lập, nhân viên bán hàng
- Thông tin khách hàng: Tên, số điện thoại, địa chỉ
- Chi tiết sản phẩm: Bảng liệt kê sản phẩm, số lượng, đơn giá, thành tiền
- Tổng tiền: Tổng cộng, giảm giá (nếu có), điểm đã dùng, thành tiền cuối cùng
- Footer: Cảm ơn, chữ ký

**Xuất PDF sử dụng PDFKit:**
```javascript
const PDFDocument = require('pdfkit');
const doc = new PDFDocument();
// Đăng ký font tiếng Việt
registerVietnameseFonts(doc);
// Vẽ nội dung hóa đơn
// Stream PDF về client
```

**5.5.2. Báo cáo doanh thu:**

**Báo cáo doanh thu theo thời gian:**
- Thống kê theo ngày: Doanh thu từng ngày trong khoảng thời gian
- Thống kê theo tuần: Doanh thu từng tuần
- Thống kê theo tháng: Doanh thu từng tháng
- Thống kê theo quý: Doanh thu từng quý
- Thống kê theo năm: Doanh thu từng năm

**Báo cáo doanh thu theo nhân viên:**
- Danh sách nhân viên với số hóa đơn và tổng doanh thu
- Sắp xếp theo doanh thu từ cao đến thấp
- Hiển thị phần trăm đóng góp của mỗi nhân viên

**Biểu đồ doanh thu:**
- Sử dụng Chart.js để vẽ biểu đồ cột/đường
- Hiển thị trực quan xu hướng doanh thu
- Tương tác: Hover để xem chi tiết

**5.5.3. Báo cáo tồn kho:**

**Báo cáo hàng tồn kho:**
- Danh sách tất cả hàng hóa với số lượng tồn kho
- **Cảnh báo hàng sắp hết**: Sử dụng logic so sánh `số lượng tồn kho <= tồn kho tối thiểu` (trường `tonKhoToiThieu` trong bảng HANGHOA)
  - Mỗi sản phẩm có một ngưỡng tồn kho tối thiểu riêng (mặc định là 10)
  - Khi số lượng tồn kho giảm xuống bằng hoặc thấp hơn ngưỡng này, hệ thống sẽ cảnh báo
  - Ví dụ: Sản phẩm A có `tonKhoToiThieu = 15`, khi `soluong = 14` hoặc thấp hơn sẽ được cảnh báo
- Thống kê tổng giá trị tồn kho (tổng của `soluong * gianhap`)

**Báo cáo hàng bán chậm:**
- Xác định sản phẩm bán chậm dựa trên 3 tiêu chí:
  1. **Thời gian tồn kho**: Sau 30 ngày kể từ ngày nhập hàng cuối cùng không có hóa đơn nào bán sản phẩm này
  2. **Lượng bán thấp**: Số lượng bán trong 90 ngày gần nhất < 5 sản phẩm
  3. **Tồn kho cao**: Số lượng tồn kho > 50 sản phẩm (tồn kho nhiều nhưng bán chậm)
- Hiển thị top 10 sản phẩm bán chậm nhất, sắp xếp theo số lượng tồn kho giảm dần
- Mục đích: Hỗ trợ quyết định giảm giá, khuyến mãi hoặc ngừng nhập hàng

**Báo cáo nhập xuất kho:**
- Lịch sử nhập hàng (phiếu nhập)
- Lịch sử xuất hàng (hóa đơn)
- Tổng hợp số lượng nhập/xuất theo sản phẩm

**5.5.4. Báo cáo khách hàng:**

**Báo cáo khách hàng VIP:**
- Danh sách khách hàng có tổng chi tiêu cao nhất
- Điểm tích lũy của từng khách hàng
- Phân loại khách hàng theo mức độ thân thiết

**Báo cáo hành vi mua hàng:**
- Sản phẩm được mua nhiều nhất
- Thời gian mua hàng (giờ cao điểm)
- Giá trị đơn hàng trung bình

**5.5.5. Báo cáo lịch sử hoạt động:**

**Báo cáo hoạt động nhân viên:**
- Lịch sử các thao tác của nhân viên
- Thống kê số lượng hóa đơn/phiếu nhập theo nhân viên
- Thời gian hoạt động

**5.5.6. Xuất báo cáo:**

**Xuất Excel:**
- Sử dụng ExcelJS để tạo file Excel
- Định dạng: Header đậm, căn chỉnh, màu sắc
- Có thể xuất nhiều sheet trong một file

**Xuất PDF:**
- Sử dụng PDFKit để tạo file PDF
- Hỗ trợ font tiếng Việt
- Định dạng chuyên nghiệp

**Xuất JSON:**
- Xuất dữ liệu dạng JSON để tích hợp với hệ thống khác
- API endpoint: `/api/hoadon/:id/export?format=json`

**5.5.7. Dashboard tổng quan:**

**Dashboard Admin:**
- Tổng số nhân viên, khách hàng, hàng hóa
- Doanh thu hôm nay, tuần này, tháng này
- Biểu đồ doanh thu 7 ngày gần nhất
- Cảnh báo hàng sắp hết
- Top 5 sản phẩm bán chạy

**Dashboard Staff:**
- Doanh thu hôm nay
- Số hóa đơn đã tạo
- Hàng hóa sắp hết
- Thống kê nhanh

**Dashboard Warehouse (Thủ kho):**
- Tổng quan hàng hóa trong kho
- Quản lý phiếu nhập hàng
- Lịch sử hoạt động kho
- **Hệ thống cảnh báo thông minh:**

  **1. Cảnh báo hàng tồn kho thấp:**
  - Điều kiện: `số lượng tồn kho <= tồn kho tối thiểu` (sử dụng trường `tonKhoToiThieu` của từng sản phẩm)
  - Hiển thị danh sách sản phẩm cần nhập thêm
  - Màu cảnh báo: Cam (#ff9800)
  - Ví dụ: Nếu sản phẩm có `tonKhoToiThieu = 10` và `soluong = 8`, sản phẩm sẽ được cảnh báo

  **2. Cảnh báo hàng tồn bán chậm:**
  - Điều kiện xác định sản phẩm bán chậm:
    - **Điều kiện 1**: Sau 30 ngày kể từ ngày nhập hàng cuối (`ngayNhapCuoi`) không có bất kỳ hóa đơn nào bán sản phẩm này
    - **Điều kiện 2**: Số lượng bán trong 90 ngày gần nhất < 5 sản phẩm
    - **Điều kiện 3**: Tồn kho còn nhiều (số lượng > 50 sản phẩm)
  - Sản phẩm phải thỏa mãn cả 3 điều kiện trên mới được coi là bán chậm
  - Hiển thị top 10 sản phẩm bán chậm nhất, sắp xếp theo số lượng tồn kho (cao → thấp)
  - Màu cảnh báo: Hồng (#e91e63)
  - Mục đích: Giúp thủ kho và quản lý nhận biết sản phẩm cần có biện pháp xử lý (giảm giá, khuyến mãi, hoặc ngừng nhập)

  **Truy vấn SQL để lấy hàng tồn kho thấp:**
  ```sql
  SELECT maHang, tenHang, soluong, tonKhoToiThieu
  FROM HANGHOA
  WHERE soluong <= tonKhoToiThieu AND soluong > 0
  ORDER BY soluong ASC;
  ```

  **Truy vấn SQL để lấy hàng bán chậm:**
  ```sql
  -- Lấy sản phẩm có ngày nhập > 30 ngày
  SELECT h.id, h.maHang, h.tenHang, h.soluong, h.ngayNhapCuoi,
         ISNULL(SUM(ct.soluong), 0) as soLuongBan90Ngay
  FROM HANGHOA h
  LEFT JOIN CHITIET_HD ct ON h.id = ct.idHang
  LEFT JOIN HOADON hd ON ct.idHD = hd.id
  WHERE h.ngayNhapCuoi <= DATEADD(DAY, -30, GETDATE())
    AND h.soluong > 50
    AND (hd.ngayLap >= DATEADD(DAY, -90, GETDATE()) OR hd.ngayLap IS NULL)
  GROUP BY h.id, h.maHang, h.tenHang, h.soluong, h.ngayNhapCuoi
  HAVING ISNULL(SUM(ct.soluong), 0) < 5
  ORDER BY h.soluong DESC;
  ```

  **Giao diện thông báo:**
  - Modal thông báo với 2 section riêng biệt cho từng loại cảnh báo
  - Badge hiển thị số lượng cảnh báo trên nút "Thông Báo"
  - Tự động cập nhật khi có thay đổi dữ liệu
  - Hiển thị thông tin chi tiết: Mã sản phẩm, tên sản phẩm, số lượng tồn kho

#### 5.6. Kiểm thử và triển khai hệ thống

**5.6.1. Kiểm thử chức năng:**

**Kiểm thử đăng nhập và phân quyền:**
- ✅ Kiểm thử đăng nhập với username/password đúng
- ✅ Kiểm thử đăng nhập với thông tin sai
- ✅ Kiểm thử chuyển hướng theo vai trò (admin → admin.html, seller → staff.html)
- ✅ Kiểm thử truy cập trang không đúng quyền

**Kiểm thử CRUD các bảng:**
- ✅ **Nhân viên**: Thêm, sửa, xóa nhân viên
- ✅ **Khách hàng**: Thêm, sửa khách hàng
- ✅ **Hàng hóa**: Thêm, sửa, xóa hàng hóa
- ✅ **Vị trí**: Thêm, sửa, xóa vị trí
- ✅ **Phân loại**: Thêm, sửa, xóa phân loại

**Kiểm thử tạo hóa đơn:**
- ✅ Tạo hóa đơn với nhiều sản phẩm
- ✅ Kiểm tra tự động trừ kho sau khi tạo hóa đơn
- ✅ Kiểm tra tích điểm khách hàng (100.000đ = 1 điểm)
- ✅ Kiểm tra áp dụng mã giảm giá
- ✅ Kiểm tra sử dụng điểm tích lũy
- ✅ Kiểm tra tính tổng tiền chính xác

**Kiểm thử tạo phiếu nhập:**
- ✅ Tạo phiếu nhập với nhiều sản phẩm
- ✅ Kiểm tra tự động cộng kho sau khi tạo phiếu nhập
- ✅ Kiểm tra cập nhật giá nhập mới nhất
- ✅ Kiểm tra cập nhật ngày nhập cuối
- ✅ Kiểm tra tính tổng tiền phiếu nhập

**Kiểm thử xuất báo cáo:**
- ✅ Xuất PDF hóa đơn
- ✅ Xuất Excel danh sách hóa đơn
- ✅ Xuất JSON dữ liệu
- ✅ Kiểm tra font tiếng Việt trong PDF

**Kiểm thử thống kê:**
- ✅ Thống kê doanh thu theo ngày
- ✅ Thống kê doanh thu theo nhân viên
- ✅ Lọc theo khoảng thời gian
- ✅ Hiển thị biểu đồ chính xác

**5.6.2. Kiểm thử hiệu năng:**

**Kiểm thử tốc độ truy vấn:**
- Kiểm tra thời gian phản hồi của các API endpoint
- Tối ưu các truy vấn phức tạp bằng cách thêm index
- Sử dụng EXPLAIN PLAN để phân tích truy vấn

**Kiểm thử khả năng xử lý đồng thời:**
- Test với nhiều người dùng cùng lúc
- Kiểm tra connection pool (max: 10 connections)
- Kiểm tra timeout và error handling

**5.6.3. Kiểm thử bảo mật:**

**Kiểm thử xác thực:**
- Mã hóa password bằng SHA-256
- Kiểm tra SQL injection
- Kiểm tra XSS (Cross-Site Scripting)

**Kiểm thử phân quyền:**
- Kiểm tra người dùng không thể truy cập chức năng không có quyền
- Kiểm tra session management

**5.6.4. Triển khai hệ thống:**

**Chuẩn bị môi trường production:**

1. **Cấu hình Database:**
   - Cài đặt SQL Server trên server
   - Tạo database `HeThongQuanLyCuaHang_FMSTYLE`
   - Chạy các script SQL để tạo bảng và triggers
   - Cấu hình backup tự động

2. **Cấu hình Backend:**
   - Cài đặt Node.js trên server
   - Copy source code lên server
   - Cài đặt dependencies: `npm install --production`
   - Cấu hình file `.env`:
     ```
     DB_USER=your_username
     DB_PASSWORD=your_password
     DB_SERVER=your_server
     DB_DATABASE=HeThongQuanLyCuaHang_FMSTYLE
     DB_PORT=1433
     PORT=3000
     ```
   - Sử dụng PM2 để quản lý process:
     ```bash
     npm install -g pm2
     pm2 start server.js --name "fmstyle-api"
     pm2 save
     pm2 startup
     ```

3. **Cấu hình Frontend:**
   - Copy thư mục `src/` lên web server (Nginx/Apache)
   - Cấu hình reverse proxy để forward request đến Node.js backend
   - Cấu hình CORS cho production domain

4. **Cấu hình Nginx (ví dụ):**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       # Frontend static files
       location / {
           root /var/www/fmstyle/src;
           index login.html;
           try_files $uri $uri/ =404;
       }
       
       # Backend API
       location /api {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

5. **Cấu hình SSL:**
   - Cài đặt SSL certificate (Let's Encrypt)
   - Cấu hình HTTPS cho domain

6. **Backup và khôi phục:**
   - Thiết lập backup database định kỳ (hàng ngày)
   - Lưu trữ backup ở nhiều nơi
   - Test khôi phục dữ liệu định kỳ

**5.6.5. Hướng dẫn sử dụng sau khi triển khai:**

1. **Tạo tài khoản admin đầu tiên:**
   - Chạy script SQL để tạo admin (xem phần 5.2.2)
   - Đăng nhập với username: `admin`, password: `admin123`
   - Đổi mật khẩu ngay sau khi đăng nhập

2. **Nhập dữ liệu ban đầu:**
   - Nhập vị trí nhân viên
   - Nhập phân loại khách hàng
   - Nhập phân loại sản phẩm
   - Nhập hàng hóa ban đầu

3. **Tạo tài khoản cho nhân viên:**
   - Thêm nhân viên vào hệ thống
   - Tạo tài khoản đăng nhập cho nhân viên
   - Phân quyền phù hợp

**5.6.6. Bảo trì và cập nhật:**

- **Monitoring**: Sử dụng PM2 monitoring hoặc các công cụ khác
- **Logging**: Ghi log các lỗi và hoạt động quan trọng
- **Cập nhật**: Thường xuyên cập nhật dependencies để fix lỗi bảo mật
- **Backup**: Kiểm tra backup định kỳ
- **Performance**: Theo dõi hiệu năng và tối ưu khi cần thiết

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

