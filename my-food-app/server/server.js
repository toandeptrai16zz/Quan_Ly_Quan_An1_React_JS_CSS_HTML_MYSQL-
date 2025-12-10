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

// Thêm sản phẩm mới (Đã thêm priceS)
app.post('/api/products', async (req, res) => {
  // ✅ Thêm tab vào danh sách nhận
  let { name, price, priceS, priceM, priceL, category, image, description, tab } = req.body;

  // Xử lý dữ liệu số
  price = price === '' ? null : price !== undefined ? Number(price) : null;
  priceS = priceS === '' ? null : priceS !== undefined ? Number(priceS) : null;
  priceM = priceM === '' ? null : priceM !== undefined ? Number(priceM) : null;
  priceL = priceL === '' ? null : priceL !== undefined ? Number(priceL) : null;

  try {
    const [result] = await pool.query(
      'INSERT INTO products (name, price, priceS, priceM, priceL, category, image, description, tab) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, price, priceS, priceM, priceL, category, image, description, tab || 1] // Mặc định tab 1 nếu thiếu
    );
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi thêm sản phẩm' });
  }
});

// Cập nhật sản phẩm (Đã thêm priceS)
app.put('/api/products/:id', async (req, res) => {
  const id = Number(req.params.id);
  // ✅ Thêm tab
  let { name, price, priceS, priceM, priceL, category, image, description, tab } = req.body;
  // Xử lý dữ liệu số

  price = price === '' ? null : price !== undefined ? Number(price) : null;
  priceS = priceS === '' ? null : priceS !== undefined ? Number(priceS) : null;
  priceM = priceM === '' ? null : priceM !== undefined ? Number(priceM) : null;
  priceL = priceL === '' ? null : priceL !== undefined ? Number(priceL) : null;

  try {
    const [result] = await pool.query(
      // ✅ Thêm tab vào câu SQL Update
      'UPDATE products SET name=?, price=?, priceS=?, priceM=?, priceL=?, category=?, image=?, description=?, tab=? WHERE id=?',
      [name, price, priceS, priceM, priceL, category, image, description, tab, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
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

// ==========================
// API DANH MỤC (CATEGORIES) - ĐÃ NÂNG CẤP
// ==========================

// 1. Lấy danh mục (Sắp xếp theo thứ tự order_index)
app.get('/api/categories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT name FROM categories ORDER BY order_index ASC');
    const categories = rows.map(row => row.name);
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// 2. Thêm danh mục mới
app.post('/api/categories', async (req, res) => {
  const { category } = req.body;
  if (!category || !category.trim()) return res.status(400).json({ error: 'Tên danh mục không được để trống' });
  try {
    const [existing] = await pool.query('SELECT id FROM categories WHERE name = ?', [category.trim()]);
    if (existing.length > 0) return res.status(400).json({ error: 'Danh mục đã tồn tại' });

    // Lấy order_index lớn nhất để thêm vào cuối
    const [maxOrder] = await pool.query('SELECT MAX(order_index) as maxIdx FROM categories');
    const nextOrder = (maxOrder[0].maxIdx || 0) + 1;

    const [result] = await pool.query('INSERT INTO categories (name, order_index) VALUES (?, ?)', [category.trim(), nextOrder]);
    res.status(201).json({ id: result.insertId, name: category.trim() });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi thêm danh mục' });
  }
});

// 3. Xóa danh mục
app.delete('/api/categories/:name', async (req, res) => {
  const { name } = req.params;
  const decodedName = decodeURIComponent(name);
  try {
    const [result] = await pool.query('DELETE FROM categories WHERE name = ?', [decodedName]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Không tìm thấy danh mục' });

    // Cập nhật sản phẩm thuộc danh mục này về NULL
    await pool.query('UPDATE products SET category = NULL WHERE category = ?', [decodedName]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi xóa danh mục' });
  }
});

// 4. ĐỔI TÊN DANH MỤC (RENAME)
app.put('/api/categories/rename', async (req, res) => {
  const { oldName, newName } = req.body;
  if (!oldName || !newName) return res.status(400).json({ error: 'Thiếu thông tin' });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Cập nhật bảng categories
    await connection.query('UPDATE categories SET name = ? WHERE name = ?', [newName, oldName]);

    // Cập nhật bảng products (để các món ăn cập nhật theo tên mới)
    await connection.query('UPDATE products SET category = ? WHERE category = ?', [newName, oldName]);

    await connection.commit();
    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: 'Lỗi đổi tên danh mục' });
  } finally {
    connection.release();
  }
});

// 5. SẮP XẾP THỨ TỰ (REORDER)
app.post('/api/categories/reorder', async (req, res) => {
  const { categories } = req.body; // Mảng tên danh mục theo thứ tự mới: ['Mỳ Cay', 'Nước Ép', 'Trà Sữa']
  if (!categories || !Array.isArray(categories)) return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });

  try {
    // Cập nhật order_index cho từng danh mục
    for (let i = 0; i < categories.length; i++) {
      await pool.query('UPDATE categories SET order_index = ? WHERE name = ?', [i, categories[i]]);
    }
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi sắp xếp' });
  }
});

// ==========================
// API THANH TOÁN (BẢN VÁ LỖI THÔNG MINH)
// ==========================
app.post('/api/payments', async (req, res) => {
  try {
    console.log("📥 Dữ liệu nhận được:", req.body); // In log để debug nếu lỗi

    // 1. Lấy tất cả các biến có thể có
    let { order_type, order_id, orders, total, method, methodId } = req.body;

    // 2. LOGIC THÔNG MINH: Chấp nhận cả method HOẶC methodId
    const finalMethod = method || methodId;

    // 3. Xử lý ID đơn hàng (Nếu mang về không gửi ID thì tự tạo)
    if (!order_id) {
      order_id = `TAKEAWAY_${Date.now()}`;
    }

    // 4. Kiểm tra dữ liệu (Sử dụng finalMethod)
    if (!order_type || !orders || total === undefined || !finalMethod) {
      console.error("❌ Thiếu thông tin:", { order_type, order_id, hasOrders: !!orders, total, finalMethod });
      return res.status(400).json({ error: 'Thiếu thông tin thanh toán (Kiểm tra lại method/methodId)' });
    }

    const ordersJson = JSON.stringify(orders);
    const now = new Date();
    const vnDate = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const timeStr = vnDate.toISOString().slice(0, 19).replace('T', ' ');

    const [result] = await pool.query(
      'INSERT INTO payments (order_type, order_id, orders, total, method, time) VALUES (?, ?, ?, ?, ?, ?)',
      // Sử dụng finalMethod để lưu vào DB
      [order_type, order_id, ordersJson, total, finalMethod, timeStr]
    );

    const [newPayment] = await pool.query('SELECT * FROM payments WHERE id = ?', [result.insertId]);
    res.status(201).json(newPayment[0]);

  } catch (err) {
    console.error("❌ Lỗi Server:", err);
    res.status(500).json({ error: 'Lỗi server: ' + err.message });
  }
});

app.get('/api/payments', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM payments ORDER BY time DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi truy vấn lịch sử thanh toán' });
  }
});

app.get('/api/revenue', async (req, res) => {
  try {
    const query = `SELECT DATE(time) as date, SUM(total) as daily_revenue, COUNT(id) as transaction_count FROM payments GROUP BY DATE(time) ORDER BY date DESC;`;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi truy vấn doanh thu' });
  }
});

// ==========================
// API KẾT CA
// ==========================
app.post('/api/shifts/close', async (req, res) => {
  try {
    const now = new Date();
    const vnDate = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const today = vnDate.toISOString().slice(0, 10);
    const [exist] = await pool.query('SELECT * FROM shifts WHERE shift_date = ?', [today]);
    if (exist.length > 0) return res.status(400).json({ error: 'Đã kết ca ngày hôm nay!' });

    const [rows] = await pool.query(
      `SELECT SUM(total) as total, SUM(CASE WHEN method='cash' OR method='tiền mặt' THEN total ELSE 0 END) as cash, SUM(CASE WHEN method='bank' OR method='chuyển khoản' THEN total ELSE 0 END) as bank FROM payments WHERE DATE(time) = ?`, [today]
    );
    const { total = 0, cash = 0, bank = 0 } = rows[0] || {};
    await pool.query('INSERT INTO shifts (shift_date, total, cash, bank) VALUES (?, ?, ?, ?)', [today, total || 0, cash || 0, bank || 0]);
    res.json({ success: true, date: today, total, cash, bank });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi kết ca' });
  }
});

app.get('/api/shifts', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM shifts ORDER BY shift_date DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi truy vấn kết ca' });
  }
});

app.get('/api/shifts/summary', async (req, res) => {
  try {
    const [byMonth] = await pool.query(`SELECT YEAR(shift_date) as year, MONTH(shift_date) as month, SUM(total) as total FROM shifts GROUP BY year, month ORDER BY year DESC, month DESC`);
    const [byQuarter] = await pool.query(`SELECT YEAR(shift_date) as year, QUARTER(shift_date) as quarter, SUM(total) as total FROM shifts GROUP BY year, quarter ORDER BY year DESC, quarter DESC`);
    const [byYear] = await pool.query(`SELECT YEAR(shift_date) as year, SUM(total) as total FROM shifts GROUP BY year ORDER BY year DESC`);
    res.json({ byMonth, byQuarter, byYear });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi truy vấn tổng kết ca' });
  }
});

// Auto close shift
const cron = require('node-cron');
cron.schedule('1 0 * * *', async () => {
  try {
    const now = new Date();
    const vnDate = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const today = vnDate.toISOString().slice(0, 10);
    const [exist] = await pool.query('SELECT * FROM shifts WHERE shift_date = ?', [today]);
    if (exist.length === 0) {
      const [rows] = await pool.query(`SELECT SUM(total) as total, SUM(CASE WHEN method='cash' OR method='tiền mặt' THEN total ELSE 0 END) as cash, SUM(CASE WHEN method='bank' OR method='chuyển khoản' THEN total ELSE 0 END) as bank FROM payments WHERE DATE(time) = ?`, [today]);
      const { total = 0, cash = 0, bank = 0 } = rows[0] || {};
      await pool.query('INSERT INTO shifts (shift_date, total, cash, bank) VALUES (?, ?, ?, ?)', [today, total || 0, cash || 0, bank || 0]);
      console.log(`[AUTO SHIFT] Đã tự động kết ca ngày ${today}`);
    }
  } catch (err) { console.error('[AUTO SHIFT] Lỗi:', err); }
});

// ==========================
// API IN HÓA ĐƠN
// ==========================
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { print } = require('pdf-to-printer');
const fs = require('fs');
const path = require('path');
const PRINTER_NAME = 'Xprinter XP-350B';
const TMP_DIR = path.join(__dirname, 'tmp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

app.post('/api/print-bill', async (req, res) => {
  const billData = req.body;
  try {
    const filename = `bill_${Date.now()}.pdf`;
    const filepath = path.join(TMP_DIR, filename);
    const doc = new PDFDocument({ size: [142, 236], margin: 5 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    doc.fontSize(10).text('--- HOA DON ---', { align: 'center' });
    doc.moveDown(0.2);
    doc.fontSize(8).text(`Ban: ${billData.table}`, { align: 'center' });
    doc.text(`${billData.time}`, { align: 'center' });
    doc.moveDown(0.2);
    doc.text('----------------', { align: 'center' });
    doc.moveDown(0.2);

    billData.items.forEach(item => {
      let name = item.name.length > 12 ? item.name.slice(0, 12) + '…' : item.name;
      let qty = String(item.qty);
      let price = String(item.price);
      doc.fontSize(7).text(`${name.padEnd(13)} x${qty} ${price}đ`);
    });
    doc.moveDown(0.2);
    doc.text('----------------', { align: 'center' });
    doc.moveDown(0.2);
    doc.fontSize(9).text(`Tổng: ${billData.total}đ`, { align: 'right' });
    doc.moveDown(0.3);

    if (billData.qr) {
      doc.fontSize(7).text('Quét mã để thanh toán:', { align: 'center' });
      const qrDataUrl = await QRCode.toDataURL(billData.qr, { margin: 0, width: 80 });
      const qrBase64 = qrDataUrl.replace(/^data:image\/png;base64,/, '');
      const qrBuffer = Buffer.from(qrBase64, 'base64');
      doc.image(qrBuffer, (142 - 60) / 2, doc.y, { width: 60, align: 'center' });
      doc.moveDown(0.2);
    }
    doc.fontSize(8).text('Cảm ơn quý khách!', { align: 'center' });
    doc.end();

    stream.on('finish', async () => {
      try {
        await print(filepath, { printer: PRINTER_NAME });
        fs.unlink(filepath, () => { });
        res.json({ success: true, message: 'Đã gửi lệnh in!' });
      } catch (err) {
        fs.unlink(filepath, () => { });
        res.status(500).json({ success: false, message: 'Lỗi in hóa đơn', error: err.message });
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi tạo/in hóa đơn', error: err.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});