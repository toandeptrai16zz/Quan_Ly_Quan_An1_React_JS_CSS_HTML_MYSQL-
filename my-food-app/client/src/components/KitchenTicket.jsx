import React, { forwardRef } from "react";

const KitchenTicket = forwardRef(({ items, orderInfo }, ref) => {
  const listItems = Array.isArray(items) ? items : (items ? [items] : []);

  if (!listItems || listItems.length === 0) return null;

  return (
    <div ref={ref}>
      <style>
        {`
          @media print {
            @page {
              size: 50mm 30mm;
              margin: 0mm !important;
            }
            html, body {
              margin: 0mm !important;
              padding: 0mm !important;
              width: 50mm;
              height: 30mm;
            }
            * { -webkit-print-color-adjust: exact; }
          }
        `}
      </style>

      {listItems.map((item, index) => (
        // 1. KHUNG BAO NGOÀI: Đúng khổ giấy, CĂN GIỮA nội dung
        <div key={index} style={{
          width: '50mm',
          height: '30mm',
          pageBreakAfter: 'always',
          display: 'flex',
          justifyContent: 'center', // ✅ Căn giữa ngang (sửa lỗi lệch trái)
          alignItems: 'center',     // ✅ Căn giữa dọc (sửa lỗi lệch trên/dưới)
          overflow: 'hidden',
          margin: 0,
          padding: 0,
          background: '#fff'
        }}>
          {/* 2. HỘP NỘI DUNG: Nhỏ hơn khổ giấy để "lùi 4 góc vào trong" */}
          <div style={{
            width: '46mm',  /* Chừa 2mm lề trái/phải an toàn */
            height: '28mm', /* Chừa 1mm lề trên/dưới an toàn */
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            fontFamily: 'Arial, sans-serif',
            textAlign: 'center'
          }}>

            {/* --- HEADER: Tên Quán & Giờ --- */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderBottom: '1px solid #000', paddingBottom: '1px', marginBottom: '1px',
              fontSize: '9px', fontWeight: 'bold', lineHeight: '1'
            }}>
              <span style={{ textTransform: 'uppercase' }}>HEO MILK TEA</span>
              <span style={{ fontWeight: 'normal', fontSize: '8px' }}>
                {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* --- BODY: Tên Món & Size --- */}
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              justifyContent: 'center', alignItems: 'center', lineHeight: '1'
            }}>
              <div style={{
                fontSize: item.name.length > 15 ? '12px' : '14px',
                fontWeight: '900', marginBottom: '2px', width: '100%',
                wordWrap: 'break-word', display: '-webkit-box',
                WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
              }}>
                {item.name}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
                {item.size && (
                  <div style={{
                    fontSize: '12px', fontWeight: 'bold',
                    border: '1.5px solid #000', borderRadius: '50%',
                    width: '18px', height: '18px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {item.size}
                  </div>
                )}
                {item.note && (
                  <div style={{ fontSize: '10px', fontStyle: 'italic', fontWeight: 'bold', maxWidth: '30mm', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    ({item.note})
                  </div>
                )}
              </div>
            </div>

            {/* --- FOOTER: Loại đơn & Số lượng --- */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
              borderTop: '1px solid #000', paddingTop: '1px', marginTop: '1px',
              fontSize: '10px', fontWeight: 'bold', lineHeight: '1'
            }}>
              <span>{orderInfo ? orderInfo.split("-")[0] : ""}</span>
              <span style={{ fontSize: '14px' }}>SL: {item.quantity}</span>
            </div>

          </div>
        </div>
      ))}
    </div>
  );
});

export default KitchenTicket;