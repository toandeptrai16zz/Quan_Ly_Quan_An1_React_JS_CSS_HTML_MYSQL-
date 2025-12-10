// File: server/setup_database.js
const mysql = require('mysql2/promise');

// Cấu hình kết nối
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'my_food_app',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function setup() {
    try {
        const connection = await pool.getConnection();
        console.log("🔌 Đã kết nối đến MySQL...");

        // 1. TẠO BẢNG CATEGORIES (Cho máy mới - Đã có sẵn order_index)
        console.log("🔨 Đang kiểm tra bảng 'categories'...");
        await connection.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                order_index INT DEFAULT 0  -- ✅ Cột này cho máy mới
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        `);

        // 👉 LOGIC VÁ LỖI CHO MÁY CŨ (Máy code của bạn)
        // Cố gắng thêm cột order_index. Nếu có rồi thì MySQL báo lỗi, ta bỏ qua lỗi đó.
        try {
            await connection.query(`ALTER TABLE categories ADD COLUMN order_index INT DEFAULT 0`);
            console.log("✨ Đã tự động thêm cột 'order_index' vào bảng categories cũ.");
        } catch (err) {
            // Lỗi 1060: Duplicate column name -> Nghĩa là cột đã có rồi, không sao cả.
            if (err.errno !== 1060) {
                console.log("ℹ️ Bảng categories đã đủ cột (hoặc lỗi khác bỏ qua):", err.message);
            }
        }

        // 2. TẠO BẢNG PRODUCTS (Đã có Tab và Size)
        console.log("🔨 Đang kiểm tra bảng 'products'...");
        await connection.query(`
            CREATE TABLE IF NOT EXISTS products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                price INT,
                priceS INT,
                priceM INT,
                priceL INT,
                category VARCHAR(255),
                image TEXT,
                description TEXT,
                tab INT DEFAULT 1
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        `);

        // 3. TẠO BẢNG PAYMENTS
        console.log("🔨 Đang kiểm tra bảng 'payments'...");
        await connection.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_type VARCHAR(50),
                order_id VARCHAR(255),
                orders LONGTEXT,
                total INT,
                method VARCHAR(50),
                time DATETIME
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        `);

        // 4. TẠO BẢNG SHIFTS
        console.log("🔨 Đang kiểm tra bảng 'shifts'...");
        await connection.query(`
            CREATE TABLE IF NOT EXISTS shifts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                shift_date DATE,
                total INT,
                cash INT,
                bank INT,
                closedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        `);

        console.log("✅ DATABASE SETUP COMPLETE! (Sẵn sàng cho mọi máy)");
        process.exit(0);
    } catch (error) {
        console.error("❌ Lỗi Setup:", error);
        process.exit(1);
    }
}

setup();