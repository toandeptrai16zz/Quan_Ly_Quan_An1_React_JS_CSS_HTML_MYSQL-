import React, { useState, useEffect, useMemo } from 'react';

const WATER_CATEGORIES = ["Trà Sữa", "Nước Ép", "Đồ Uống Khác"];

const ProductCard = ({
  product,
  onAddToCart,
  isManageMode,
  onEdit,
  onDelete
}) => {
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    const isWater = WATER_CATEGORIES.includes(product.category);
    const availableSizes = [];
    if (isWater) {
      if (product.priceM != null && !isNaN(Number(product.priceM))) availableSizes.push("M");
      if (product.priceL != null && !isNaN(Number(product.priceL))) availableSizes.push("L");
    }
    setSize(availableSizes[0] || null);
    setQuantity(1);
    setNote('');
  }, [product.id, product.category, product.priceM, product.priceL]);

  const getPrice = () => {
    if (size === "L") return Number(product.priceL) || 0;
    if (size === "M") return Number(product.priceM) || 0;
    return Number(product.price) || 0;
  };

  const handleAddToCartClick = () => {
    if (typeof onAddToCart === 'function') {
      const priceForCart = getPrice();
      onAddToCart({ ...product, price: priceForCart }, note, quantity, size);
      setQuantity(1);
      setNote('');
    } else {
      console.error("LỖI: Prop 'onAddToCart' không được cung cấp hoặc không phải là một hàm.");
      alert("Lỗi: Chức năng thêm vào giỏ hàng chưa được cấu hình đúng.");
    }
  };

  const handleDecreaseQuantity = () => {
    setQuantity(q => (q > 1 ? q - 1 : 1));
  };

  const handleIncreaseQuantity = () => {
    setQuantity(q => q + 1);
  };

  let imageSrc = product.image && product.image.trim() !== '' ? product.image : '/no-image.png';

  const availableSizes = useMemo(() => {
    const sizes = [];
    if (WATER_CATEGORIES.includes(product.category)) {
      if (product.priceM != null && !isNaN(Number(product.priceM))) sizes.push("M");
      if (product.priceL != null && !isNaN(Number(product.priceL))) sizes.push("L");
    }
    return sizes;
  }, [product.category, product.priceM, product.priceL]);

  const price = getPrice();

  const stepperButtonStyle = {
    background: '#f0f0f0',
    border: '1px solid #ddd',
    color: '#333',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '18px'
  };

  return (
    <div
      className="product-card"
      style={{
        display: 'flex', flexDirection: 'column', height: '100%', position: 'relative',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)', borderRadius: 16, background: '#fff',
        padding: 16,
      }}
    >
      {isManageMode && (
        <div style={{ position: 'absolute', top: 8, right: 8, display: "flex", gap: 8, zIndex: 2 }}>
          <button onClick={onEdit} className="manage-btn" style={{ background: "#1976d2", padding: '6px 10px', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Sửa</button>
          <button onClick={onDelete} className="manage-btn" style={{ background: "#e53935", padding: '6px 10px', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Xóa</button>
        </div>
      )}
      <img
        src={imageSrc} alt={product.name} className="product-image"
        style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 12, marginBottom: 12 }}
      />

      {/* FIX: Bọc phần nội dung chính (tên, size, giá) vào một div với flex-grow: 1 */}
      {/* Thao tác này sẽ đẩy các phần tử hành động (ghi chú, nút) xuống dưới cùng */}
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <h2 className="product-name" style={{ fontSize: 17, fontWeight: 600, margin: "0 0 8px 0" }}>{product.name}</h2>

        {availableSizes.length > 0 && (
          <div style={{ marginBottom: 10, display: 'flex', gap: '8px' }}>
            {availableSizes.map(s => (
              <button
                key={s}
                onClick={() => setSize(s)}
                style={{
                  padding: '4px 12px',
                  border: `2px solid ${size === s ? '#1976d2' : '#ddd'}`,
                  color: size === s ? '#1976d2' : '#555',
                  background: size === s ? '#e3f2fd' : '#fff',
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Size {s}
              </button>
            ))}
          </div>
        )}

        {/* FIX: Đẩy giá lên ngay dưới tên/size và bỏ margin 'auto' */}
        <p className="product-price" style={{ color: "#1976d2", fontWeight: 700, fontSize: 18, margin: '8px 0 12px 0' }}>
          {price > 0 ? price.toLocaleString() + "đ" : "--"}
        </p>
      </div>

      {/* FIX: Nhóm các hành động (ghi chú, số lượng, nút) vào một khối ở dưới cùng */}
      <div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ghi chú (...)"
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '6px',
            border: '1px solid #ddd',
            marginBottom: '12px',
            fontSize: '14px',
            resize: 'vertical',
            boxSizing: 'border-box'
          }}
        />

        {/* FIX: Bỏ `marginTop: 'auto'` vì không còn cần thiết nữa */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Quantity Stepper */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={handleDecreaseQuantity} style={stepperButtonStyle} disabled={quantity <= 1}>-</button>
            <span style={{ fontWeight: 'bold', fontSize: 16, minWidth: '20px', textAlign: 'center' }}>{quantity}</span>
            <button onClick={handleIncreaseQuantity} style={stepperButtonStyle}>+</button>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCartClick}
            disabled={price <= 0}
            style={{
              background: "#1976d2",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "10px 20px",
              fontWeight: 600,
              fontSize: 15,
              cursor: price > 0 ? "pointer" : "not-allowed",
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