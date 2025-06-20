# My Food App

Đây là ứng dụng web quản lý gọi món ăn và đồ uống cho quán trà sữa & mì cay. Ứng dụng sử dụng React và Vite cho giao diện người dùng, Express cho máy chủ API.

## Cấu trúc dự án

Dự án gồm hai thư mục chính: `client` (giao diện) và `server` (máy chủ).

### Client

Thư mục `client` chứa mã nguồn giao diện React:

- **index.html**: Tệp HTML chính, là điểm khởi đầu của ứng dụng React.
- **src/**: Chứa toàn bộ mã nguồn React (components, pages, styles).
  - **components/**: Các thành phần giao diện dùng lại như Header, Footer, ProductList, ProductCard, Cart, Checkout.
  - **pages/**: Các trang chính của ứng dụng như Home, Menu, CartPage, CheckoutPage.
  - **data/**: Dữ liệu sản phẩm mẫu.
- **package.json**: Thông tin dự án, các thư viện và lệnh phát triển.
- **vite.config.js**: Cấu hình cho Vite, sử dụng plugin React.

### Server

Thư mục `server` chứa mã nguồn máy chủ Express:

- **server.js**: Thiết lập máy chủ Express, định nghĩa API và xử lý yêu cầu từ client.
- **package.json**: Thông tin dự án server, các thư viện và lệnh sử dụng.

## Hướng dẫn sử dụng

1. **Clone mã nguồn**:
   ```bash
   git clone <repository-url>
   cd my-food-app
   ```

2. **Cài đặt thư viện**:
   - Cho client:
     ```bash
     cd client
     npm install
     ```
   - Cho server:
     ```bash
     cd ../server
     npm install
     ```

3. **Chạy ứng dụng**:
   - Khởi động server:
     ```bash
     cd server
     node server.js
     ```
   - Khởi động client:
     ```bash
     cd ../client
     npm run dev
     ```

4. **Mở trình duyệt** và truy cập `http://localhost:3000` để sử dụng ứng dụng.

## Tính năng

- Xem thực đơn món ăn, đồ uống.
- Thêm món vào giỏ hàng.
- Thanh toán đặt món.
- Giao diện đáp ứng trên cả điện thoại và máy tính.

## Giấy phép

Dự án sử dụng giấy phép