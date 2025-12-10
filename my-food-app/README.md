# My Food App

Đây là ứng dụng web quản lý gọi món ăn và đồ uống cho quán trà sữa & mì cay. Ứng dụng gồm hai phần chính: **client** (giao diện người dùng) và **server** (máy chủ API).

## Cấu trúc thư mục

```
my-food-app/
│
├── client/         # Giao diện người dùng React + Vite
│   ├── public/
│   ├── src/
│   │   ├── components/   # Các thành phần giao diện (Header, Footer, ProductList, ...)
│   │   ├── data/         # Dữ liệu mẫu (products.js)
│   │   ├── pages/        # Các trang (HomePage, Menu, TableManager, ...)
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── ...
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/         # Máy chủ Express + MySQL
│   ├── data/               # Dữ liệu mẫu (products.json)
│   ├── db.js               # Kết nối MySQL
│   ├── import_products.js  # Script nhập dữ liệu mẫu vào database
│   ├── server.js           # API chính
│   ├── package.json
│   └── ...
│
└── README.md
```

## Hướng dẫn sử dụng

### 1. Cài đặt thư viện

**Client:**
```bash
cd client
npm install
```

**Server:**
```bash
cd server
npm install express mysql2 cors body-parser pdfkit

```

### 2. Khởi động MySQL và tạo database

- Tạo database tên `my_food_app` và cấu hình tài khoản trong `server/db.js` cho phù hợp.

### 3. Nhập dữ liệu mẫu (tùy chọn)

```bash
cd server
node import_products.js
```

### 4. Chạy server

```bash
cd server
npm start
```
(Mặc định chạy ở cổng 5000)

### 5. Chạy client

```bash
cd ../client
npm run dev
```
(Mặc định chạy ở cổng 3000)

### 6. Truy cập ứng dụng

Mở trình duyệt và vào địa chỉ:  
[http://localhost:3000](http://localhost:3000)

## Tính năng chính

- Quản lý lịch sử đơn hàng
- Thêm, sửa, xóa sản phẩm (qua API)
- Giao diện thân thiện, dễ sử dụng
#Chạy dự án
- cd my-food-app
npm run dev
## Giấy phép

Dự án sử dụng giấy phép MIT.