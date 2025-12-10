// src/components/Bill.jsx
import React, { forwardRef } from "react";
import "./Bill.css";

const Bill = forwardRef(({ order }, ref) => {
  if (!order) return null; // Sửa lại đây để trả về null

  const { table, items, total, createdAt, customerName } = order;

  return (
    <div ref={ref} className="bill-container" style={{ width: 300, padding: 16, fontFamily: 'monospace' }}>
      <h2 style={{ textAlign: 'center', margin: 0 }}>HEO MILK TEA</h2>
      <div style={{ textAlign: 'center', fontSize: 12 }}>Địa chỉ: ...</div>
      <hr />
      <div>Bàn: <b>{table || 'Mang về'}</b></div>
      {customerName && <div>Khách: {customerName}</div>}
      <div>Thời gian: {createdAt ? new Date(createdAt).toLocaleString() : new Date().toLocaleString()}</div>
      <hr />
      <table style={{ width: '100%', fontSize: 14 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Món</th>
            <th style={{ textAlign: 'center' }}>SL</th>
            <th style={{ textAlign: 'right' }}>Giá</th>
          </tr>
        </thead>
        <tbody>
          {items && items.map((item, idx) => (
            <tr key={idx}>
              <td>{item.name}</td>
              <td style={{ textAlign: 'center' }}>{item.quantity}</td>
              <td style={{ textAlign: 'right' }}>{item.price * item.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <hr />
      <div style={{ textAlign: 'right', fontWeight: 'bold' }}>Tổng: {total} đ</div>
      <div style={{ textAlign: 'center', fontSize: 12, marginTop: 8 }}>Cảm ơn quý khách!</div>
    </div>
  );
});

export default Bill;