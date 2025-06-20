import React, { useState, useMemo } from "react";

// Dữ liệu được lấy từ Local Storage, có thể không ổn định
function getAllHistory() {
  // Dùng try-catch để phòng trường hợp dữ liệu trong localStorage bị hỏng
  try {
    const tables = JSON.parse(localStorage.getItem("tables_data") || "[]");
    const takeaways = JSON.parse(localStorage.getItem("takeaways_data") || "[]");

    const tableHistory = tables.flatMap(t =>
      (t.history || []).map(h => ({
        ...h,
        type: "table",
        tableId: t.id,
      }))
    );
    const takeawayHistory = takeaways.flatMap(t =>
      (t.history || []).map(h => ({
        ...h,
        type: "takeaway",
        takeawayId: t.id,
      }))
    );
    return [...tableHistory, ...takeawayHistory];
  } catch (error) {
    console.error("Lỗi khi đọc dữ liệu từ Local Storage:", error);
    // Nếu lỗi, trả về mảng rỗng để ứng dụng không bị crash
    return [];
  }
}

// FIX: Hàm này là NGUỒN GỐC của lỗi NaN
function getYearOptions(history) {
  const years = Array.from(
    new Set(
      history
        .map(h => new Date(h.time).getFullYear())
        // THÊM BỘ LỌC NÀY: Loại bỏ tất cả các giá trị NaN ra khỏi mảng
        .filter(year => !isNaN(year))
    )
  );
  years.sort((a, b) => b - a);
  return years;
}

const QUARTERS = [
  { label: "Quý 1 (1-3)", value: 1 },
  { label: "Quý 2 (4-6)", value: 2 },
  { label: "Quý 3 (7-9)", value: 3 },
  { label: "Quý 4 (10-12)", value: 4 },
];

const HistoryPage = () => {
  const [filterType, setFilterType] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterQuarter, setFilterQuarter] = useState("");

  const allHistory = useMemo(() => {
    const arr = getAllHistory();
    return arr.sort((a, b) => new Date(b.time) - new Date(a.time));
  }, []);

  const yearOptions = useMemo(() => getYearOptions(allHistory), [allHistory]);

  const filteredHistory = useMemo(() => {
    return allHistory.filter(h => {
      // Bỏ qua các bản ghi không có thời gian hợp lệ
      if (!h.time || isNaN(new Date(h.time))) {
        return false;
      }

      let matchType = filterType === "all" || h.type === filterType;
      let matchDate = true, matchMonth = true, matchYear = true, matchQuarter = true;
      const d = new Date(h.time);

      if (filterDate) {
        const filter = new Date(filterDate);
        matchDate =
          d.getFullYear() === filter.getFullYear() &&
          d.getMonth() === filter.getMonth() &&
          d.getDate() === filter.getDate();
      }
      if (filterMonth) {
        const [y, m] = filterMonth.split("-");
        matchMonth =
          d.getFullYear() === Number(y) &&
          d.getMonth() + 1 === Number(m);
      }
      if (filterYear) {
        matchYear = d.getFullYear() === Number(filterYear);
      }
      if (filterQuarter) {
        const q = Number(filterQuarter);
        const month = d.getMonth() + 1;
        matchQuarter =
          (q === 1 && month >= 1 && month <= 3) ||
          (q === 2 && month >= 4 && month <= 6) ||
          (q === 3 && month >= 7 && month <= 9) ||
          (q === 4 && month >= 10 && month <= 12);
      }
      return matchType && matchDate && matchMonth && matchYear && matchQuarter;
    });
  }, [allHistory, filterType, filterDate, filterMonth, filterYear, filterQuarter]);

  const totalCurrent = filteredHistory.reduce((sum, h) => sum + (h.total || 0), 0);
  const totalCash = filteredHistory
    .filter(h => h.method === "cash" || h.method === "tiền mặt")
    .reduce((sum, h) => sum + (h.total || 0), 0);
  const totalBank = filteredHistory
    .filter(h => h.method === "bank" || h.method === "chuyển khoản")
    .reduce((sum, h) => sum + (h.total || 0), 0);

  // Reset các filter khác khi chọn filter mới (tránh xung đột)
  const handleDateChange = e => {
    setFilterDate(e.target.value);
    setFilterMonth("");
    setFilterYear("");
    setFilterQuarter("");
  };
  const handleMonthChange = e => {
    setFilterMonth(e.target.value);
    setFilterDate("");
    setFilterYear("");
    setFilterQuarter("");
  };
  const handleYearChange = e => {
    setFilterYear(e.target.value);
    setFilterDate("");
    setFilterMonth("");
    setFilterQuarter("");
  };
  const handleQuarterChange = e => {
    setFilterQuarter(e.target.value);
    setFilterDate("");
    setFilterMonth("");
    setFilterYear("");
  };

  return (
    <div style={{ maxWidth: 900, margin: "32px auto", padding: 24 }}>
      <h2 style={{ marginBottom: 18, color: "#1976d2", textAlign: "center" }}>Lịch sử & Doanh thu</h2>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 18, gap: 16, flexWrap: "wrap" }}>
        <label style={{ fontWeight: 500 }}>
          Loại đơn:
          <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ marginLeft: 8, padding: 4, borderRadius: 6 }}>
            <option value="all">Tất cả</option>
            <option value="table">Ăn tại quán</option>
            <option value="takeaway">Mang về</option>
          </select>
        </label>
        <label style={{ fontWeight: 500 }}>
          Ngày:
          <input
            type="date"
            value={filterDate}
            onChange={handleDateChange}
            style={{ marginLeft: 8, padding: 4, borderRadius: 6 }}
          />
        </label>
        <label style={{ fontWeight: 500 }}>
          Tháng:
          <input
            type="month"
            value={filterMonth}
            onChange={handleMonthChange}
            style={{ marginLeft: 8, padding: 4, borderRadius: 6 }}
          />
        </label>
        <label style={{ fontWeight: 500 }}>
          Năm:
          <select
            value={filterYear}
            onChange={handleYearChange}
            style={{ marginLeft: 8, padding: 4, borderRadius: 6 }}
          >
            <option value="">--</option>
            {/* Giờ đây yearOptions sẽ không bao giờ chứa NaN */}
            {yearOptions.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </label>
        <label style={{ fontWeight: 500 }}>
          Quý:
          <select
            value={filterQuarter}
            onChange={handleQuarterChange}
            style={{ marginLeft: 8, padding: 4, borderRadius: 6 }}
          >
            <option value="">--</option>
            {QUARTERS.map(q => (
              <option key={q.value} value={q.value}>{q.label}</option>
            ))}
          </select>
        </label>
      </div>
      <div
        style={{
          margin: "0 auto 28px auto",
          maxWidth: 420,
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 2px 16px #1976d222",
          padding: "18px 28px",
          textAlign: "center"
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>
          Tổng doanh thu hiện tại:
          <span style={{ color: "#1976d2", fontSize: 22, marginLeft: 8 }}>{totalCurrent.toLocaleString()}đ</span>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 32 }}>
          <div>
            <span style={{ fontWeight: 600, color: "#1976d2" }}>Tiền mặt:</span>
            <span style={{ marginLeft: 6, color: "#1976d2", fontWeight: 700 }}>{totalCash.toLocaleString()}đ</span>
          </div>
          <div>
            <span style={{ fontWeight: 600, color: "#e91e63" }}>Chuyển khoản:</span>
            <span style={{ marginLeft: 6, color: "#e91e63", fontWeight: 700 }}>{totalBank.toLocaleString()}đ</span>
          </div>
        </div>
      </div>
      <ul style={{ paddingLeft: 0, listStyle: "none" }}>
        {filteredHistory.length === 0 ? (
          <li>Không có giao dịch nào.</li>
        ) : (
          filteredHistory.map((h, idx) => (
            <li key={idx} style={{ marginBottom: 18, background: "#f3f3f3", borderRadius: 12, padding: 16 }}>
              <div><b>Thời gian:</b> {new Date(h.time).toLocaleString()}</div>
              <div><b>Loại đơn:</b> {h.type === "table" ? "Ăn tại quán" : "Mang về"}</div>
              {h.type === "table" && <div><b>Bàn:</b> {h.tableId}</div>}
              {h.type === "takeaway" && <div><b>Đơn mang về:</b> {h.takeawayId}</div>}
              <div>
                <b>Phương thức:</b>{" "}
                {h.method === "cash" || h.method === "tiền mặt"
                  ? "Tiền mặt"
                  : h.method === "bank" || h.method === "chuyển khoản"
                    ? "Chuyển khoản"
                    : h.method}
              </div>
              {/* Thêm `|| 0` để phòng trường hợp h.total không tồn tại */}
              <div><b>Tổng tiền:</b> {(h.total || 0).toLocaleString()}đ</div>
              <div>
                <b>Chi tiết:</b>
                <ul>
                  {(h.orders || []).map((o, i) => (
                    <li key={i}>{o.name} x{o.quantity} {o.note && `(Ghi chú: ${o.note})`}</li>
                  ))}
                </ul>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default HistoryPage;