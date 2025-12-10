// File: server/export_products.js
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Cấu hình kết nối
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'my_food_app',
    port: process.env.DB_PORT || 3306
});

async function exportData() {
    try {
        console.log("🔌 Đang kết nối MySQL để xuất dữ liệu...");
        const connection = await pool.getConnection();

        // 1. Lấy toàn bộ sản phẩm
        // Sắp xếp theo ID hoặc TAB để nhìn cho đẹp
        const [rows] = await connection.query('SELECT * FROM products ORDER BY tab ASC, id ASC');

        console.log(`📂 Tìm thấy ${rows.length} món ăn trong Database.`);

        // 2. Định dạng dữ liệu cho đẹp (Làm sạch các trường null nếu muốn)
        const cleanData = rows.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            priceS: item.priceS,
            priceM: item.priceM,
            priceL: item.priceL,
            category: item.category,
            image: item.image || "",
            description: item.description || "",
            tab: item.tab || 1 // Quan trọng: Giữ lại thông tin Tab
        }));

        // 3. Ghi vào file JSON (Ghi đè file cũ)
        const jsonPath = path.join(__dirname, 'products.json');
        fs.writeFileSync(jsonPath, JSON.stringify(cleanData, null, 4), 'utf8');

        console.log(`✅ ĐÃ XUẤT THÀNH CÔNG! File 'products.json' đã được cập nhật.`);
        console.log("👉 Bây giờ bạn có thể copy thư mục này sang máy khác.");

        process.exit(0);

    } catch (error) {
        console.error("❌ Lỗi Export:", error);
        process.exit(1);
    }
}

exportData();