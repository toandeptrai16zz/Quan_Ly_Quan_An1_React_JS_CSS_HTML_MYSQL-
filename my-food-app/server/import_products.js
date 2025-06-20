const fs = require('fs');
const pool = require('./db');

async function importProducts() {
    const data = fs.readFileSync('./data/products.json', 'utf8');
    const products = JSON.parse(data);

    for (const p of products) {
        await pool.query(
            'INSERT INTO products (id, name, price, category, image, description) VALUES (?, ?, ?, ?, ?, ?)',
            [
                p.id,
                p.name,
                p.price,
                // Gán category theo tab nếu chưa có
                p.tab === 1 ? 'Mỳ Cay' :
                    p.tab === 2 ? 'Đồ Ăn Vặt' :
                        p.tab === 3 ? 'Trà Sữa' :
                            p.tab === 4 ? 'Nước Ép' :
                                p.tab === 5 ? 'Đồ Uống Khác' : '',
                p.image || '',
                p.description || ''
            ]
        );
    }
    console.log('Import thành công!');
    process.exit(0);
}

importProducts().catch(err => {
    console.error(err);
    process.exit(1);
});