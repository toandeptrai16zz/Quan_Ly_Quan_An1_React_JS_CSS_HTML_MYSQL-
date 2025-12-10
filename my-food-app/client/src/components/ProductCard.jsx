import React, { useState, useEffect, useMemo } from 'react';

const ProductCard = ({ product, onAddToCart, isManageMode, onEdit, onDelete }) => {
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState(null);
  const [note, setNote] = useState('');

  // ✅ Kiểm tra 3 size S/M/L
  const hasSizes = useMemo(() => {
    return (product.priceS != null && Number(product.priceS) > 0) ||
      (product.priceM != null && Number(product.priceM) > 0) ||
      (product.priceL != null && Number(product.priceL) > 0);
  }, [product]);

  const availableSizes = useMemo(() => {
    const sizes = [];
    if (hasSizes) {
      if (product.priceS != null && Number(product.priceS) > 0) sizes.push("S"); // ✅ Thêm S
      if (product.priceM != null && Number(product.priceM) > 0) sizes.push("M");
      if (product.priceL != null && Number(product.priceL) > 0) sizes.push("L");
    }
    return sizes;
  }, [product, hasSizes]);

  useEffect(() => {
    // Mặc định chọn size đầu tiên có sẵn
    if (hasSizes) {
      setSize(availableSizes[0] || null);
    } else {
      setSize(null);
    }
    setQuantity(1);
    setNote('');
  }, [product, hasSizes, availableSizes]);

  const getPrice = () => {
    if (size === "S") return Number(product.priceS) || 0; // ✅ Giá S
    if (size === "M") return Number(product.priceM) || 0;
    if (size === "L") return Number(product.priceL) || 0;
    return Number(product.price) || 0;
  };

  const handleAddToCartClick = () => {
    if (typeof onAddToCart === 'function') {
      onAddToCart({ ...product, price: getPrice() }, note, quantity, size);
      setQuantity(1);
      setNote('');
    }
  };

  const price = getPrice();
  const hasImage = product.image && product.image.trim() !== '';

  return (
    <div
      className="product-card"
      onClick={handleAddToCartClick}
      style={{
        display: 'flex', flexDirection: 'column',
        background: '#fff', borderRadius: 12,
        padding: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #eee',
        height: 'auto',
        minHeight: '200px',
        transition: 'transform 0.1s, box-shadow 0.1s',
        position: 'relative',
        cursor: price > 0 ? 'pointer' : 'default',
        userSelect: 'none'
      }}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      {isManageMode && (
        <div
          style={{ position: 'absolute', top: 8, right: 8, zIndex: 5, display: 'flex', gap: 6 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={onEdit} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 12 }}>Sửa</button>
          <button onClick={onDelete} style={{ background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 12 }}>Xóa</button>
        </div>
      )}

      {hasImage && (
        <img src={product.image} alt={product.name} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 8, marginBottom: 12 }} />
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginTop: hasImage ? 0 : 8 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px 0', color: '#333', textAlign: 'left', lineHeight: 1.3 }}>{product.name}</h3>

        {/* Chọn Size (Chỉ hiện nếu có size) */}
        {hasSizes && availableSizes.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }} onClick={(e) => e.stopPropagation()}>
            {availableSizes.map(s => (
              <button
                key={s}
                onClick={() => setSize(s)}
                style={{
                  flex: 1, padding: '6px 0',
                  border: size === s ? '2px solid #1976d2' : '1px solid #ddd',
                  background: size === s ? '#e3f2fd' : '#fff',
                  color: size === s ? '#1976d2' : '#666',
                  borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 14
                }}
              >
                Size {s}
              </button>
            ))}
          </div>
        )}

        <div style={{ fontSize: 20, fontWeight: 800, color: '#d32f2f', marginBottom: 12 }}>
          {price > 0 ? price.toLocaleString() + 'đ' : '--'}
        </div>

        <input
          type="text"
          placeholder="Ghi chú..."
          value={note}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => setNote(e.target.value)}
          style={{
            width: '100%', padding: '8px', marginBottom: 10,
            borderRadius: 6, border: '1px solid #ddd', fontSize: 14,
            boxSizing: 'border-box'
          }}
        />

        <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: 8, background: '#f9f9f9' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setQuantity(q => Math.max(1, q - 1))} style={{ padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 'bold' }}>-</button>
            <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 600 }}>{quantity}</span>
            <button onClick={() => setQuantity(q => q + 1)} style={{ padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 'bold' }}>+</button>
          </div>

          <button
            disabled={price <= 0}
            style={{
              flex: 1, background: '#1976d2', color: '#fff',
              border: 'none', borderRadius: 8, fontWeight: 600,
              cursor: price > 0 ? 'pointer' : 'not-allowed',
              opacity: price > 0 ? 1 : 0.6
            }}
          >
            Thêm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;