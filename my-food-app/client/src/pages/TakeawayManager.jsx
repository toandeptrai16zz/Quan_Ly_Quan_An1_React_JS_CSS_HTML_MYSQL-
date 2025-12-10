import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import ProductList from "../components/ProductList";
import SuccessNotification from "../components/SuccessNotification";
import Bill from "../components/Bill";
import KitchenTicket from "../components/KitchenTicket"; // Import in tem

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
            itemTotal += 2000 * item.quantity;
        }
        return total + itemTotal;
    }, 0);
}

const TakeawayManager = () => {
    const [showSuccess, setShowSuccess] = useState(false);
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

    // ✅ Refs cho in ấn
    const billRef = useRef();
    const ticketRef = useRef();

    const [printOrder, setPrintOrder] = useState(null);
    const [stickersToPrint, setStickersToPrint] = useState([]); // State lưu danh sách tem cần in

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
                                category: product.category // Lưu category để lọc in tem
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

    const handlePay = useCallback(async () => {
        if (!selectedOrder) return;

        try {
            const payloadData = {
                order_type: 'takeaway',
                order_id: selectedOrder.id,
                orders: selectedOrder.orders,
                total: totalAmount,
                methodId: paymentMethod
            };

            const response = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payloadData)
            });

            if (!response.ok) {
                throw new Error(`Server error`);
            }

            setTakeaways(prev =>
                prev.map(t =>
                    t.id === selectedOrderId
                        ? {
                            ...t,
                            history: [...t.history, {
                                orders: t.orders,
                                total: totalAmount,
                                method: paymentMethod,
                                time: new Date().toISOString()
                            }],
                            orders: []
                        }
                        : t
                )
            );

            setShowPayment(false);
            setSelectedOrderId(null);
            setShowSuccess(true);
            setPaymentMethod('cash');
            setCustomerCash('');
        } catch (err) {
            console.error('Lỗi thanh toán:', err);
            alert('Thanh toán thất bại:\n' + err.message);
        }
    }, [selectedOrderId, paymentMethod, selectedOrder, totalAmount]);

    // ✅ Cấu hình in Hóa đơn
    const handlePrintBill = useReactToPrint({
        content: () => billRef.current,
        documentTitle: `Bill_Takeaway_${printOrder?.table || ''}_${Date.now()}`,
        onAfterPrint: () => setPrintOrder(null),
    });

    // ✅ Cấu hình in Tem (Stickers)
    const handlePrintStickers = useReactToPrint({
        content: () => ticketRef.current,
        onAfterPrint: () => setStickersToPrint([]),
    });

    // Tự động kích hoạt in khi có dữ liệu
    React.useEffect(() => {
        if (printOrder) handlePrintBill();
    }, [printOrder]);

    React.useEffect(() => {
        if (stickersToPrint.length > 0) handlePrintStickers();
    }, [stickersToPrint]);

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
                                                        const itemTotal = item.price * item.quantity + (isMiCay(item.name) ? 2000 * item.quantity : 0);
                                                        return (
                                                            <tr key={idx} style={{ borderBottom: "1px solid #eee", }}>
                                                                <td style={{ padding: "8px 4px" }}>
                                                                    {item.name}
                                                                    {item.size && (<span style={{ color: "#1976d2", fontWeight: 600, }}>{" "}({item.size})</span>)}
                                                                    {item.note && (<div style={{ fontSize: 12, color: "#777", }}>Ghi chú: {item.note}</div>)}
                                                                    {isMiCay(item.name) && (<div style={{ color: "#e91e63", fontSize: 12, }}>+ Phụ phí{" "}{2000 * item.quantity}đ</div>)}
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

            {/* ✅ FORM THANH TOÁN "SIÊU TO KHỔNG LỒ" (CÓ NÚT IN TEM) */}
            {showPayment && selectedOrder && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
                    <div style={{
                        background: "#fff", borderRadius: 20, padding: "40px",
                        width: "600px", maxWidth: "95vw", // ✅ Tăng độ rộng lên 600px
                        boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
                        textAlign: "center", position: "relative",
                        display: 'flex', flexDirection: 'column'
                    }}>
                        <button onClick={() => { setShowPayment(false); setCustomerCash(""); }} style={{ position: "absolute", top: 16, right: 16, background: "#f5f5f5", border: "none", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", fontSize: 18, fontWeight: 'bold', color: '#555' }}>✕</button>

                        <h2 style={{ margin: "0 0 30px 0", color: "#333", fontSize: "1.5rem" }}>
                            Thanh toán Đơn {selectedOrder.id}
                        </h2>

                        {/* CHỌN PHƯƠNG THỨC */}
                        <div style={{ display: "flex", gap: 20, justifyContent: "center", marginBottom: 30 }}>
                            <label style={{
                                flex: 1, padding: "15px", borderRadius: 12, cursor: "pointer", border: "2px solid",
                                borderColor: paymentMethod === "cash" ? "#1976d2" : "#eee",
                                background: paymentMethod === "cash" ? "#e3f2fd" : "#fff",
                                color: paymentMethod === "cash" ? "#1976d2" : "#555",
                                fontWeight: "bold", fontSize: "1.1rem", transition: "all 0.2s"
                            }}>
                                <input type="radio" name="payment" value="cash" checked={paymentMethod === "cash"} onChange={() => setPaymentMethod("cash")} style={{ display: "none" }} />
                                💵 Tiền mặt
                            </label>
                            <label style={{
                                flex: 1, padding: "15px", borderRadius: 12, cursor: "pointer", border: "2px solid",
                                borderColor: paymentMethod === "bank" ? "#1976d2" : "#eee",
                                background: paymentMethod === "bank" ? "#e3f2fd" : "#fff",
                                color: paymentMethod === "bank" ? "#1976d2" : "#555",
                                fontWeight: "bold", fontSize: "1.1rem", transition: "all 0.2s"
                            }}>
                                <input type="radio" name="payment" value="bank" checked={paymentMethod === "bank"} onChange={() => setPaymentMethod("bank")} style={{ display: "none" }} />
                                🏦 Chuyển khoản
                            </label>
                        </div>

                        {/* SỐ TIỀN CẦN THANH TOÁN */}
                        <div style={{ background: "#fafafa", borderRadius: 16, padding: "20px", marginBottom: 20 }}>
                            <div style={{ fontSize: "1.1rem", color: "#666", marginBottom: 8 }}>Tổng tiền phải thu:</div>
                            <div style={{ fontSize: "3rem", fontWeight: "900", color: "#1976d2", lineHeight: 1 }}>
                                {totalAmount.toLocaleString()}đ
                            </div>
                        </div>

                        {paymentMethod === "cash" && (
                            <div style={{ animation: "fadeIn 0.3s" }}>
                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ display: "block", fontSize: "1.1rem", marginBottom: 10, fontWeight: "600" }}>Tiền khách đưa:</label>
                                    <input
                                        type="number" min={0}
                                        value={customerCash}
                                        onChange={e => setCustomerCash(e.target.value)}
                                        style={{
                                            width: "100%", padding: "16px", borderRadius: 12,
                                            border: "2px solid #ccc", fontSize: "2rem", fontWeight: "bold",
                                            textAlign: "center", color: "#333", boxSizing: "border-box"
                                        }}
                                        placeholder="0"
                                        autoFocus
                                    />
                                </div>
                                <div style={{ fontSize: "1.2rem", display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px' }}>
                                    <span>Tiền thừa trả khách:</span>
                                    <span style={{
                                        fontSize: "2rem", fontWeight: "bold",
                                        color: change < 0 ? "#e91e63" : "#2e7d32"
                                    }}>
                                        {customerCash !== "" ? (change >= 0 ? change.toLocaleString() : "Thiếu tiền") : "0"}đ
                                    </span>
                                </div>
                            </div>
                        )}

                        {paymentMethod === "bank" && (
                            <div style={{ animation: "fadeIn 0.3s", display: "flex", gap: 20, alignItems: "center", textAlign: "left", background: "#f8f9fa", padding: 20, borderRadius: 16 }}>
                                <img
                                    src={`https://img.vietqr.io/image/970407-5061989666-compact2.jpg?amount=${totalAmount}&addInfo=TAKEAWAY${selectedOrder.id}`}
                                    alt="QR"
                                    style={{ width: 160, height: 160, borderRadius: 12, border: "2px solid #1976d2" }}
                                />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: "1.1rem", marginBottom: 6 }}><b>Techcombank</b></div>
                                    <div style={{ fontSize: "1.3rem", fontWeight: "bold", color: "#333", marginBottom: 6, letterSpacing: 1 }}>5061989666</div>
                                    <div style={{ fontSize: "1.1rem", marginBottom: 12 }}>HA THI NINH</div>
                                    <div style={{ fontSize: "0.9rem", color: "#666", fontStyle: "italic" }}>* Khách quét mã để thanh toán chính xác số tiền.</div>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: 16, marginTop: 40 }}>
                            {/* ✅ NÚT IN TEM LY - CÓ LOGIC LỌC ĐỒ UỐNG */}
                            <button
                                onClick={() => {
                                    const DRINK_CATEGORIES = ["Trà Sữa", "Nước Ép", "Đồ Uống Khác", "Topping thêm"];

                                    const drinksOnly = selectedOrder.orders.filter(item => {
                                        // 1. Check Size (Nước thường có size)
                                        if (item.size) return true;

                                        // 2. Check danh mục
                                        if (item.category && DRINK_CATEGORIES.includes(item.category)) return true;

                                        // 3. Check tên
                                        const name = item.name.toLowerCase();
                                        if (name.includes("trà") || name.includes("sữa") || name.includes("nước") || name.includes("ép")) return true;

                                        return false;
                                    });

                                    if (drinksOnly.length === 0) {
                                        alert("Đơn này không có đồ uống nào để in tem!");
                                        return;
                                    }

                                    setStickersToPrint(drinksOnly);
                                }}
                                style={{ flex: 1, background: "#ff9800", color: "#fff", border: "none", borderRadius: 12, padding: "16px", fontSize: "1.1rem", fontWeight: 700, cursor: "pointer", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                            >
                                🏷️ In Tem Ly
                            </button>

                            <button
                                onClick={async () => {
                                    await handlePay();
                                    setPrintOrder({ table: `Mang về ${selectedOrder.id}`, items: selectedOrder.orders, total: totalAmount, createdAt: new Date() });
                                }}
                                style={{ flex: 2, background: "linear-gradient(90deg, #1976d2, #1565c0)", color: "#fff", border: "none", borderRadius: 12, padding: "16px", fontSize: "1.1rem", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)" }}
                                disabled={paymentMethod === "cash" && (customerCash === "" || Number(customerCash) < totalAmount)}
                            >
                                🖨️ TT & In Bill
                            </button>
                            <button
                                onClick={handlePay}
                                style={{ flex: 1, background: "#eee", color: "#333", border: "none", borderRadius: 12, padding: "16px", fontSize: "1.1rem", fontWeight: 600, cursor: "pointer" }}
                                disabled={paymentMethod === "cash" && (customerCash === "" || Number(customerCash) < totalAmount)}
                            >
                                Không in
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ✅ KHU VỰC ẨN ĐỂ IN */}
            <div style={{ display: 'none' }}>
                <KitchenTicket ref={ticketRef} items={stickersToPrint} orderInfo={`Mang về - Đơn ${selectedOrder?.id}`} />
                <Bill ref={billRef} order={printOrder} />
            </div>

            {showSuccess && (
                <SuccessNotification onClose={() => setShowSuccess(false)} />
            )}
        </div>
    );
};

export default TakeawayManager;