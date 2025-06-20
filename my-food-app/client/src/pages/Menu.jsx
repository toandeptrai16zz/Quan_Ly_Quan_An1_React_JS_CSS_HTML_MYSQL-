import React from "react";
import ProductList from "../components/ProductList";

const Menu = () => {
  return (
    <section className="menu-section">
      <div className="menu-layout">
        <div className="menu-panel" style={{ flex: 1, minWidth: 0 }}>
          <ProductList />
        </div>
      </div>
    </section>
  );
};

export default Menu;