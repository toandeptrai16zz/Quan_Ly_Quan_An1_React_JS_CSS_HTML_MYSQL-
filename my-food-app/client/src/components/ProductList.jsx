import React, { useState, useEffect, useMemo, useCallback } from "react";
import ProductCard from "./ProductCard";
import "./ProductList.css";

const TABS = [
  { label: "Mỳ Cay", value: 1, category: "Mỳ Cay" },
  { label: "Đồ Ăn Vặt", value: 2, category: "Đồ Ăn Vặt" },
  { label: "Trà Sữa", value: 3, category: "Trà Sữa" },
  { label: "Nước Ép", value: 4, category: "Nước Ép" },
  { label: "Đồ Uống Khác", value: 5, category: "Đồ Uống Khác" },
  { label: "Topping thêm", value: 6, category: "Topping thêm" },
];
const WATER_CATEGORIES = ["Trà Sữa", "Nước Ép", "Đồ Uống Khác"];
const TOPPING_CATEGORY = "Topping thêm";
const emptyProduct = {
  name: "",
  price: "",
  priceM: "",
  priceL: "",
  description: "",
  image: "",
  category: "Mỳ Cay",
  sizes: [],
};

const ProductList = ({ onAddToCart }) => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("Mỳ Cay");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyProduct);
  const [editId, setEditId] = useState(null);
  const [isManageMode, setIsManageMode] = useState(false);

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    let sizes = [];
    if (WATER_CATEGORIES.includes(category)) sizes = ["M"];
    setForm((prev) => ({
      ...prev,
      category,
      sizes,
      price: "",
      priceM: "",
      priceL: "",
    }));
  };

  const handleToggleSize = (size) => {
    setForm((prev) => {
      let sizes = prev.sizes || [];
      if (sizes.includes(size)) {
        sizes = sizes.filter((s) => s !== size);
      } else {
        sizes = [...sizes, size];
      }
      return { ...prev, sizes };
    });
  };

  useEffect(() => {
    fetch("http://localhost:5000/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch(() => console.error("Failed to fetch products."));
  }, []);

  const normalize = str => (str || '').normalize('NFC').trim().toLowerCase();

  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.name &&
        p.name.toLowerCase().includes(search.toLowerCase()) &&
        p.category &&
        normalize(p.category) === normalize(activeTab)
    );
  }, [products, search, activeTab]);

  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'price' || name === 'priceM' || name === 'priceL' ? value.replace(/^0+/, '') : value
    }));
  }, []);

  const handleCancel = useCallback(() => {
    setShowForm(false);
    setForm(emptyProduct);
    setEditId(null);
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    let submitData = { ...form };
    if (WATER_CATEGORIES.includes(form.category)) {
      submitData.priceM = form.sizes.includes("M") ? Number(form.priceM) : null;
      submitData.priceL = form.sizes.includes("L") ? Number(form.priceL) : null;
      submitData.price = null;
    } else if (form.category === TOPPING_CATEGORY) {
      submitData.price = Number(form.price);
      submitData.priceM = null;
      submitData.priceL = null;
      submitData.sizes = [];
    } else {
      submitData.price = Number(form.price);
      submitData.priceM = null;
      submitData.priceL = null;
      submitData.sizes = [];
    }
    const url = editId ? `http://localhost:5000/api/products/${editId}` : "http://localhost:5000/api/products";
    const method = editId ? "PUT" : "POST";

    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(submitData) });
      if (!res.ok) throw new Error(`Request failed`);
      const savedProduct = await res.json();
      if (editId) {
        setProducts((prev) => prev.map((p) => (p.id === editId ? savedProduct : p)));
      } else {
        setProducts((prev) => [...prev, savedProduct]);
      }
      handleCancel();
    } catch (error) {
      alert(`Thao tác thất bại: ${error.message}`);
    }
  }, [editId, form, handleCancel]);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa sản phẩm này?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Server error");
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      alert(`Xóa thất bại: ${error.message}`);
    }
  }, []);

  const handleEdit = useCallback((product) => {
    let sizes = [];
    if (WATER_CATEGORIES.includes(product.category)) {
      if (product.priceM != null) sizes.push("M");
      if (product.priceL != null) sizes.push("L");
    }
    setForm({
      name: product.name,
      price: product.price || "",
      priceM: product.priceM || "",
      priceL: product.priceL || "",
      description: product.description || "",
      image: product.image || "",
      category: product.category,
      sizes,
    });
    setEditId(product.id);
    setShowForm(true);
    const container = document.querySelector('.product-list-container');
    if (container) container.scrollTo(0, 0);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="menu-toolbar">
        <div className="menu-search-bar">
          <input
            type="text"
            placeholder="Tìm sản phẩm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="manage-btn" onClick={() => setIsManageMode(!isManageMode)}>
          {isManageMode ? "Thoát quản lý" : "Quản lý Menu"}
        </button>
      </div>

      <div className="menu-tabs">
        {TABS.map((tabInfo) => (
          <button
            key={tabInfo.value}
            onClick={() => setActiveTab(tabInfo.category)}
            className={`menu-tab-btn${activeTab === tabInfo.category ? " active" : ""}`}
          >
            {tabInfo.label}
          </button>
        ))}
      </div>

      {isManageMode && (
        <div style={{ padding: "16px 0" }}>
          <button className="add-product-btn" onClick={() => { setShowForm(true); setForm({ ...emptyProduct, category: activeTab }); setEditId(null); }}>
            + {activeTab === TOPPING_CATEGORY ? "Thêm topping" : "Thêm sản phẩm"}
          </button>
        </div>
      )}

      {isManageMode && showForm && (
        <form className="product-form" onSubmit={handleSubmit}>
          <h3>{editId ? (activeTab === TOPPING_CATEGORY ? "Sửa topping" : "Sửa sản phẩm") : (activeTab === TOPPING_CATEGORY ? "Thêm topping mới" : "Thêm sản phẩm mới")}</h3>
          <input required name="name" placeholder={activeTab === TOPPING_CATEGORY ? "Tên topping (VD: Thêm rau, Thêm thịt...)" : "Tên sản phẩm"} value={form.name} onChange={handleFormChange} />
          <select name="category" value={form.category} onChange={handleCategoryChange}>
            {TABS.map((t) => <option key={t.value} value={t.category}>{t.label}</option>)}
          </select>
          {activeTab !== TOPPING_CATEGORY && (
            <input name="image" placeholder="Link ảnh (tùy chọn)" value={form.image} onChange={handleFormChange} />
          )}
          <textarea name="description" placeholder="Mô tả (tùy chọn)" value={form.description} onChange={handleFormChange} />
          {WATER_CATEGORIES.includes(form.category) ? (
            <div>
              <div style={{ marginBottom: 8 }}>
                <label>
                  <input type="checkbox" checked={form.sizes.includes("M")} onChange={() => handleToggleSize("M")} /> Size M
                </label>
                <label style={{ marginLeft: 18 }}>
                  <input type="checkbox" checked={form.sizes.includes("L")} onChange={() => handleToggleSize("L")} /> Size L
                </label>
              </div>
              {form.sizes.includes("M") && (
                <input required type="number" name="priceM" placeholder="Giá size M" value={form.priceM} onChange={handleFormChange} />
              )}
              {form.sizes.includes("L") && (
                <input required type="number" name="priceL" placeholder="Giá size L" value={form.priceL} onChange={handleFormChange} />
              )}
            </div>
          ) : (
            <input required type="number" name="price" placeholder={activeTab === TOPPING_CATEGORY ? "Giá topping" : "Giá"} value={form.price} onChange={handleFormChange} />
          )}
          <div className="form-actions">
            <button type="submit" className="save-btn">{editId ? "Lưu thay đổi" : "Lưu"}</button>
            <button type="button" className="cancel-btn" onClick={handleCancel}>Hủy</button>
          </div>
        </form>
      )}

      <div className="product-list-container">
        <div className="product-list-grid">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                isManageMode={isManageMode}
                onEdit={() => handleEdit(product)}
                onDelete={() => handleDelete(product.id)}
              />
            ))
          ) : (
            <div className="no-products-message">
              Không tìm thấy sản phẩm nào trong danh mục này.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductList;