import React, { useState, useMemo, useEffect } from "react";

// Dữ liệu được lấy từ Local Storage, có thể không ổn định
function getAllHistory() {
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
    return [];
  }
}

const HistoryPage = () => {
  const [filterType, setFilterType] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [showDetail, setShowDetail] = useState(false);

  const allHistory = useMemo(() => {
    const arr = getAllHistory();
    return arr.sort((a, b) => new Date(b.time) - new Date(a.time));
  }, []);

  const filteredHistory = useMemo(() => {
    return allHistory.filter(h => {
      if (!h.time || isNaN(new Date(h.time))) {
        return false;
      }
      let matchType = filterType === "all" || h.type === filterType;
      let matchDate = true;
      const d = new Date(h.time);

      if (filterDate) {
        const filter = new Date(filterDate);
        matchDate =
          d.getFullYear() === filter.getFullYear() &&
          d.getMonth() === filter.getMonth() &&
          d.getDate() === filter.getDate();
      }
      return matchType && matchDate;
    });
  }, [allHistory, filterType, filterDate]);

  const totalCurrent = filteredHistory.reduce((sum, h) => sum + (h.total || 0), 0);
  const totalCash = filteredHistory
    .filter(h => h.method === "cash" || h.method === "tiền mặt")
    .reduce((sum, h) => sum + (h.total || 0), 0);
  const totalBank = filteredHistory
    .filter(h => h.method === "bank" || h.method === "chuyển khoản")
    .reduce((sum, h) => sum + (h.total || 0), 0);

  // =========================
  // KẾT CA & DOANH THU DATABASE
  // =========================
  const [shiftList, setShiftList] = useState([]);
  const [summary, setSummary] = useState({ byMonth: [], byQuarter: [], byYear: [] });
  const [loading, setLoading] = useState(false);
  const [closeLoading, setCloseLoading] = useState(false);
  const [closeResult, setCloseResult] = useState(null);

  useEffect(() => {
    fetchShifts();
    fetchSummary();
  }, []);

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/shifts");
      const data = await res.json();
      setShiftList(Array.isArray(data) ? data : []);
    } catch (e) {
      setShiftList([]);
    }
    setLoading(false);
  };

  const fetchSummary = async () => {
    try {
      const res = await fetch("/api/shifts/summary");
      const data = await res.json();
      setSummary(data);
    } catch (e) {
      setSummary({ byMonth: [], byQuarter: [], byYear: [] });
    }
  };

  // Kết ca thủ công
  const handleCloseShift = async () => {
    setCloseLoading(true);
    setCloseResult(null);
    try {
      const res = await fetch("/api/shifts/close", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setCloseResult({ success: true, ...data });
        fetchShifts();
        fetchSummary();
      } else {
        setCloseResult({ error: data.error || "Kết ca thất bại" });
      }
    } catch (e) {
      setCloseResult({ error: "Kết ca thất bại" });
    }
    setCloseLoading(false);
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
            onChange={e => setFilterDate(e.target.value)}
            style={{ marginLeft: 8, padding: 4, borderRadius: 6 }}
          />
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

      {/* =========================
          KẾT CA & DOANH THU DATABASE
      ========================= */}
      <div style={{ margin: "32px 0" }}>
        <h2 style={{ color: "#1976d2" }}>Kết ca doanh thu theo ngày</h2>
        <button
          onClick={handleCloseShift}
          disabled={closeLoading}
          style={{
            marginBottom: 12,
            padding: "10px 28px",
            borderRadius: 8,
            background: closeLoading ? "#bdbdbd" : "#1976d2",
            color: "#fff",
            border: "none",
            fontWeight: 700,
            fontSize: 16,
            boxShadow: "0 2px 8px #1976d222",
            cursor: closeLoading ? "not-allowed" : "pointer",
            transition: "background 0.2s"
          }}
        >
          {closeLoading ? (
            <span>
              <span className="loader" style={{
                display: "inline-block",
                width: 18, height: 18, border: "3px solid #fff", borderTop: "3px solid #1976d2",
                borderRadius: "50%", marginRight: 8, verticalAlign: "middle", animation: "spin 1s linear infinite"
              }} /> Đang kết ca...
            </span>
          ) : (
            <span>+ Kết ca ngày hôm nay</span>
          )}
        </button>
        {closeResult && (
          <div style={{ color: closeResult.success ? "green" : "red", marginBottom: 12, fontWeight: 600 }}>
            {closeResult.success
              ? <>
                Đã kết ca ngày <b>{closeResult.date}</b> lúc <b>{closeResult.closedAt ? new Date(closeResult.closedAt).toLocaleTimeString("vi-VN") : "--:--"}</b>,
                tổng: <b>{Number(closeResult.total).toLocaleString()}₫</b>
                {" "} (Tiền mặt: <span style={{ color: "#1976d2" }}>{Number(closeResult.cash).toLocaleString()}₫</span>,
                CK: <span style={{ color: "#e91e63" }}>{Number(closeResult.bank).toLocaleString()}₫</span>)
              </>
              : closeResult.error}
          </div>
        )}

        <div style={{ marginBottom: 24, background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px #0001", padding: 24 }}>
          <h3 style={{ margin: "0 0 18px 0", fontWeight: 700 }}>Lịch sử kết ca từng ngày</h3>
          {loading ? (
            <div>Đang tải...</div>
          ) : (
            <table border="0" cellPadding={10} style={{ width: "100%", maxWidth: 700, borderRadius: 12, overflow: "hidden" }}>
              <thead style={{ background: "#f5f5f5" }}>
                <tr>
                  <th>Ngày</th>
                  <th>Thời gian kết ca</th>
                  <th>Tổng doanh thu</th>
                  <th>Tiền mặt</th>
                  <th>Chuyển khoản</th>
                </tr>
              </thead>
              <tbody>
                {shiftList.map((s) => (
                  <tr key={s.id} style={{ textAlign: "center", borderBottom: "1px solid #eee" }}>
                    <td>{new Date(s.shift_date).toLocaleDateString("vi-VN")}</td>
                    <td>
                      {s.closedAt
                        ? new Date(s.closedAt).toLocaleTimeString("vi-VN")
                        : "--:--"}
                    </td>
                    <td style={{ fontWeight: 700 }}>{Number(s.total).toLocaleString()}₫</td>
                    <td style={{ color: "#1976d2", fontWeight: 700 }}>{Number(s.cash).toLocaleString()}₫</td>
                    <td style={{ color: "#e91e63", fontWeight: 700 }}>{Number(s.bank).toLocaleString()}₫</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ marginBottom: 24, background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px #0001", padding: 16 }}>
          <h3 style={{ margin: "0 0 12px 0" }}>Doanh thu theo tháng</h3>
          <table border="0" cellPadding={8} style={{ width: "100%", maxWidth: 600, borderRadius: 8, overflow: "hidden" }}>
            <thead style={{ background: "#f5f5f5" }}>
              <tr>
                <th>Năm</th>
                <th>Tháng</th>
                <th>Tổng doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {summary.byMonth?.map((m, idx) => (
                <tr key={idx} style={{ textAlign: "center", borderBottom: "1px solid #eee" }}>
                  <td>{m.year}</td>
                  <td>{m.month}</td>
                  <td style={{ fontWeight: 600 }}>{Number(m.total).toLocaleString()}₫</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginBottom: 24, background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px #0001", padding: 16 }}>
          <h3 style={{ margin: "0 0 12px 0" }}>Doanh thu theo quý</h3>
          <table border="0" cellPadding={8} style={{ width: "100%", maxWidth: 600, borderRadius: 8, overflow: "hidden" }}>
            <thead style={{ background: "#f5f5f5" }}>
              <tr>
                <th>Năm</th>
                <th>Quý</th>
                <th>Tổng doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {summary.byQuarter?.map((q, idx) => (
                <tr key={idx} style={{ textAlign: "center", borderBottom: "1px solid #eee" }}>
                  <td>{q.year}</td>
                  <td>{q.quarter}</td>
                  <td style={{ fontWeight: 600 }}>{Number(q.total).toLocaleString()}₫</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginBottom: 24, background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px #0001", padding: 16 }}>
          <h3 style={{ margin: "0 0 12px 0" }}>Doanh thu theo năm</h3>
          <table border="0" cellPadding={8} style={{ width: "100%", maxWidth: 600, borderRadius: 8, overflow: "hidden" }}>
            <thead style={{ background: "#f5f5f5" }}>
              <tr>
                <th>Năm</th>
                <th>Tổng doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {summary.byYear?.map((y, idx) => (
                <tr key={idx} style={{ textAlign: "center", borderBottom: "1px solid #eee" }}>
                  <td>{y.year}</td>
                  <td style={{ fontWeight: 600 }}>{Number(y.total).toLocaleString()}₫</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lịch sử localStorage (thu gọn/mở rộng) */}
      <button
        onClick={() => setShowDetail(v => !v)}
        style={{
          margin: "16px 0 24px 0",
          padding: "8px 18px",
          borderRadius: 8,
          background: "#1976d2",
          color: "#fff",
          border: "none",
          fontWeight: 600,
          cursor: "pointer"
        }}
      >
        {showDetail ? "Ẩn chi tiết từng đơn" : "Xem chi tiết từng đơn"}
      </button>
      {showDetail && (
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
      )}
      {/* Hiệu ứng loading cho nút kết ca */}
      <style>
        {`
        @keyframes spin {
          0% { transform: rotate(0deg);}
          100% { transform: rotate(360deg);}
        }
        `}
      </style>
    </div>
  );
};

export default HistoryPage;