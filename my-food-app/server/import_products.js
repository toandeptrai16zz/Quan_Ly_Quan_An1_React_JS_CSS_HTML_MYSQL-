// File: server/import_products.js
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'my_food_app',
    port: process.env.DB_PORT || 3306
});

async function importData() {
    try {
        console.log("🔌 Đang kết nối MySQL...");
        const connection = await pool.getConnection();

        // 1. Đọc file JSON
        const jsonPath = path.join(__dirname, 'data', 'products.json');
        console.log(`📂 Đang đọc dữ liệu từ: ${jsonPath}`);

        if (!fs.existsSync(jsonPath)) {
            throw new Error(`Không tìm thấy file tại ${jsonPath}`);
        }

        const rawData = fs.readFileSync(jsonPath);
        let products = JSON.parse(rawData);

        console.log(`🚀 Tìm thấy ${products.length} món ăn.`);

        // =====================================================
        // 2. XỬ LÝ DANH MỤC (CATEGORIES) - QUAN TRỌNG
        // =====================================================
        console.log("🔨 Đang xử lý và tạo Danh mục...");

        // Bước 2a: Chuẩn hóa dữ liệu (Điền "Chưa đặt tên" nếu thiếu)
        products = products.map(p => {
            // Nếu category rỗng hoặc null thì gán mặc định
            if (!p.category || p.category.trim() === "") {
                p.category = "Chưa đặt tên";
            }
            return p;
        });

        // Bước 2b: Lấy danh sách các danh mục duy nhất (Unique)
        const uniqueCategories = [...new Set(products.map(p => p.category))];
        console.log(`📋 Danh sách danh mục cần tạo:`, uniqueCategories);

        // Bước 2c: Chèn Danh mục vào bảng categories (Dùng INSERT IGNORE để không lỗi nếu đã có)
        for (let i = 0; i < uniqueCategories.length; i++) {
            const catName = uniqueCategories[i];
            // Chèn danh mục và tự động đánh số thứ tự (order_index) theo thứ tự xuất hiện
            await connection.query(
                `INSERT IGNORE INTO categories (name, order_index) VALUES (?, ?)`,
                [catName, i + 1]
            );
        }
        console.log("✅ Đã tạo xong các Danh mục (Tab).");

        // =====================================================
        // 3. NẠP SẢN PHẨM (PRODUCTS)
        // =====================================================
        console.log("🚀 Đang nạp sản phẩm vào Database...");

        const sql = `
            REPLACE INTO products 
            (id, name, price, priceS, priceM, priceL, category, image, description, tab) 
            VALUES ?
        `;

        const values = products.map(p => [
            p.id,
            p.name,
            p.price || 0,
            p.priceS || null,
            p.priceM || null,
            p.priceL || null,
            p.category,     // Lúc này chắc chắn đã có tên (hoặc "Chưa đặt tên")
            p.image || '',
            p.description || '',
            p.tab || 1
        ]);

        await connection.query(sql, [values]);

        console.log("✅ IMPORT THÀNH CÔNG! Menu và Danh mục đã lên đầy đủ.");
        process.exit(0);

    } catch (error) {
        console.error("❌ Lỗi Import:", error.message);
        process.exit(1);
    }
}

importData();