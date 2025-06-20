import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import Menu from "./pages/Menu";
import TableManager from "./pages/TableManager";
import TakeawayManager from "./pages/TakeawayManager";
import "./App.css";
import HistoryPage from "./pages/HistoryPage"; // Thêm dòng này

function AppContent() {
  return (
    <div className="App">
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/tables" element={<TableManager />} />
        <Route path="/takeaway" element={<TakeawayManager />} />
        <Route path="/history" element={<HistoryPage />} /> {/* Thêm dòng này */}
      </Routes>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}