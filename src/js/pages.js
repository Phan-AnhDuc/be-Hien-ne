// Khai báo các page (phongban, vitri…)
const pages = {
    phongban: {
        title: 'Quản Lý Phòng Ban',
        api: 'phongban',
        fields: [
            { name: 'maPB', label: 'Mã Phòng Ban', type: 'text', required: true },
            { name: 'tenPB', label: 'Tên Phòng Ban', type: 'text', required: true }
        ],
        displayFields: ['maPB', 'tenPB']
    },
    vitri: {
        title: 'Quản Lý Vị Trí',
        api: 'vitri',
        fields: [
            { name: 'maVT', label: 'Mã Vị Trí', type: 'text', required: true },
            { name: 'tenVT', label: 'Tên Vị Trí', type: 'text', required: true }
        ],
        displayFields: ['maVT', 'tenVT']
    },
    nhacungcap: {
        title: 'Quản Lý Nhà Cung Cấp',
        api: 'nhacungcap',
        fields: [
            { name: 'maNCC', label: 'Mã NCC', type: 'text', required: true },
            { name: 'tenNCC', label: 'Tên NCC', type: 'text', required: true },
            { name: 'diachi', label: 'Địa Chỉ', type: 'text', required: false },
            { name: 'sdt', label: 'SĐT', type: 'text', required: false },
            { name: 'email', label: 'Email', type: 'email', required: false }
        ],
        displayFields: ['maNCC', 'tenNCC', 'diachi', 'sdt', 'email']
    },
    phanloaikh: {
        title: 'Quản Lý Phân Loại Khách Hàng',
        api: 'phanloaikh',
        fields: [
            { name: 'maPLKH', label: 'Mã PLKH', type: 'text', required: true },
            { name: 'tenPLKH', label: 'Tên PLKH', type: 'text', required: true },
            { name: 'tongchi', label: 'Tổng Chi', type: 'number', required: false },
            { name: 'diemtichluy', label: 'Điểm Tích Lũy', type: 'number', required: false }
        ],
        displayFields: ['maPLKH', 'tenPLKH', 'tongchi', 'diemtichluy']
    },
    khachhang: {
        title: 'Quản Lý Khách Hàng',
        api: 'khachhang',
        fields: [
            { name: 'maKH', label: 'Mã KH', type: 'text', required: true },
            { name: 'tenKH', label: 'Tên KH', type: 'text', required: true },
            { name: 'maPLKH', label: 'Mã PLKH', type: 'text', required: true },
            { name: 'diachi', label: 'Địa Chỉ', type: 'text', required: false },
            { name: 'sdt', label: 'SĐT', type: 'text', required: false }
        ],
        displayFields: ['maKH', 'tenKH', 'maPLKH', 'diachi', 'sdt']
    },
    nhanvien: {
        title: 'Quản Lý Nhân Viên',
        api: 'nhanvien',
        fields: [
            { name: 'maNV', label: 'Mã NV', type: 'text', required: true },
            { name: 'tenNV', label: 'Tên NV', type: 'text', required: true },
            { name: 'diachi', label: 'Địa Chỉ', type: 'text', required: false },
            { name: 'sdt', label: 'SĐT', type: 'text', required: false },
            { name: 'gioitinh', label: 'Giới Tính', type: 'select', options: [{ value: '', label: 'Chọn' }, { value: '1', label: 'Nam' }, { value: '0', label: 'Nữ' }], required: false },
            { name: 'luong', label: 'Lương', type: 'number', required: false },
            { name: 'namsinh', label: 'Năm Sinh', type: 'number', required: false },
            { name: 'ngaylamviec', label: 'Ngày Làm Việc', type: 'date', required: false },
            { name: 'maPB', label: 'Mã PB', type: 'text', required: true },
            { name: 'maVT', label: 'Mã VT', type: 'text', required: true }
        ],
        displayFields: ['maNV', 'tenNV', 'sdt', 'gioitinh', 'luong', 'maPB', 'maVT']
    },
    lichsutheodoinv: {
        title: 'Quản Lý Lịch Sử Theo Dõi',
        api: 'lichsutheodoinv',
        fields: [
            { name: 'maLS', label: 'Mã LS', type: 'text', required: true },
            { name: 'thang', label: 'Tháng', type: 'number', required: false },
            { name: 'nam', label: 'Năm', type: 'number', required: false }
        ],
        displayFields: ['maLS', 'thang', 'nam']
    },
    phieutheodoinv: {
        title: 'Quản Lý Phiếu Theo Dõi NV',
        api: 'phieutheodoinv',
        fields: [
            { name: 'maLS', label: 'Mã LS', type: 'text', required: true },
            { name: 'maNV', label: 'Mã NV', type: 'text', required: true },
            { name: 'ngaylam', label: 'Ngày Làm', type: 'date', required: false },
            { name: 'ngaynghi', label: 'Ngày Nghỉ', type: 'date', required: false },
            { name: 'tongngaylam', label: 'Tổng Ngày Làm', type: 'number', required: false },
            { name: 'tongngaynghi', label: 'Tổng Ngày Nghỉ', type: 'number', required: false },
            { name: 'ngaytangca', label: 'Ngày Tăng Ca', type: 'date', required: false }
        ],
        displayFields: ['maLS', 'maNV', 'tongngaylam', 'tongngaynghi'],
        compositeKey: ['maLS', 'maNV']
    },
    hanghoa: {
        title: 'Quản Lý Hàng Hóa',
        api: 'hanghoa',
        fields: [
            { name: 'maHang', label: 'Mã Hàng', type: 'text', required: true },
            { name: 'loaihang', label: 'Loại Hàng', type: 'text', required: true },
            { name: 'soluong', label: 'Số Lượng', type: 'number', required: true },
            { name: 'ngaynhaphang', label: 'Ngày Nhập', type: 'date', required: false },
            { name: 'donvi', label: 'Đơn Vị', type: 'text', required: false },
            { name: 'maNCC', label: 'Mã NCC', type: 'text', required: true },
            { name: 'gianhapvao', label: 'Giá Nhập Vào', type: 'number', required: true },
            { name: 'giabanra', label: 'Giá Bán Ra', type: 'number', required: true }
        ],
        displayFields: ['maHang', 'loaihang', 'soluong', 'donvi', 'gianhapvao', 'giabanra']
    },
    phieunhap: {
        title: 'Quản Lý Phiếu Nhập',
        api: 'phieunhap',
        fields: [
            { name: 'maPN', label: 'Mã PN', type: 'text', required: true },
            { name: 'maNCC', label: 'Mã NCC', type: 'text', required: true },
            { name: 'ngaynhap', label: 'Ngày Nhập', type: 'date', required: false },
            { name: 'maNV', label: 'Mã NV', type: 'text', required: true }
        ],
        displayFields: ['maPN', 'maNCC', 'ngaynhap', 'maNV']
    },
    chitietphieunhap: {
        title: 'Quản Lý Chi Tiết Phiếu Nhập',
        api: 'chitietphieunhap',
        fields: [
            { name: 'maPN', label: 'Mã PN', type: 'text', required: true },
            { name: 'maHang', label: 'Mã Hàng', type: 'text', required: true },
            { name: 'soluongnhap', label: 'Số Lượng Nhập', type: 'number', required: true }
        ],
        displayFields: ['maPN', 'maHang', 'soluongnhap'],
        compositeKey: ['maPN', 'maHang']
    },
    hoadon: {
        title: 'Quản Lý Hóa Đơn',
        api: 'hoadon',
        fields: [
            { name: 'maHD', label: 'Mã HD', type: 'text', required: true },
            { name: 'maNV', label: 'Mã NV', type: 'text', required: true },
            { name: 'maKH', label: 'Mã KH', type: 'text', required: false },
            { name: 'ngaylap', label: 'Ngày Lập', type: 'date', required: true },
            { name: 'codeMGG', label: 'Mã Giảm Giá', type: 'text', required: false }
        ],
        displayFields: ['maHD', 'maNV', 'maKH', 'ngaylap', 'tongtien', 'tiengiamgia'],
        customActions: true
    },
    chitiethd: {
        title: 'Quản Lý Chi Tiết Hóa Đơn',
        api: 'chitiethd',
        fields: [
            { name: 'maHD', label: 'Mã HD', type: 'text', required: true },
            { name: 'maHang', label: 'Mã Hàng', type: 'text', required: true },
            { name: 'soluong', label: 'Số Lượng', type: 'number', required: true },
            { name: 'dongia', label: 'Đơn Giá', type: 'number', required: true }
        ],
        displayFields: ['maHD', 'maHang', 'soluong', 'dongia', 'tongtien'],
        compositeKey: ['maHD', 'maHang']
    },
    magiamgia: {
        title: 'Quản Lý Mã Giảm Giá',
        api: 'magiamgia',
        fields: [
            { name: 'maMGG', label: 'Mã MGG', type: 'text', required: true },
            { name: 'code', label: 'Mã Code', type: 'text', required: true },
            { name: 'phantramgiam', label: 'Phần Trăm Giảm (%)', type: 'number', required: true },
            { name: 'ngaybatdau', label: 'Ngày Bắt Đầu', type: 'date', required: false },
            { name: 'ngayketthuc', label: 'Ngày Kết Thúc', type: 'date', required: false },
            { name: 'trangthai', label: 'Trạng Thái', type: 'select', options: [{ value: '1', label: 'Còn hiệu lực' }, { value: '0', label: 'Hết hiệu lực' }], required: false },
            { name: 'gioihan', label: 'Giới Hạn Sử Dụng', type: 'number', required: false },
            { name: 'mota', label: 'Mô Tả', type: 'text', required: false }
        ],
        displayFields: ['maMGG', 'code', 'phantramgiam', 'ngaybatdau', 'ngayketthuc', 'trangthai', 'soluongsudung', 'gioihan']
    }
};

