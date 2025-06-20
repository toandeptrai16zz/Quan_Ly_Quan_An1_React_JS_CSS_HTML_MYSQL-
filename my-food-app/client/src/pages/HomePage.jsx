import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/banner.jpg";
import "./HomePage.css";

const HomePage = () => (
    <div className="home-background">
        <div className="home-content">
            <div className="home-logo-wrap">
                <img src={logo} alt="Heo Milk Tea Logo" className="home-logo" />
            </div>
            <h1 className="brand">Heo Milk Tea</h1>
            <h2 className="welcome-title">Chào mừng đến với Heo Milk Tea!</h2>
            <p>
                Đặt món ăn, thức uống yêu thích của bạn chỉ với vài cú click.<br />
                Khám phá thực đơn đa dạng và ưu đãi hấp dẫn mỗi ngày!
            </p>
            <Link to="/menu">
                <button className="home-menu-button">Xem Menu</button>
            </Link>
        </div>
    </div>
);

export default HomePage;