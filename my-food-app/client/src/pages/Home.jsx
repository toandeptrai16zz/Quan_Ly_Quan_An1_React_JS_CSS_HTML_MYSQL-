import React from "react";
import { Link } from "react-router-dom";

const Home = () => (
  <div
    style={{
      minHeight: "60vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(120deg, #f8fafc 60%, #e3f2fd 100%)",
      padding: "40px 0"
    }}
  >
    <img
      src="/assets/banner.jpg"
      alt="Food Banner"
      style={{
        width: 320,
        maxWidth: "90vw",
        borderRadius: 18,
        marginBottom: 32,
        boxShadow: "0 4px 24px #1976d233"
      }}
    />
    <h1 style={{ fontSize: "2.5rem", color: "#1976d2", marginBottom: 12 }}>
      Chào mừng đến với My Food App!
    </h1>
    <p style={{ fontSize: "1.2rem", color: "#333", marginBottom: 32, textAlign: "center" }}>
      Đặt món ăn yêu thích của bạn chỉ với vài cú click.<br />
      Khám phá thực đơn đa dạng và ưu đãi hấp dẫn mỗi ngày!
    </p>
    <Link
      to="/menu"
      style={{
        background: "linear-gradient(90deg, #1976d2 60%, #42a5f5 100%)",
        color: "#fff",
        padding: "14px 36px",
        borderRadius: "8px",
        fontSize: "1.1rem",
        fontWeight: 600,
        textDecoration: "none",
        boxShadow: "0 2px 12px #1976d233",
        transition: "background 0.2s, transform 0.15s"
      }}
      onMouseOver={e => (e.currentTarget.style.background = "linear-gradient(90deg, #1565c0 60%, #1976d2 100%)")}
      onMouseOut={e => (e.currentTarget.style.background = "linear-gradient(90deg, #1976d2 60%, #42a5f5 100%)")}
    >
      Xem Menu
    </Link>
  </div>
);

export default Home;