const mysql = require('mysql2/promise');

// Cấu hình kết nối
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456', // Đảm bảo pass đúng
    database: process.env.DB_NAME || 'my_food_app',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Hàm khởi tạo bảng (Chạy 1 lần khi server start)
async function initTables() {
    try {
        const connection = await pool.getConnection();

        // 1. Tạo bảng categories (Sửa lỗi bạn đang gặp)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        `);

        // 2. Tạo bảng products
        await connection.query(`
            CREATE TABLE IF NOT EXISTS products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                price INT,
                priceM INT,
                priceL INT,
                category VARCHAR(255),
                image TEXT,
                description TEXT
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        `);

        // 3. Tạo bảng payments
        await connection.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_type VARCHAR(50),
                order_id VARCHAR(255),
                orders JSON,
                total INT,
                method VARCHAR(50),
                time DATETIME
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        `);

        // 4. Tạo bảng shifts (Kết ca)
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

        console.log("✅ Đã kiểm tra/khởi tạo Tables thành công!");
        connection.release();

        // Sau khi có bảng thì mới seed dữ liệu mẫu
        seedDefaultCategories();

    } catch (error) {
        console.error("❌ Lỗi khởi tạo Database:", error);
    }
}

// Hàm thêm danh mục mặc định
async function seedDefaultCategories() {
    try {
        const defaultCategories = [
            "Mỳ Cay",
            "Đồ Ăn Vặt",
            "Trà Sữa",
            "Nước Ép",
            "Đồ Uống Khác",
            "Topping thêm"
        ];

        for (const category of defaultCategories) {
            // Kiểm tra xem danh mục đã có chưa
            const [rows] = await pool.query('SELECT id FROM categories WHERE name = ?', [category]);
            if (rows.length === 0) {
                await pool.query('INSERT INTO categories (name) VALUES (?)', [category]);
                console.log(`+ Đã thêm danh mục mẫu: ${category}`);
            }
        }
    } catch (error) {
        console.error('❌ Lỗi seed categories:', error);
    }
}

// Gọi hàm khởi tạo khi file được load
initTables();

module.exports = pool;