# Heo Milk Tea - He thong quan ly ban hang POS

Hệ thống quản lý bán hàng (POS) chuyên nghiệp dành cho quán Trà Sữa & Mì Cay. Được thiết kế tối ưu cho quy trình gọi món, quản lý bàn, in hóa đơn/tem nhãn tự động và báo cáo doanh thu. Hệ thống sử dụng kiến trúc Microservices (thông qua Docker) để đảm bảo tính ổn định và dễ dàng triển khai.

---

## 1. TÍNH NĂNG NỔI BẬT

### Quản Lý Bán Hàng (POS)
* **Quản lý bàn ăn:** Trạng thái bàn thời gian thực (Trống/Có khách), hiển thị số lượng món và tổng tiền ngay trên thẻ bàn.
* **Order thông minh:** Hỗ trợ gọi món theo Size (S/M/L), Topping, Ghi chú.
* **Thanh toán:**
    * Tự động tính tiền thừa.
    * **Tích hợp VietQR:** Tự động sinh mã QR chuyển khoản theo đúng số tiền và nội dung bàn.
* **In ấn tự động:**
    * **Hóa đơn (Bill):** In nhiệt khổ K80.
    * **Tem nhãn (Sticker):** Logic lọc thông minh - Chỉ in tem cho đồ pha chế (Trà sữa, Sinh tố...), tự động loại bỏ nước đóng chai (Coca, Sting...) để tiết kiệm giấy.

### Quản Lý Menu & Danh Mục
* **Dynamic Menu:** Thêm/Sửa/Xóa món ăn và danh mục ngay trên giao diện.
* **Sắp xếp Tab:** Kéo thả để sắp xếp vị trí các Tab danh mục. Đổi tên Tab linh hoạt.
* **Đồng bộ dữ liệu:** Hệ thống Import/Export dữ liệu qua JSON, giúp chuyển sang máy mới dễ dàng.

### Báo Cáo
* **Quản lý ca:** Chốt ca, bàn giao tiền mặt/chuyển khoản.
* **Doanh thu:** Xem báo cáo theo ngày, tháng, quý.

---

## 2. CÔNG NGHỆ SỬ DỤNG (TECH STACK)

| Thành phần | Công nghệ | Mô tả |
| :--- | :--- | :--- |
| **Frontend** | ReactJS, Vite | Giao diện mượt mà, tối ưu trải nghiệm người dùng. |
| **Backend** | Node.js, Express | Xử lý API, logic in ấn và nghiệp vụ. |
| **Database** | MySQL 8.0 | Lưu trữ dữ liệu, hỗ trợ lưu đơn hàng phức tạp (JSON/LONGTEXT). |
| **DevOps** | Docker | Đóng gói ứng dụng, cài đặt 1 chạm (One-click run). |
| **Thư viện** | pdf-to-printer, qrcode | Hỗ trợ in ấn và tạo mã QR. |

---

## 3. CẤU TRÚC DỰ ÁN
```bash
my-food-app/
├── client/
│   ├── public/
│   │   ├── heo-milk-tea-logo.png
│   │   └── vite.svg
│   ├── src/
│   │   ├── assets/
│   │   │   ├── banner.jpg
│   │   │   └── react.svg
│   │   ├── components/
│   │   │   ├── Bill.css
│   │   │   ├── Bill.jsx
│   │   │   ├── ConfirmModal.jsx
│   │   │   ├── FloatingCart.jsx
│   │   │   ├── Footer.css
│   │   │   ├── Footer.jsx
│   │   │   ├── Header.css
│   │   │   ├── Header.jsx
│   │   │   ├── KitchenTicket.jsx
│   │   │   ├── ProductCard.jsx
│   │   │   ├── ProductList.css
│   │   │   ├── ProductList.jsx
│   │   │   ├── SuccessNotification.jsx
│   │   │   └── SuccessNotification.module.css
│   │   ├── data/
│   │   │   └── products.js
│   │   ├── pages/
│   │   │   ├── HistoryPage.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── HomePage.css
│   │   │   ├── HomePage.jsx
│   │   │   ├── Menu.jsx
│   │   │   ├── TableManager.jsx
│   │   │   └── TakeawayManager.jsx
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .dockerignore
│   ├── Dockerfile
│   ├── eslint.config.js
│   ├── index.html
│   ├── nginx.conf
│   ├── package-lock.json
│   ├── package.json
│   ├── README.md
│   └── vite.config.js
├── server/
│   ├── data/
│   │   └── products.json
│   ├── tmp/
│   ├── .dockerignore
│   ├── .gitignore
│   ├── db.js
│   ├── Dockerfile
│   ├── export_products.js
│   ├── import_products.js
│   ├── package-lock.json
│   ├── package.json
│   ├── server.js
│   └── setup_database.js
├── .vscode/
│   └── settings.json
├── docker-compose.yml
├── package.json
└── README.md
```

## 4. HƯỚNG DẪN CÀI ĐẶT

### Yêu cầu:
* Máy tính đã cài đặt **Docker Desktop**.

### Bước 1: Khởi chạy hệ thống
Mở Terminal tại thư mục gốc dự án và chạy lệnh:

docker-compose up -d --build

(Lệnh này sẽ tự động tải môi trường, dựng Database, tạo bảng và khởi chạy Server).

### Bước 2: Nạp dữ liệu Menu (Lần đầu tiên)
Để nạp Menu và Danh mục từ file chuẩn (server/data/products.json), chạy lệnh:

docker-compose exec backend node import_products.js

### Bước 3: Truy cập
* **Web App:** http://localhost:3000
* **Database:** localhost:3306

---

## 5. QUY TRÌNH CHUYỂN MÁY (MIGRATION)

Để mang phần mềm sang máy tính khác mà không mất dữ liệu Menu:

1.  **Tại máy cũ:** Chạy lệnh sau để lưu Menu mới nhất ra file JSON:
    docker-compose exec backend node export_products.js

2.  **Sao chép:** Copy toàn bộ thư mục dự án "my-food-app" sang máy mới.

3.  **Tại máy mới:**
    * Cài Docker Desktop.
    * Chạy: docker-compose up -d --build
    * Chạy: docker-compose exec backend node import_products.js

---

## 6. KHẮC PHỤC LỖI THƯỜNG GẶP

**Lỗi "Unknown column 'priceS'":**
* Nguyên nhân: Database cũ chưa cập nhật cấu trúc mới.
* Khắc phục: Chạy lệnh `docker-compose exec backend node setup_database.js`.

**Không in được Tem/Bill:**
* Đảm bảo máy in đã được cài driver trên Windows và đặt làm **Default Printer**.