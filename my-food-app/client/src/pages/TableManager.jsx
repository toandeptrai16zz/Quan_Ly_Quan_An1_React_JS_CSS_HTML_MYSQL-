import React, { useState, useEffect, useMemo, useCallback } from "react";
import ProductList from "../components/ProductList";
import SuccessNotification from "../components/SuccessNotification";

const STORAGE_KEY = "tables_data";
const INITIAL_TABLES = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    orders: [],
    history: [],
}));

function calculateTotal(orders) {
    return orders.reduce((total, item) => {
        const price = item.price || 0;
        return total + price * item.quantity;
    }, 0);
}

const TableManager = () => {
    const [showSuccess, setShowSuccess] = useState(false); // Đặt ở đây!
    const [tables, setTables] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : INITIAL_TABLES;
        } catch (error) {
            console.error("Failed to parse tables data from localStorage:", error);
            return INITIAL_TABLES;
        }
    });

    const [selectedTableId, setSelectedTableId] = useState(null);
    const [showPayment, setShowPayment] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [tab, setTab] = useState("order");
    const [customerCash, setCustomerCash] = useState("");

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tables));
    }, [tables]);

    const selectedTable = useMemo(() => tables.find(t => t.id === selectedTableId), [tables, selectedTableId]);
    const totalAmount = useMemo(() => (selectedTable ? calculateTotal(selectedTable.orders) : 0), [selectedTable]);
    const change = useMemo(() => (customerCash !== "" ? Number(customerCash) - totalAmount : 0), [customerCash, totalAmount]);

    const handleAddProductToOrder = useCallback((product, note, quantity = 1, size) => {
        if (!selectedTableId) {
            alert("Vui lòng chọn bàn trước khi thêm món!");
            return;
        }
        setTables(prevTables =>
            prevTables.map(t => {
                if (t.id !== selectedTableId) return t;
                const existingItemIndex = t.orders.findIndex(
                    item => item.name === product.name && item.note === note && item.size === size
                );
                if (existingItemIndex !== -1) {
                    const newOrders = [...t.orders];
                    newOrders[existingItemIndex].quantity += Number(quantity);
                    return { ...t, orders: newOrders };
                }
                return {
                    ...t,
                    orders: [...t.orders, {
                        name: product.name,
                        price: product.price,
                        quantity: Number(quantity),
                        note,
                        size
                    }],
                };
            })
        );
    }, [selectedTableId]);

    const handleRemoveOrder = useCallback((orderIndex) => {
        setTables(prevTables =>
            prevTables.map(t =>
                t.id === selectedTableId
                    ? { ...t, orders: t.orders.filter((_, i) => i !== orderIndex) }
                    : t
            )
        );
    }, [selectedTableId]);

    // ===================================================================
    // FIX: Sửa hàm handlePay để gọi API trước khi cập nhật localStorage
    // ===================================================================
    const handlePay = useCallback(async () => {
        if (!selectedTable) {
            alert("Lỗi: Không tìm thấy bàn được chọn.");
            return;
        }

        const paymentData = {
            order_type: "table",
            order_id: `Bàn ${selectedTable.id}`,
            orders: selectedTable.orders,
            total: totalAmount,
            method: paymentMethod,
        };

        try {
            // Nhờ có proxy trong vite.config.js, ta chỉ cần dùng /api
            const response = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paymentData),
            });

            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.error || "Server đã từ chối yêu cầu.");
            }

            console.log("Thanh toán thành công, đã lưu vào database.");

            setTables(prevTables =>
                prevTables.map(t =>
                    t.id === selectedTableId
                        ? {
                            ...t,
                            history: [
                                ...t.history,
                                {
                                    orders: t.orders,
                                    total: totalAmount,
                                    method: paymentMethod,
                                    time: new Date().toISOString(),
                                },
                            ],
                            orders: [],
                        }
                        : t
                )
            );

            setShowPayment(false);
            setSelectedTableId(null);
            setPaymentMethod("cash");
            setCustomerCash("");
            setShowSuccess(true); // <-- Thay alert bằng mở popup

        } catch (error) {
            console.error('Lỗi khi thực hiện thanh toán:', error);
            alert(`Thanh toán thất bại: ${error.message}`);
        }
    }, [selectedTableId, paymentMethod, selectedTable, totalAmount]);

    // --- Toàn bộ phần JSX còn lại giữ nguyên ---
    return (
        <div style={{ maxWidth: 1400, margin: "32px auto", padding: 24 }}>
            <h2 style={{ textAlign: "center", marginBottom: 32 }}>Quản lý bàn ăn tại quán</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 18, justifyContent: "center" }}>
                {tables.map(table => (
                    <div
                        key={table.id}
                        onClick={() => { setSelectedTableId(table.id); setTab("order"); }}
                        style={{
                            width: 120, height: 100,
                            background: table.orders.length > 0 ? "#ff9800" : "#1976d2",
                            color: "#fff", borderRadius: 16, display: "flex", alignItems: "center",
                            justifyContent: "center", fontWeight: 700, fontSize: 20, cursor: "pointer",
                            boxShadow: `0 0 0 4px ${table.id === selectedTableId ? (table.orders.length > 0 ? "#ff9800" : "#1976d2") : "transparent"}`,
                            border: table.orders.length === 0 && table.history.length > 0 ? "2px solid #4caf50" : "none",
                            position: "relative", transition: "all 0.3s ease"
                        }}
                        title={table.orders.length > 0 ? `Đang xử lý (${table.orders.reduce((sum, item) => sum + item.quantity, 0)} món)` : "Trống"}
                    >
                        Bàn {table.id}
                        {table.orders.length > 0 && (
                            <span style={{ position: "absolute", bottom: 8, right: 12, fontSize: 13, background: "#fff", color: "#ff9800", borderRadius: 8, padding: "2px 8px", fontWeight: 600 }}>
                                {table.orders.reduce((sum, item) => sum + item.quantity, 0)} món
                            </span>
                        )}
                        {table.orders.length === 0 && table.history.length > 0 && (
                            <span style={{ position: "absolute", top: 8, right: 12, fontSize: 13, background: "#4caf50", color: "#fff", borderRadius: 8, padding: "2px 8px", fontWeight: 600 }}>
                                Đã TT
                            </span>
                        )}
                    </div>
                ))}
            </div>

            {selectedTable && (
                <div style={{ display: "flex", gap: 24, marginTop: 32, height: "75vh", minHeight: 400 }}>
                    <div style={{
                        flex: 1, background: "#fff", borderRadius: 16, boxShadow: "0 4px 24px #1976d233",
                        padding: 18, position: "relative", minWidth: 300, maxWidth: 420,
                        fontSize: 15, overflowY: "auto", maxHeight: "100%", minHeight: 0,
                        display: "flex", flexDirection: "column"
                    }}>
                        <button onClick={() => setSelectedTableId(null)} style={{ position: "absolute", top: 12, right: 16, background: "#eee", border: "none", borderRadius: 8, padding: "4px 12px", cursor: "pointer", zIndex: 10 }}>Đóng</button>
                        <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
                            <button onClick={() => setTab("order")} style={{ background: tab === "order" ? "#1976d2" : "#eee", color: tab === "order" ? "#fff" : "#1976d2", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, cursor: "pointer" }}>Đơn hiện tại</button>
                            <button onClick={() => setTab("history")} style={{ background: tab === "history" ? "#1976d2" : "#eee", color: tab === "history" ? "#fff" : "#1976d2", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, cursor: "pointer" }}>Lịch sử</button>
                        </div>
                        {tab === "order" ? (
                            <>
                                <h3 style={{ fontSize: 20, marginTop: 0 }}>Bàn {selectedTable.id}</h3>
                                {selectedTable.orders.length === 0 ? <p>Bàn trống. Vui lòng chọn món từ Menu.</p> : (
                                    <>
                                        <div style={{ flex: '1 1 auto', overflowY: 'auto', minHeight: 0 }}>
                                            <table style={{ width: "100%", borderCollapse: 'collapse' }}>
                                                <tbody>
                                                    {selectedTable.orders.map((item, idx) => (
                                                        <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                                            <td style={{ padding: '8px 4px' }}>
                                                                {item.name}
                                                                {item.size && (<span style={{ color: "#1976d2", fontWeight: 600, marginLeft: '4px' }}>({item.size})</span>)}
                                                                {item.note && <div style={{ color: '#666', fontSize: '12px' }}>Ghi chú: {item.note}</div>}
                                                            </td>
                                                            <td style={{ padding: '8px 4px', whiteSpace: 'nowrap', textAlign: 'center' }}>x {item.quantity}</td>
                                                            <td style={{ padding: '8px 4px', textAlign: 'right', whiteSpace: 'nowrap' }}>{(item.price * item.quantity).toLocaleString()}đ</td>
                                                            <td style={{ padding: '8px 4px', textAlign: 'right' }}><button onClick={() => handleRemoveOrder(idx)} style={{ background: "#e57373", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>Xóa</button></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div style={{ flexShrink: 0, paddingTop: 16 }}>
                                            <div style={{ fontWeight: 700, fontSize: '18px' }}>Tổng tiền: <span style={{ color: '#1976d2' }}>{totalAmount.toLocaleString()}đ</span></div>
                                            <button onClick={() => setShowPayment(true)} style={{ background: "linear-gradient(90deg, #1976d2 60%, #ff9800 100%)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", fontSize: "1rem", fontWeight: 600, cursor: "pointer", marginTop: 12, width: '100%' }}>Thanh toán</button>
                                        </div>
                                    </>
                                )}
                            </>
                        ) : (
                            <>
                                <h3 style={{ fontSize: 20, marginTop: 0 }}>Lịch sử Bàn {selectedTable.id}</h3>
                                {selectedTable.history.length === 0 ? <p>Chưa có lịch sử.</p> : (
                                    <ul>
                                        {selectedTable.history.map((h, i) => <li key={i}>{new Date(h.time).toLocaleString()} - {h.total.toLocaleString()}đ</li>)}
                                    </ul>
                                )}
                            </>
                        )}
                    </div>
                    <div style={{ flex: 2, background: "#fff", borderRadius: 16, boxShadow: "0 4px 24px #1976d233", padding: 18, display: "flex", flexDirection: "column", minHeight: 0, maxHeight: "100%" }}>
                        <ProductList onAddToCart={handleAddProductToOrder} />
                    </div>
                </div>
            )}
            {showPayment && selectedTable && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.25)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ background: "#fff", borderRadius: 16, padding: "32px 28px", minWidth: 320, boxShadow: "0 4px 32px #0002", textAlign: "center", position: "relative" }}>
                        <button onClick={() => { setShowPayment(false); setCustomerCash(""); }} style={{ position: "absolute", top: 12, right: 16, background: "#eee", border: "none", borderRadius: 8, padding: "4px 12px", cursor: "pointer" }}>Đóng</button>
                        <h3>Chọn phương thức thanh toán cho Bàn {selectedTable.id}</h3>
                        <div style={{ display: "flex", gap: 32, justifyContent: "center", margin: "24px 0" }}>
                            <label style={{ fontWeight: paymentMethod === "cash" ? 700 : 400, color: paymentMethod === "cash" ? "#1976d2" : "#333", cursor: "pointer" }}>
                                <input type="radio" name="payment" value="cash" checked={paymentMethod === "cash"} onChange={() => setPaymentMethod("cash")} style={{ accentColor: "#1976d2", marginRight: 8 }} /> Tiền mặt
                            </label>
                            <label style={{ fontWeight: paymentMethod === "bank" ? 700 : 400, color: paymentMethod === "bank" ? "#1976d2" : "#333", cursor: "pointer" }}>
                                <input type="radio" name="payment" value="bank" checked={paymentMethod === "bank"} onChange={() => setPaymentMethod("bank")} style={{ accentColor: "#1976d2", marginRight: 8 }} /> Chuyển khoản
                            </label>
                        </div>
                        {paymentMethod === "cash" && (
                            <div style={{ margin: "18px 0 24px 0" }}>
                                <div style={{ marginBottom: 10 }}><b>Số tiền cần thanh toán:</b><span style={{ color: "#1976d2", fontWeight: 700 }}> {totalAmount.toLocaleString()}đ</span></div>
                                <div style={{ marginBottom: 10 }}>
                                    <label><b>Tiền khách đưa:</b>
                                        <input type="number" min={0} value={isNaN(Number(customerCash)) ? '' : customerCash} onChange={e => setCustomerCash(e.target.value)} style={{ width: 120, padding: 6, borderRadius: 6, border: "1px solid #ccc" }} placeholder="Nhập số tiền" /> đ
                                    </label>
                                </div>
                                <div><b>Tiền thừa:</b><span style={{ color: change < 0 ? "#e91e63" : "#388e3c", fontWeight: 700 }}> {customerCash !== "" ? (isNaN(change) ? 0 : (change >= 0 ? change.toLocaleString() : 0)) : 0}đ</span>
                                    {customerCash !== "" && change < 0 && (<span style={{ color: "#e91e63", marginLeft: 8 }}>(Khách đưa thiếu)</span>)}
                                </div>
                            </div>
                        )}
                        {paymentMethod === "bank" && (
                            <div style={{ margin: "18px 0 24px 0", background: "#f8f8ff", borderRadius: 12, padding: 18, textAlign: "center", border: "1.5px solid #1976d2" }}>
                                <h4 style={{ margin: "0 0 10px 0" }}>Thông tin chuyển khoản</h4>
                                <div style={{ marginBottom: 8 }}>
                                    <b>Ngân hàng:</b> Techcombank<br />
                                    <b>Số tài khoản:</b> 150220046789<br />
                                    <b>Tên:</b> HA QUANG CHUONG<br />
                                    <b>Số tiền:</b><span style={{ color: "#e91e63", fontWeight: 700 }}> {totalAmount.toLocaleString()}đ</span><br />
                                    <b>Nội dung:</b> TABLE{selectedTable.id}
                                </div>
                                <div style={{ marginTop: 8 }}><img src={`https://img.vietqr.io/image/970407-150220046789-compact2.jpg?amount=${totalAmount}&addInfo=TABLE${selectedTable.id}`} alt="QR chuyển khoản" style={{ width: 180, height: 180, borderRadius: 12, border: "2px solid #1976d2" }} /></div>
                                <div style={{ color: "#888", fontSize: 13, marginTop: 8 }}>Quét mã QR bằng app ngân hàng để chuyển khoản nhanh!</div>
                            </div>
                        )}
                        <button onClick={handlePay} style={{ background: "linear-gradient(90deg, #1976d2 60%, #e91e63 100%)", color: "#fff", border: "none", borderRadius: 10, padding: "12px 32px", fontSize: "1.1rem", fontWeight: 600, cursor: "pointer", opacity: paymentMethod === 'cash' && (customerCash === '' || change < 0) ? 0.5 : 1 }} disabled={paymentMethod === "cash" && (customerCash === "" || Number(customerCash) < totalAmount)}>Xác nhận thanh toán</button>
                        <button onClick={() => { setShowPayment(false); setCustomerCash(""); }} style={{ background: "#eee", color: "#333", border: "none", borderRadius: 8, padding: "10px 22px", fontSize: "1rem", fontWeight: 500, cursor: "pointer", marginLeft: 18 }}>Hủy</button>
                    </div>
                </div>
            )}
            {showSuccess && (
                <SuccessNotification onClose={() => setShowSuccess(false)} />
            )}
        </div>
    );
};

export default TableManager;