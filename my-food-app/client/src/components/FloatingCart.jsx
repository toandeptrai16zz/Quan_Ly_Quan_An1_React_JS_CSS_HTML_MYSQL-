import React from "react";
import { FaShoppingCart } from "react-icons/fa";

const FloatingCart = ({ cartCount, onClick }) => (
    <div
        style={{
            position: "fixed",
            right: 32,
            bottom: 32,
            zIndex: 1000,
            background: "#fff",
            borderRadius: "50%",
            boxShadow: "0 4px 16px #1976d244",
            width: 64,
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            border: "3px solid #1976d2",
        }}
        onClick={onClick}
        title="Xem giỏ hàng"
    >
        <FaShoppingCart size={32} color="#1976d2" />
        {cartCount > 0 && (
            <span
                style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    background: "#e91e63",
                    color: "#fff",
                    borderRadius: "50%",
                    padding: "2px 8px",
                    fontSize: 14,
                    fontWeight: 700,
                }}
            >
                {cartCount}
            </span>
        )}
    </div>
);

export default FloatingCart;