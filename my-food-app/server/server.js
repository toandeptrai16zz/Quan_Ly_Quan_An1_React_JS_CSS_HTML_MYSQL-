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

// ==========================
// API KẾT CA DOANH THU
// ==========================

// Kết ca thủ công (POST /api/shifts/close)
app.post('/api/shifts/close', async (req, res) => {
  try {
    // Lấy ngày hôm nay (theo múi giờ VN)
    const now = new Date();
    const vnDate = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const today = vnDate.toISOString().slice(0, 10);

    // Kiểm tra đã kết ca chưa
    const [exist] = await pool.query('SELECT * FROM shifts WHERE shift_date = ?', [today]);
    if (exist.length > 0) {
      return res.status(400).json({ error: 'Đã kết ca ngày hôm nay!' });
    }

    // Tính tổng doanh thu hôm nay
    const [rows] = await pool.query(
      `SELECT 
        SUM(total) as total,
        SUM(CASE WHEN method='cash' OR method='tiền mặt' THEN total ELSE 0 END) as cash,
        SUM(CASE WHEN method='bank' OR method='chuyển khoản' THEN total ELSE 0 END) as bank
      FROM payments
      WHERE DATE(time) = ?`, [today]
    );
    const { total = 0, cash = 0, bank = 0 } = rows[0] || {};

    // Lưu kết ca
    await pool.query(
      'INSERT INTO shifts (shift_date, total, cash, bank) VALUES (?, ?, ?, ?)',
      [today, total || 0, cash || 0, bank || 0]
    );

    res.json({ success: true, date: today, total, cash, bank });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi kết ca' });
  }
});

// Lấy lịch sử kết ca (GET /api/shifts)
app.get('/api/shifts', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM shifts ORDER BY shift_date DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi truy vấn kết ca' });
  }
});

// Lấy tổng kết ca theo tháng/quý/năm
app.get('/api/shifts/summary', async (req, res) => {
  try {
    // Theo tháng
    const [byMonth] = await pool.query(`
      SELECT 
        YEAR(shift_date) as year, 
        MONTH(shift_date) as month, 
        SUM(total) as total
      FROM shifts
      GROUP BY year, month
      ORDER BY year DESC, month DESC
    `);

    // Theo quý
    const [byQuarter] = await pool.query(`
      SELECT 
        YEAR(shift_date) as year, 
        QUARTER(shift_date) as quarter, 
        SUM(total) as total
      FROM shifts
      GROUP BY year, quarter
      ORDER BY year DESC, quarter DESC
    `);

    // Theo năm
    const [byYear] = await pool.query(`
      SELECT 
        YEAR(shift_date) as year, 
        SUM(total) as total
      FROM shifts
      GROUP BY year
      ORDER BY year DESC
    `);

    res.json({ byMonth, byQuarter, byYear });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi truy vấn tổng kết ca' });
  }
});

// ==========================
// TỰ ĐỘNG KẾT CA LÚC 00:01 (giờ server +7)
// ==========================
const cron = require('node-cron');
cron.schedule('1 0 * * *', async () => {
  try {
    const now = new Date();
    const vnDate = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const today = vnDate.toISOString().slice(0, 10);

    // Nếu chưa kết ca thì tự động kết ca
    const [exist] = await pool.query('SELECT * FROM shifts WHERE shift_date = ?', [today]);
    if (exist.length === 0) {
      // Tính tổng doanh thu hôm nay
      const [rows] = await pool.query(
        `SELECT 
          SUM(total) as total,
          SUM(CASE WHEN method='cash' OR method='tiền mặt' THEN total ELSE 0 END) as cash,
          SUM(CASE WHEN method='bank' OR method='chuyển khoản' THEN total ELSE 0 END) as bank
        FROM payments
        WHERE DATE(time) = ?`, [today]
      );
      const { total = 0, cash = 0, bank = 0 } = rows[0] || {};

      await pool.query(
        'INSERT INTO shifts (shift_date, total, cash, bank) VALUES (?, ?, ?, ?)',
        [today, total || 0, cash || 0, bank || 0]
      );
      console.log(`[AUTO SHIFT] Đã tự động kết ca ngày ${today}`);
    }
  } catch (err) {
    console.error('[AUTO SHIFT] Lỗi tự động kết ca:', err);
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});