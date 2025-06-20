import React, { useState, useEffect, useMemo, useCallback } from "react";
import ProductList from "../components/ProductList";
import SuccessNotification from "../components/SuccessNotification";

const STORAGE_KEY = "takeaways_data";
const INITIAL_TAKEAWAYS = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    orders: [],
    history: [],
}));

function isMiCay(name) {
    if (!name) return false;
    const lower = name.toLowerCase();
    return lower.includes("mì cay") || lower.includes("mỳ cay");
}

function calculateTotalWithFee(orders) {
    return orders.reduce((total, item) => {
        let itemTotal = (item.price || 0) * item.quantity;
        if (isMiCay(item.name)) {
            itemTotal += 3000 * item.quantity;
        }
        return total + itemTotal;
    }, 0);
}

const TakeawayManager = () => {
    const [showSuccess, setShowSuccess] = useState(false); // Đặt ở đây!
    const [takeaways, setTakeaways] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : INITIAL_TAKEAWAYS;
        } catch (error) {
            return INITIAL_TAKEAWAYS;
        }
    });
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [showPayment, setShowPayment] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [tab, setTab] = useState("order");
    const [customerCash, setCustomerCash] = useState("");

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(takeaways));
    }, [takeaways]);

    const selectedOrder = useMemo(
        () => takeaways.find((t) => t.id === selectedOrderId),
        [takeaways, selectedOrderId]
    );
    const totalAmount = useMemo(
        () => (selectedOrder ? calculateTotalWithFee(selectedOrder.orders) : 0),
        [selectedOrder]
    );
    const change = useMemo(
        () => (customerCash !== "" ? Number(customerCash) - totalAmount : 0),
        [customerCash, totalAmount]
    );

    const handleAddProductToOrder = useCallback(
        (product, note, quantity = 1, size) => {
            if (!selectedOrderId) {
                alert("Vui lòng chọn một đơn hàng trước!");
                return;
            }
            setTakeaways((prevTakeaways) =>
                prevTakeaways.map((t) => {
                    if (t.id !== selectedOrderId) return t;

                    const existingItemIndex = t.orders.findIndex(
                        (item) =>
                            item.name === product.name &&
                            item.note === note &&
                            item.size === size
                    );
                    if (existingItemIndex !== -1) {
                        const newOrders = [...t.orders];
                        newOrders[existingItemIndex].quantity += Number(quantity);
                        return { ...t, orders: newOrders };
                    }
                    return {
                        ...t,
                        orders: [
                            ...t.orders,
                            {
                                name: product.name,
                                price: product.price,
                                quantity: Number(quantity),
                                note,
                                size,
                            },
                        ],
                    };
                })
            );
        },
        [selectedOrderId]
    );

    const handleRemoveOrder = useCallback(
        (orderIndex) => {
            setTakeaways((prevTakeaways) =>
                prevTakeaways.map((t) =>
                    t.id === selectedOrderId
                        ? { ...t, orders: t.orders.filter((_, i) => i !== orderIndex) }
                        : t
                )
            );
        },
        [selectedOrderId]
    );

    // ===================================================================
    // FIX: Sửa hàm handlePay để gọi API trước khi cập nhật localStorage
    // ===================================================================
    const handlePay = useCallback(async () => {
        if (!selectedOrder) {
            alert("Lỗi: Không tìm thấy đơn hàng được chọn.");
            return;
        }

        const paymentData = {
            order_type: "takeaway",
            order_id: `Đơn mang về ${selectedOrder.id}`,
            orders: selectedOrder.orders,
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

            setTakeaways((prevTakeaways) =>
                prevTakeaways
                    .map((t) =>
                        t.id === selectedOrderId
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
                    .filter(
                        (t) => !(t.id === selectedOrderId && t.orders.length === 0 && t.history.length > 0)
                    )
            );

            setShowPayment(false);
            setSelectedOrderId(null); // Đúng tên biến!
            setPaymentMethod("cash");
            setCustomerCash("");
            setShowSuccess(true);

        } catch (error) {
            console.error('Lỗi khi thực hiện thanh toán:', error);
            alert(`Thanh toán thất bại: ${error.message}`);
        }
    }, [selectedOrderId, paymentMethod, selectedOrder, totalAmount]);

    // --- Toàn bộ phần JSX còn lại giữ nguyên ---
    return (
        <div style={{ maxWidth: 1400, margin: "32px auto", padding: 24 }}>
            <h2 style={{ textAlign: "center", marginBottom: 32 }}>
                Quản lý đơn mang về
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 18, justifyContent: "center" }}>
                {takeaways.map((order) => (
                    <div
                        key={order.id}
                        onClick={() => { setSelectedOrderId(order.id); setTab("order"); }}
                        style={{
                            width: 120, height: 100, background: order.orders.length > 0 ? "#ff9800" : "#1976d2",
                            color: "#fff", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: 700, fontSize: 20, cursor: "pointer",
                            boxShadow: `0 0 0 4px ${order.id === selectedOrderId ? (order.orders.length > 0 ? "#ff9800" : "#1976d2") : "transparent"}`,
                            border: order.orders.length === 0 && order.history.length > 0 ? "2px solid #4caf50" : "none",
                            position: "relative", transition: "all 0.3s ease",
                        }}
                        title={order.orders.length > 0 ? `Đang xử lý (${order.orders.reduce((sum, item) => sum + item.quantity, 0)} món)` : "Trống"}
                    >
                        Đơn {order.id}
                        {order.orders.length > 0 && (
                            <span style={{ position: "absolute", bottom: 8, right: 12, fontSize: 13, background: "#fff", color: "#ff9800", borderRadius: 8, padding: "2px 8px", fontWeight: 600 }}>
                                {order.orders.reduce((sum, item) => sum + item.quantity, 0)}{" "}món
                            </span>
                        )}
                        {order.orders.length === 0 && order.history.length > 0 && (
                            <span style={{ position: "absolute", top: 8, right: 12, fontSize: 13, background: "#4caf50", color: "#fff", borderRadius: 8, padding: "2px 8px", fontWeight: 600 }}>
                                Đã TT
                            </span>
                        )}
                    </div>
                ))}
                <div
                    onClick={() => {
                        setTakeaways(prev => {
                            // Nếu không còn đơn nào, reset id về 1
                            const newId = prev.length === 0 ? 1 : (prev[prev.length - 1].id + 1);
                            return [...prev, { id: newId, orders: [], history: [] }];
                        });
                    }}
                    style={{
                        width: 120, height: 100, background: "#fff", color: "#1976d2", border: "2px dashed #1976d2",
                        borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700,
                        fontSize: 48, cursor: "pointer", opacity: 0.4, transition: "opacity 0.2s, background 0.2s",
                        marginLeft: 0, marginRight: 0, userSelect: "none",
                    }}
                    title="Tạo đơn mang về mới"
                    onMouseOver={e => (e.currentTarget.style.opacity = 0.7)}
                    onMouseOut={e => (e.currentTarget.style.opacity = 0.4)}
                >
                    +
                </div>
            </div>

            {selectedOrder && (
                <div style={{ display: "flex", gap: 24, marginTop: 32, height: "75vh", minHeight: 400, }}>
                    <div style={{
                        flex: 1, background: "#fff", borderRadius: 16, boxShadow: "0 4px 24px #1976d233",
                        padding: 18, position: "relative", minWidth: 350, maxWidth: 450, fontSize: 15,
                        overflowY: "auto", display: "flex", flexDirection: "column",
                    }}>
                        <button onClick={() => setSelectedOrderId(null)} style={{ position: "absolute", top: 12, right: 16, background: "#eee", border: "none", borderRadius: 8, padding: "4px 12px", cursor: "pointer", zIndex: 10 }}>Đóng</button>
                        <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
                            <button onClick={() => setTab("order")} style={{ background: tab === "order" ? "#1976d2" : "#eee", color: tab === "order" ? "#fff" : "#1976d2", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>Đơn hiện tại</button>
                            <button onClick={() => setTab("history")} style={{ background: tab === "history" ? "#1976d2" : "#eee", color: tab === "history" ? "#fff" : "#1976d2", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>Lịch sử</button>
                        </div>
                        {tab === "order" ? (
                            <>
                                <h3 style={{ fontSize: 20, marginTop: 0 }}>Đơn mang về {selectedOrder.id}</h3>
                                {selectedOrder.orders.length === 0 ? (<p>Đơn chưa có món nào.</p>) : (
                                    <div style={{ display: "flex", flexDirection: "column", height: "100%", }}>
                                        <div style={{ flex: "1 1 auto", overflowY: "auto", minHeight: 0, }}>
                                            <table style={{ width: "100%", borderCollapse: "collapse", }}>
                                                <tbody>
                                                    {selectedOrder.orders.map((item, idx) => {
                                                        const itemTotal = item.price * item.quantity + (isMiCay(item.name) ? 3000 * item.quantity : 0);
                                                        return (
                                                            <tr key={idx} style={{ borderBottom: "1px solid #eee", }}>
                                                                <td style={{ padding: "8px 4px" }}>
                                                                    {item.name}
                                                                    {item.size && (<span style={{ color: "#1976d2", fontWeight: 600, }}>{" "}({item.size})</span>)}
                                                                    {item.note && (<div style={{ fontSize: 12, color: "#777", }}>Ghi chú: {item.note}</div>)}
                                                                    {isMiCay(item.name) && (<div style={{ color: "#e91e63", fontSize: 12, }}>+ Phụ phí{" "}{3000 * item.quantity}đ</div>)}
                                                                </td>
                                                                <td style={{ textAlign: "center", padding: "8px 4px", }}>x{item.quantity}</td>
                                                                <td style={{ textAlign: "right", whiteSpace: "nowrap", padding: "8px 4px", }}>{itemTotal.toLocaleString()}đ</td>
                                                                <td style={{ padding: "8px 4px", textAlign: "right", }}>
                                                                    <button onClick={() => handleRemoveOrder(idx)} style={{ background: "#e57373", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>Xóa</button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div style={{ flexShrink: 0, paddingTop: 12 }}>
                                            <div style={{ fontWeight: 700, fontSize: 18, marginTop: "auto" }}>Tổng tiền:{" "}<span style={{ color: "#1976d2" }}>{totalAmount.toLocaleString()}đ</span></div>
                                            <button onClick={() => setShowPayment(true)} style={{ background: "linear-gradient(90deg, #1976d2 60%, #ff9800 100%)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", fontSize: "1rem", fontWeight: 600, cursor: "pointer", marginTop: 12, width: "100%", }}>Thanh toán</button>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                {/* Lịch sử - giữ nguyên */}
                            </>
                        )}
                    </div>
                    <div style={{ flex: 2, background: "#fff", borderRadius: 16, boxShadow: "0 4px 24px #1976d233", padding: 18, display: "flex", flexDirection: "column", minHeight: 0, maxHeight: "100%", }}>
                        <ProductList onAddToCart={handleAddProductToOrder} />
                    </div>
                </div>
            )}
            {showPayment && selectedOrder && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.25)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ background: "#fff", borderRadius: 16, padding: "32px 28px", minWidth: 320, boxShadow: "0 4px 32px #0002", textAlign: "center", position: "relative" }}>
                        <button onClick={() => { setShowPayment(false); setCustomerCash(""); }} style={{ position: "absolute", top: 12, right: 16, background: "#eee", border: "none", borderRadius: 8, padding: "4px 12px", cursor: "pointer", }}>Đóng</button>
                        <h3>Chọn phương thức thanh toán cho Đơn mang về {selectedOrder.id}</h3>
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
                                        <input type="number" min={0} value={customerCash} onChange={e => setCustomerCash(e.target.value)} style={{ width: 120, padding: 6, borderRadius: 6, border: "1px solid #ccc" }} placeholder="Nhập số tiền" /> đ
                                    </label>
                                </div>
                                <div><b>Tiền thừa:</b><span style={{ color: change < 0 ? "#e91e63" : "#388e3c", fontWeight: 700 }}>{customerCash !== "" ? (change >= 0 ? change.toLocaleString() : 0) : 0}đ</span>
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
                                    <b>Nội dung:</b> TAKEAWAY{selectedOrder.id}
                                </div>
                                <div style={{ marginTop: 8 }}>
                                    <img src={`https://img.vietqr.io/image/970407-150220046789-compact2.jpg?amount=${totalAmount}&addInfo=TAKEAWAY${selectedOrder.id}`} alt="QR chuyển khoản" style={{ width: 180, height: 180, borderRadius: 12, border: "2px solid #1976d2" }} />
                                </div>
                                <div style={{ color: "#888", fontSize: 13, marginTop: 8 }}>Quét mã QR bằng app ngân hàng để chuyển khoản nhanh!</div>
                            </div>
                        )}
                        <button
                            onClick={handlePay}
                            style={{ background: "linear-gradient(90deg, #1976d2 60%, #e91e63 100%)", color: "#fff", border: "none", borderRadius: 10, padding: "12px 32px", fontSize: "1.1rem", fontWeight: 600, cursor: "pointer", opacity: paymentMethod === 'cash' && (customerCash === '' || change < 0) ? 0.5 : 1 }}
                            disabled={paymentMethod === "cash" && (customerCash === "" || Number(customerCash) < totalAmount)}>Xác nhận thanh toán</button>
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

export default TakeawayManager;