import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./Header.css";

const navs = [
  { to: "/", label: "Home" },
  { to: "/menu", label: "Menu" },
  { to: "/takeaway", label: "Đơn mang về" },
  { to: "/tables", label: "Quản lý bàn" },
  { to: "/history", label: "Lịch sử" }
];

const Header = () => {
  const location = useLocation();
  return (
    <header className="header">
      <nav className="header-nav">
        <ul>
          {navs.map(nav => (
            <li key={nav.to}>
              <Link
                to={nav.to}
                className={
                  "header-link" +
                  (location.pathname === nav.to ? " active" : "")
                }
              >
                {nav.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="header-title-wrap">
        <h1 className="header-title">Heo Milk Tea</h1>
      </div>
    </header>
  );
};

export default Header;