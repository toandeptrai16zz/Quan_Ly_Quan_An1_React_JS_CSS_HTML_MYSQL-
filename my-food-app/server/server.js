const express = require('express');
const cors = require('cors');
const pool = require('./db'); // Kết nối MySQL

const app = express();
app.use(cors());
app.use(express.json());

// ==========================
// API SẢN PHẨM (MENU)
// ==========================

// Lấy danh sách sản phẩm
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi truy vấn dữ liệu' });
  }
});

// Thêm sản phẩm mới
app.post('/api/products', async (req, res) => {
  let { name, price, priceM, priceL, category, image, description } = req.body;
  price = price === '' ? null : price !== undefined ? Number(price) : null;
  priceM = priceM === '' ? null : priceM !== undefined ? Number(priceM) : null;
  priceL = priceL === '' ? null : priceL !== undefined ? Number(priceL) : null;
  try {
    const [result] = await pool.query(
      'INSERT INTO products (name, price, priceM, priceL, category, image, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, price, priceM, priceL, category, image, description]
    );
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi thêm sản phẩm' });
  }
});

// Cập nhật sản phẩm
app.put('/api/products/:id', async (req, res) => {
  const id = Number(req.params.id);
  let { name, price, priceM, priceL, category, image, description } = req.body;
  price = price === '' ? null : price !== undefined ? Number(price) : null;
  priceM = priceM === '' ? null : priceM !== undefined ? Number(priceM) : null;
  priceL = priceL === '' ? null : priceL !== undefined ? Number(priceL) : null;
  try {
    const [result] = await pool.query(
      'UPDATE products SET name=?, price=?, priceM=?, priceL=?, category=?, image=?, description=? WHERE id=?',
      [name, price, priceM, priceL, category, image, description, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi cập nhật sản phẩm' });
  }
});

// Xóa sản phẩm
app.delete('/api/products/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi xóa sản phẩm' });
  }
});

// ===============================================================
// API THANH TOÁN VÀ DOANH THU
// ===============================================================

// THÊM MỘT THANH TOÁN MỚI (API MỚI)
app.post('/api/payments', async (req, res) => {
  const { order_type, order_id, orders, total, method } = req.body;
  if (!orders || !total || !method) {
    return res.status(400).json({ error: 'Thiếu thông tin thanh toán' });
  }
  try {
    const ordersJson = JSON.stringify(orders);
    const query = `
      INSERT INTO payments (order_type, order_id, orders, total, method) 
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [order_type, order_id, ordersJson, total, method]);
    const [newPayment] = await pool.query('SELECT * FROM payments WHERE id = ?', [result.insertId]);
    res.status(201).json(newPayment[0]);
  } catch (err) {
    console.error('Lỗi khi thêm thanh toán:', err);
    res.status(500).json({ error: 'Lỗi khi lưu thông tin thanh toán' });
  }
});

// Lấy lịch sử thanh toán
app.get('/api/payments', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM payments ORDER BY time DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi truy vấn lịch sử thanh toán' });
  }
});

// Lấy báo cáo doanh thu theo ngày
app.get('/api/revenue', async (req, res) => {
  try {
    const query = `
      SELECT 
        DATE(time) as date, 
        SUM(total) as daily_revenue,
        COUNT(id) as transaction_count
      FROM payments 
      GROUP BY DATE(time) 
      ORDER BY date DESC;
    `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi truy vấn doanh thu' });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});