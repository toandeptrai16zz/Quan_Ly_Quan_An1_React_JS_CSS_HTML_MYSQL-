import React, { useState, useEffect, useMemo } from "react";
import ProductCard from "./ProductCard";
import "./ProductList.css";

const emptyProduct = {
  name: "",
  price: "",
  priceS: "",
  priceM: "",
  priceL: "",
  description: "",
  image: "",
  category: "Mỳ Cay",
  sizes: [],
  hasSizes: false,
};

const Notification = ({ message, type, onClose }) => {
  if (!message) return null;
  return (
    <div style={{
      position: 'fixed', top: 20, right: 20, zIndex: 9999,
      background: type === 'error' ? '#ffebee' : '#e8f5e9',
      color: type === 'error' ? '#c62828' : '#2e7d32',
      padding: '12px 24px', borderRadius: 8,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      display: 'flex', alignItems: 'center', gap: 12,
      borderLeft: `6px solid ${type === 'error' ? '#c62828' : '#2e7d32'}`,
      fontWeight: '600', animation: 'fadeIn 0.3s ease'
    }}>
      <span>{message}</span>
      <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 16, color: 'inherit' }}>✕</button>
    </div>
  );
};

const ProductList = ({ onAddToCart }) => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyProduct);
  const [editId, setEditId] = useState(null);

  const [isManageMode, setIsManageMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false); // Chế độ sửa Tab

  const [categories, setCategories] = useState([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [notify, setNotify] = useState({ message: '', type: '' });

  const showNotify = (msg, type = 'success') => {
    setNotify({ message: msg, type });
    setTimeout(() => setNotify({ message: '', type: '' }), 3000);
  };

  // Tải dữ liệu ban đầu
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    fetch("/api/categories")
      .then((res) => res.ok ? res.json() : [])
      .then((data) => {
        if (data && data.length > 0) {
          setCategories(data);
          if (!activeTab || !data.includes(activeTab)) {
            setActiveTab(data[0]);
          }
        }
      });

    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error(err));
  };

  const normalize = (str) => (str || "").normalize("NFC").trim().toLowerCase();

  const filteredProducts = useMemo(() => {
    let result = products;
    if (search.trim() !== "") {
      result = result.filter(p => p.name && p.name.toLowerCase().includes(search.toLowerCase()));
    } else {
      result = result.filter(p => p.category && normalize(p.category) === normalize(activeTab));
    }
    return result;
  }, [products, search, activeTab]);

  // --- XỬ LÝ FORM MÓN ĂN ---
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleSize = (size) => {
    setForm((prev) => {
      let sizes = prev.sizes || [];
      sizes = sizes.includes(size) ? sizes.filter((s) => s !== size) : [...sizes, size];
      return { ...prev, sizes };
    });
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    let submitData = { ...form };

    if (form.hasSizes) {
      submitData.priceS = form.sizes.includes("S") ? Number(form.priceS) : null;
      submitData.priceM = form.sizes.includes("M") ? Number(form.priceM) : null;
      submitData.priceL = form.sizes.includes("L") ? Number(form.priceL) : null;
      submitData.price = null;
    } else {
      submitData.price = Number(form.price);
      submitData.priceS = null; submitData.priceM = null; submitData.priceL = null;
      submitData.sizes = [];
    }

    const url = editId ? `/api/products/${editId}` : "/api/products";
    const method = editId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(submitData),
      });
      if (!res.ok) throw new Error(`Lỗi server`);

      // Refresh lại toàn bộ dữ liệu để đảm bảo đồng bộ
      fetchData();
      showNotify(editId ? "Đã cập nhật món!" : "Đã thêm món mới!");
      setShowForm(false); setForm(emptyProduct); setEditId(null);
    } catch (error) {
      showNotify(`Lỗi: ${error.message}`, 'error');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Xóa món này?")) return;
    try {
      await fetch(`/api/products/${id}`, { method: "DELETE" });
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showNotify("Đã xóa sản phẩm");
    } catch (error) { showNotify("Lỗi xóa", 'error'); }
  };

  // --- XỬ LÝ TAB (DANH MỤC) ---

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const res = await fetch("/api/categories", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category: newCategoryName }),
      });
      if (!res.ok) throw new Error("Lỗi thêm tab");
      const data = await res.json();

      const newCats = [...categories, data.name];
      setCategories(newCats);
      setActiveTab(data.name);
      setNewCategoryName(""); setShowAddCategory(false);
      showNotify("Đã thêm danh mục mới");
    } catch (error) { showNotify(error.message, 'error'); }
  };

  const handleDeleteCategory = async (catName) => {
    if (!window.confirm(`Xóa tab "${catName}" và ẩn tất cả món trong đó?`)) return;
    try {
      await fetch(`/api/categories/${encodeURIComponent(catName)}`, { method: "DELETE" });
      const newCats = categories.filter((c) => c !== catName);
      setCategories(newCats);
      if (activeTab === catName) setActiveTab(newCats.length > 0 ? newCats[0] : "");
      showNotify("Đã xóa danh mục");
    } catch (err) { showNotify("Lỗi xóa tab", 'error'); }
  };

  // 🔄 ĐỔI TÊN TAB
  const handleRenameCategory = async (oldName) => {
    const newName = prompt("Nhập tên mới cho tab:", oldName);
    if (!newName || newName.trim() === "" || newName === oldName) return;

    try {
      const res = await fetch("/api/categories/rename", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldName, newName: newName.trim() })
      });
      if (!res.ok) throw new Error("Lỗi server");

      // Cập nhật lại state
      const newCats = categories.map(c => c === oldName ? newName.trim() : c);
      setCategories(newCats);
      if (activeTab === oldName) setActiveTab(newName.trim());

      // Load lại sản phẩm để cập nhật tên danh mục mới
      fetchData();
      showNotify("Đã đổi tên thành công!");
    } catch (err) { showNotify("Lỗi đổi tên", 'error'); }
  };

  // 🔄 SẮP XẾP TAB (Di chuyển Trái/Phải)
  const moveTab = async (index, direction) => {
    // direction: -1 (Sang trái), 1 (Sang phải)
    if (index + direction < 0 || index + direction >= categories.length) return;

    const newCats = [...categories];
    // Hoán đổi vị trí
    const temp = newCats[index];
    newCats[index] = newCats[index + direction];
    newCats[index + direction] = temp;

    setCategories(newCats); // Cập nhật giao diện ngay cho mượt

    // Gọi API lưu thứ tự mới
    try {
      await fetch("/api/categories/reorder", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: newCats })
      });
    } catch (err) {
      console.error("Lỗi lưu thứ tự", err);
      // Nếu lỗi thì revert lại (optional)
    }
  };

  return (
    <div className="product-list-container" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Notification message={notify.message} type={notify.type} onClose={() => setNotify({ message: '', type: '' })} />

      <input
        type="text" placeholder="Tìm tên món..."
        value={search} onChange={(e) => setSearch(e.target.value)}
        style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ccc", marginBottom: "16px", fontSize: 16 }}
      />

      {/* --- KHU VỰC TAB --- */}
      {!search && (
        <div style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "8px", alignItems: "center" }}>
            {categories.map((cat, index) => (
              <div key={cat} style={{ position: "relative", display: 'flex', alignItems: 'center' }}>

                {/* Nút Di chuyển Trái */}
                {isEditMode && index > 0 && (
                  <button onClick={() => moveTab(index, -1)} style={{ marginRight: 4, background: '#eee', border: 'none', borderRadius: 4, cursor: 'pointer', padding: '4px 8px' }}>◀</button>
                )}

                <button
                  onClick={() => setActiveTab(cat)}
                  onDoubleClick={() => isEditMode && handleRenameCategory(cat)} // Double click để đổi tên
                  title={isEditMode ? "Bấm đúp để đổi tên" : ""}
                  style={{
                    padding: "10px 20px", borderRadius: "24px",
                    border: activeTab === cat ? "2px solid #1976d2" : "1px solid #ddd",
                    background: activeTab === cat ? "#1976d2" : "#fff",
                    color: activeTab === cat ? "#fff" : "#333",
                    cursor: "pointer", fontWeight: "600", whiteSpace: "nowrap", fontSize: 15,
                    opacity: isEditMode ? 0.8 : 1
                  }}
                >
                  {cat} {isEditMode && "✎"}
                </button>

                {/* Nút Di chuyển Phải */}
                {isEditMode && index < categories.length - 1 && (
                  <button onClick={() => moveTab(index, 1)} style={{ marginLeft: 4, background: '#eee', border: 'none', borderRadius: 4, cursor: 'pointer', padding: '4px 8px' }}>▶</button>
                )}

                {/* Nút Xóa */}
                {isEditMode && (
                  <button onClick={() => handleDeleteCategory(cat)} style={{ marginLeft: 5, width: 22, height: 22, borderRadius: "50%", background: "#ff5252", color: "#fff", border: "none", cursor: "pointer", fontSize: 12 }}>✕</button>
                )}
              </div>
            ))}

            {/* Nút Chế độ Sửa Tab */}
            <button onClick={() => setIsEditMode(!isEditMode)} style={{ padding: "8px 16px", borderRadius: "20px", border: "1px dashed #999", background: isEditMode ? "#ff9800" : "#f5f5f5", color: isEditMode ? "#fff" : "#666", cursor: "pointer", fontWeight: "600", marginLeft: 10, whiteSpace: 'nowrap' }}>
              {isEditMode ? "✓ Xong" : "⚙ Sửa Tab"}
            </button>

            {/* Nút Thêm Tab */}
            {isEditMode && <button onClick={() => setShowAddCategory(!showAddCategory)} style={{ padding: "8px 16px", borderRadius: "20px", border: "2px dashed #4caf50", background: "#fff", color: "#4caf50", cursor: "pointer", fontWeight: "600", whiteSpace: 'nowrap' }}>+ Thêm</button>}
          </div>

          {/* Hướng dẫn khi ở chế độ sửa */}
          {isEditMode && <div style={{ fontSize: 13, color: '#666', marginTop: 4, fontStyle: 'italic' }}>💡 Mẹo: Bấm mũi tên ◀ ▶ để di chuyển. Bấm đúp vào tên để đổi tên.</div>}
        </div>
      )}

      {/* Form thêm tab mới */}
      {isEditMode && showAddCategory && (
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", padding: "12px", background: "#f0f0f0", borderRadius: "8px" }}>
          <input type="text" placeholder="Tên tab mới..." value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} style={{ flex: 1, padding: "8px" }} />
          <button onClick={handleAddCategory} style={{ background: "#4caf50", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 4, cursor: "pointer" }}>Lưu</button>
        </div>
      )}

      {/* --- NÚT QUẢN LÝ MÓN --- */}
      <div style={{ marginBottom: 16 }}>
        <button onClick={() => setIsManageMode(!isManageMode)} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: isManageMode ? "#2e7d32" : "#e0e0e0", color: isManageMode ? "#fff" : "#333", cursor: "pointer", fontWeight: "600" }}>
          {isManageMode ? "✓ Hoàn tất quản lý món" : "🔧 Quản lý món ăn (Sửa/Xóa)"}
        </button>
      </div>

      {isManageMode && !showForm && (
        <button onClick={() => { setShowForm(true); setForm({ ...emptyProduct, category: activeTab }); }} style={{ marginBottom: 16, padding: '12px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>+ Thêm Món Mới vào "{activeTab}"</button>
      )}

      {/* FORM THÊM/SỬA MÓN (GIỮ NGUYÊN NHƯ CŨ) */}
      {showForm && (
        <div style={{ marginBottom: "20px", padding: "20px", background: "#fff", border: "2px solid #1976d2", borderRadius: "12px" }}>
          <h3 style={{ marginTop: 0, color: "#1976d2" }}>{editId ? "Sửa món" : "Thêm món mới"}</h3>

          <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Tên món:</label>
          <input name="name" value={form.name} onChange={handleFormChange} style={{ width: "100%", padding: 10, marginBottom: 12, border: "1px solid #ccc", borderRadius: 6 }} />

          <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Danh mục:</label>
          <select name="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ width: "100%", padding: 10, marginBottom: 12, border: "1px solid #ccc", borderRadius: 6 }}>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 'bold', color: '#1976d2' }}>
              <input
                type="checkbox"
                checked={form.hasSizes}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setForm(prev => ({ ...prev, hasSizes: checked, sizes: checked ? ["M"] : [] }));
                }}
                style={{ width: 18, height: 18 }}
              />
              Tính tiền theo Size (S/M/L)?
            </label>
          </div>

          {form.hasSizes ? (
            <div style={{ marginBottom: 12, background: '#e3f2fd', padding: 10, borderRadius: 6, border: '1px dashed #1976d2' }}>
              <label style={{ fontWeight: 'bold' }}>Nhập giá theo Size:</label>
              <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                <div style={{ flex: 1 }}>
                  <label><input type="checkbox" checked={form.sizes.includes("S")} onChange={() => handleToggleSize("S")} /> Size S</label>
                  {form.sizes.includes("S") && <input name="priceS" placeholder="Giá S" value={form.priceS} onChange={handleFormChange} type="number" style={{ width: '100%', padding: 6, marginTop: 4 }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <label><input type="checkbox" checked={form.sizes.includes("M")} onChange={() => handleToggleSize("M")} /> Size M</label>
                  {form.sizes.includes("M") && <input name="priceM" placeholder="Giá M" value={form.priceM} onChange={handleFormChange} type="number" style={{ width: '100%', padding: 6, marginTop: 4 }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <label><input type="checkbox" checked={form.sizes.includes("L")} onChange={() => handleToggleSize("L")} /> Size L</label>
                  {form.sizes.includes("L") && <input name="priceL" placeholder="Giá L" value={form.priceL} onChange={handleFormChange} type="number" style={{ width: '100%', padding: 6, marginTop: 4 }} />}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontWeight: 'bold' }}>Giá tiền (1 size):</label>
              <input name="price" value={form.price} onChange={handleFormChange} type="number" style={{ width: "100%", padding: 10, marginTop: 4, border: "1px solid #ccc", borderRadius: 6 }} />
            </div>
          )}

          <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Link ảnh (nếu có):</label>
          <input name="image" value={form.image} onChange={handleFormChange} placeholder="Để trống nếu không có ảnh" style={{ width: "100%", padding: 10, marginBottom: 16, border: "1px solid #ccc", borderRadius: 6 }} />

          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={handleSubmitProduct} style={{ flex: 1, padding: 12, background: "#1976d2", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold" }}>Lưu</button>
            <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: 12, background: "#ccc", color: "#333", border: "none", borderRadius: 6, cursor: "pointer" }}>Hủy</button>
          </div>
        </div>
      )}

      {/* DANH SÁCH MÓN ĂN */}
      <div style={{
        flex: 1, overflowY: "auto",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gridAutoRows: "max-content",
        alignContent: "start",
        gap: "20px", paddingBottom: 16
      }}>
        {filteredProducts.length > 0 ? (
          filteredProducts.map((p) => (
            <ProductCard
              key={p.id} product={p}
              onAddToCart={onAddToCart} isManageMode={isManageMode}
              onEdit={() => {
                const hasSizesData = (p.priceS > 0 || p.priceM > 0 || p.priceL > 0);
                let sizes = [];
                if (p.priceS) sizes.push("S");
                if (p.priceM) sizes.push("M");
                if (p.priceL) sizes.push("L");

                setForm({
                  ...p,
                  sizes,
                  hasSizes: hasSizesData,
                  price: p.price || "", priceS: p.priceS || "", priceM: p.priceM || "", priceL: p.priceL || "",
                  category: p.category || activeTab
                });
                setEditId(p.id); setShowForm(true);
              }}
              onDelete={() => handleDeleteProduct(p.id)}
            />
          ))
        ) : (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "#999", fontSize: 18 }}>
            {search ? `Không tìm thấy món nào tên "${search}"` : "Chưa có món nào trong mục này"}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductList;