import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import ProductList from "../components/ProductList";
import SuccessNotification from "../components/SuccessNotification";
import Bill from "../components/Bill";
import KitchenTicket from "../components/KitchenTicket"; // Import in tem
import { useReactToPrint } from "react-to-print";

const STORAGE_KEY = "tables_data";
const INITIAL_TABLES = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    orders: [],
    history: [],
}));

const calculateTotal = (orders) => orders.reduce((total, item) => total + (item.price || 0) * item.quantity, 0);

const TableManager = () => {
    // 1. Khởi tạo dữ liệu bàn từ LocalStorage
    const [tables, setTables] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : INITIAL_TABLES;
        } catch (error) {
            return INITIAL_TABLES;
        }
    });

    const [selectedTableId, setSelectedTableId] = useState(null);
    const [showPayment, setShowPayment] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [tab, setTab] = useState("order");
    const [customerCash, setCustomerCash] = useState("");
    const [showSuccess, setShowSuccess] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // --- State cho in ấn ---
    const ticketRef = useRef();
    const billRef = useRef();

    // itemToPrint: Dùng để in phiếu bếp ngay khi gọi món (1 món) -> GIỮ NGUYÊN
    const [itemToPrint, setItemToPrint] = useState(null);
    // stickersToPrint: Dùng để in tem dán ly hàng loạt lúc thanh toán
    const [stickersToPrint, setStickersToPrint] = useState([]);
    // orderToPrint: Dùng để in hóa đơn tạm tính hoặc thanh toán
    const [orderToPrint, setOrderToPrint] = useState(null);

    // --- CẤU HÌNH IN ẤN ---

    // 1. In Phiếu Bếp (Tự động khi gọi món)
    const handlePrintTicket = useReactToPrint({
        content: () => ticketRef.current,
        onBeforeGetContent: () => new Promise(resolve => setTimeout(resolve, 100)), // Đợi render
        onAfterPrint: () => setItemToPrint(null),
    });

    // 2. In Tem Dán Ly (Thủ công nút bấm)
    const handlePrintStickers = useReactToPrint({
        content: () => ticketRef.current,
        onAfterPrint: () => setStickersToPrint([]),
    });

    // 3. In Hóa Đơn (Bill)
    const handlePrintBill = useReactToPrint({
        content: () => billRef.current,
        documentTitle: `Bill_Ban_${orderToPrint?.table || ''}_${Date.now()}`,
        onBeforeGetContent: () => new Promise(resolve => setTimeout(resolve, 100)),
        onAfterPrint: () => setOrderToPrint(null),
    });

    // Lưu dữ liệu mỗi khi thay đổi
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tables));
    }, [tables]);

    // --- Tự động kích hoạt lệnh in khi có dữ liệu ---
    useEffect(() => {
        if (itemToPrint) handlePrintTicket();
    }, [itemToPrint]);

    useEffect(() => {
        if (stickersToPrint.length > 0) handlePrintStickers();
    }, [stickersToPrint]);

    useEffect(() => {
        if (orderToPrint) handlePrintBill();
    }, [orderToPrint]);


    // --- TÍNH TOÁN ---
    const selectedTable = useMemo(() => tables.find(t => t.id === selectedTableId), [tables, selectedTableId]);
    const totalAmount = useMemo(() => selectedTable ? calculateTotal(selectedTable.orders) : 0, [selectedTable]);
    const change = useMemo(() => customerCash !== "" ? Math.max(0, Number(customerCash) - totalAmount) : 0, [customerCash, totalAmount]);
    const isPaymentValid = paymentMethod === "bank" || (customerCash !== "" && Number(customerCash) >= totalAmount);

    // --- XỬ LÝ GỌI MÓN ---
    const handleAddProductToOrder = useCallback((product, note, quantity = 1, size) => {
        if (!selectedTableId) {
            alert("Vui lòng chọn bàn trước khi thêm món!");
            return;
        }

        const newItem = { name: product.name, quantity, note, size };

        // ✅ QUAN TRỌNG: Giữ tính năng tự động in phiếu bếp khi gọi món
        //setItemToPrint([newItem]);

        setTables(prevTables =>
            prevTables.map(t => {
                if (t.id !== selectedTableId) return t;

                // Kiểm tra món trùng để cộng dồn số lượng
                const existingIdx = t.orders.findIndex(
                    item => item.name === product.name && item.note === note && item.size === size
                );

                if (existingIdx !== -1) {
                    const newOrders = [...t.orders];
                    newOrders[existingIdx].quantity += Number(quantity);
                    return { ...t, orders: newOrders };
                }

                return {
                    ...t,
                    orders: [...t.orders, { name: product.name, price: product.price, quantity: Number(quantity), note, size, category: product.category }], // Lưu cả category để lọc sau này
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

    // --- XỬ LÝ THANH TOÁN ---
    const handlePay = useCallback(async (shouldPrint = false) => {
        if (!selectedTable || isProcessing) return;

        setIsProcessing(true);
        const paymentData = {
            order_type: "table",
            order_id: `Bàn ${selectedTable.id}`,
            orders: selectedTable.orders,
            total: totalAmount,
            method: paymentMethod,
        };

        try {
            const response = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paymentData),
            });

            if (!response.ok) throw new Error("Lỗi Server");

            // In hóa đơn nếu cần
            if (shouldPrint) {
                const billData = {
                    table: selectedTable.id,
                    items: selectedTable.orders,
                    total: totalAmount,
                    createdAt: new Date()
                };
                setOrderToPrint(billData);
            }

            // Xóa bàn & Lưu lịch sử
            setTables(prevTables =>
                prevTables.map(t =>
                    t.id === selectedTableId
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
            setSelectedTableId(null);
            setPaymentMethod("cash");
            setCustomerCash("");
            setShowSuccess(true);
        } catch (error) {
            console.error('Lỗi thanh toán:', error);
            alert(`Thanh toán thất bại: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    }, [selectedTableId, paymentMethod, selectedTable, totalAmount, isProcessing]);

    // --- Component thẻ bàn ---
    const TableCard = ({ table }) => {
        const itemCount = table.orders.reduce((sum, item) => sum + item.quantity, 0);
        const hasOrders = table.orders.length > 0;
        const hasHistory = table.history.length > 0;

        return (
            <div
                onClick={() => { setSelectedTableId(table.id); setTab("order"); }}
                style={{
                    width: 120, height: 100,
                    background: hasOrders ? "#ff9800" : "#1976d2",
                    color: "#fff", borderRadius: 16,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: 20, cursor: "pointer",
                    boxShadow: table.id === selectedTableId
                        ? `0 0 0 4px ${hasOrders ? "#ff9800" : "#1976d2"}, 0 8px 20px rgba(0,0,0,0.15)`
                        : "0 4px 12px rgba(0,0,0,0.1)",
                    border: !hasOrders && hasHistory ? "2px solid #4caf50" : "none",
                    position: "relative", transition: "all 0.3s ease",
                    transform: table.id === selectedTableId ? "translateY(-4px)" : "none",
                }}
            >
                Bàn {table.id}
                {hasOrders && (
                    <span style={{ position: "absolute", bottom: 8, right: 12, fontSize: 13, background: "#fff", color: "#ff9800", borderRadius: 8, padding: "2px 8px", fontWeight: 600 }}>
                        {itemCount} món
                    </span>
                )}
                {!hasOrders && hasHistory && (
                    <span style={{ position: "absolute", top: 8, right: 12, fontSize: 13, background: "#4caf50", color: "#fff", borderRadius: 8, padding: "2px 8px", fontWeight: 600 }}>
                        Đã TT
                    </span>
                )}
            </div>
        );
    };

    return (
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: 24, minHeight: "100vh", background: "#f5f7fa" }}>
            <h2 style={{ textAlign: "center", marginBottom: 32, color: "#1976d2", fontSize: 28, fontWeight: 700 }}>
                Quản lý bàn ăn tại quán
            </h2>

            {/* DANH SÁCH BÀN */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 18, justifyContent: "center", marginBottom: 32 }}>
                {tables.map(table => <TableCard key={table.id} table={table} />)}
            </div>

            {/* GIAO DIỆN CHI TIẾT BÀN */}
            {selectedTable && (
                <div style={{ display: "flex", gap: 24, height: "75vh", minHeight: 400 }}>
                    {/* CỘT TRÁI: CHI TIẾT ĐƠN */}
                    <div style={{
                        flex: 1, background: "#fff", borderRadius: 16,
                        boxShadow: "0 4px 24px rgba(25, 118, 210, 0.2)",
                        padding: 24, position: "relative",
                        minWidth: 320, maxWidth: 450,
                        display: "flex", flexDirection: "column", overflow: "hidden"
                    }}>
                        <button onClick={() => setSelectedTableId(null)} style={{ position: "absolute", top: 16, right: 16, background: "#f5f5f5", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 600 }}>✕ Đóng</button>

                        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
                            <button onClick={() => setTab("order")} style={{ flex: 1, background: tab === "order" ? "#1976d2" : "#f5f5f5", color: tab === "order" ? "#fff" : "#666", border: "none", borderRadius: 10, padding: "12px 24px", fontWeight: 600, cursor: "pointer" }}>Đơn hiện tại</button>
                            <button onClick={() => setTab("history")} style={{ flex: 1, background: tab === "history" ? "#1976d2" : "#f5f5f5", color: tab === "history" ? "#fff" : "#666", border: "none", borderRadius: 10, padding: "12px 24px", fontWeight: 600, cursor: "pointer" }}>Lịch sử</button>
                        </div>

                        {tab === "order" ? (
                            <>
                                <h3 style={{ fontSize: 22, marginTop: 0, marginBottom: 16, color: "#333" }}>Bàn {selectedTable.id}</h3>
                                {selectedTable.orders.length === 0 ? (
                                    <div style={{ textAlign: "center", padding: "40px 20px", color: "#999", background: "#f9f9f9", borderRadius: 12, border: "2px dashed #ddd" }}>
                                        <div style={{ fontSize: 48, marginBottom: 12 }}>🍽️</div>
                                        <p style={{ margin: 0, fontSize: 16 }}>Bàn trống. Chọn món từ Menu bên cạnh.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ flex: 1, overflowY: "auto", marginBottom: 16 }}>
                                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                                <tbody>
                                                    {selectedTable.orders.map((item, idx) => (
                                                        <tr key={idx} style={{ borderBottom: "1px solid #f0f0f0" }}>
                                                            <td style={{ padding: "12px 8px" }}>
                                                                <div style={{ fontWeight: 600, fontSize: 15 }}>
                                                                    {item.name} {item.size && <span style={{ color: "#1976d2" }}>({item.size})</span>}
                                                                </div>
                                                                {item.note && <div style={{ color: "#666", fontSize: 12, marginTop: 4, fontStyle: "italic" }}>💬 {item.note}</div>}
                                                            </td>
                                                            <td style={{ padding: "12px 8px", textAlign: "center", fontWeight: 600, color: "#1976d2" }}>×{item.quantity}</td>
                                                            <td style={{ padding: "12px 8px", textAlign: "right", fontWeight: 600 }}>{(item.price * item.quantity).toLocaleString()}đ</td>
                                                            <td style={{ padding: "12px 8px", textAlign: "right" }}>
                                                                <button onClick={() => handleRemoveOrder(idx)} style={{ background: "#ff5252", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontWeight: 600 }}>Xóa</button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div style={{ borderTop: "2px solid #f0f0f0", padding: "16px", background: "#f9f9f9", borderRadius: 12, marginTop: "auto" }}>
                                            <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <span>Tổng tiền:</span>
                                                <span style={{ color: "#1976d2", fontSize: 24 }}>{totalAmount.toLocaleString()}đ</span>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const billData = { table: selectedTable.id, items: selectedTable.orders, total: totalAmount, createdAt: new Date() };
                                                    setOrderToPrint(billData);
                                                }}
                                                style={{ width: "100%", background: "#6c757d", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontSize: 15, fontWeight: 600, cursor: "pointer", marginBottom: 10 }}
                                            >
                                                🖨️ In Hóa Đơn Tạm Tính
                                            </button>
                                            <button onClick={() => setShowPayment(true)} style={{ width: "100%", background: "linear-gradient(135deg, #1976d2 0%, #ff9800 100%)", color: "#fff", border: "none", borderRadius: 10, padding: "14px", fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)" }}>
                                                💳 Thanh toán
                                            </button>
                                        </div>
                                    </>
                                )}
                            </>
                        ) : (
                            // TAB LỊCH SỬ
                            <div style={{ overflowY: "auto" }}>
                                {selectedTable.history.length === 0 ? <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>Chưa có lịch sử.</div> :
                                    selectedTable.history.map((h, i) => (
                                        <div key={i} style={{ background: "#f9f9f9", padding: 16, borderRadius: 10, marginBottom: 12, border: "1px solid #e0e0e0" }}>
                                            <div style={{ fontWeight: 600, marginBottom: 8, color: "#1976d2" }}>{new Date(h.time).toLocaleString("vi-VN")}</div>
                                            <div style={{ fontSize: 18, fontWeight: 700 }}>{h.total.toLocaleString()}đ</div>
                                            <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>Phương thức: {h.method === "cash" ? "Tiền mặt" : "Chuyển khoản"}</div>
                                        </div>
                                    ))
                                }
                            </div>
                        )}
                    </div>

                    {/* CỘT PHẢI: MENU CHỌN MÓN */}
                    <div style={{ flex: 2, background: "#fff", borderRadius: 16, boxShadow: "0 4px 24px rgba(25, 118, 210, 0.2)", padding: 24, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                        <ProductList onAddToCart={handleAddProductToOrder} />
                    </div>
                </div>
            )}

            {/* ✅ POPUP THANH TOÁN (SIÊU TO & CÓ IN TEM) */}
            {showPayment && selectedTable && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
                    <div style={{ background: "#fff", borderRadius: 20, padding: "40px", width: "600px", maxWidth: "95vw", boxShadow: "0 10px 40px rgba(0,0,0,0.2)", textAlign: "center", position: "relative", display: 'flex', flexDirection: 'column' }}>
                        <button onClick={() => { setShowPayment(false); setCustomerCash(""); }} style={{ position: "absolute", top: 16, right: 16, background: "#f5f5f5", border: "none", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", fontSize: 18, fontWeight: 'bold', color: '#555' }}>✕</button>

                        <h2 style={{ margin: "0 0 30px 0", color: "#333", fontSize: "1.5rem" }}>Thanh toán Bàn {selectedTable.id}</h2>

                        {/* Chọn phương thức */}
                        <div style={{ display: "flex", gap: 20, justifyContent: "center", marginBottom: 30 }}>
                            <label style={{ flex: 1, padding: "15px", borderRadius: 12, cursor: "pointer", border: "2px solid", borderColor: paymentMethod === "cash" ? "#1976d2" : "#eee", background: paymentMethod === "cash" ? "#e3f2fd" : "#fff", color: paymentMethod === "cash" ? "#1976d2" : "#555", fontWeight: "bold", fontSize: "1.1rem" }}>
                                <input type="radio" name="payment" value="cash" checked={paymentMethod === "cash"} onChange={() => setPaymentMethod("cash")} style={{ display: "none" }} /> 💵 Tiền mặt
                            </label>
                            <label style={{ flex: 1, padding: "15px", borderRadius: 12, cursor: "pointer", border: "2px solid", borderColor: paymentMethod === "bank" ? "#1976d2" : "#eee", background: paymentMethod === "bank" ? "#e3f2fd" : "#fff", color: paymentMethod === "bank" ? "#1976d2" : "#555", fontWeight: "bold", fontSize: "1.1rem" }}>
                                <input type="radio" name="payment" value="bank" checked={paymentMethod === "bank"} onChange={() => setPaymentMethod("bank")} style={{ display: "none" }} /> 🏦 Chuyển khoản
                            </label>
                        </div>

                        {/* Tổng tiền */}
                        <div style={{ background: "#fafafa", borderRadius: 16, padding: "20px", marginBottom: 20 }}>
                            <div style={{ fontSize: "1.1rem", color: "#666", marginBottom: 8 }}>Tổng tiền phải thu:</div>
                            <div style={{ fontSize: "3rem", fontWeight: "900", color: "#1976d2", lineHeight: 1 }}>{totalAmount.toLocaleString()}đ</div>
                        </div>

                        {/* Nhập tiền mặt */}
                        {paymentMethod === "cash" && (
                            <div style={{ marginBottom: 20 }}>
                                <input type="number" min={0} value={customerCash} onChange={e => setCustomerCash(e.target.value)} style={{ width: "100%", padding: "16px", borderRadius: 12, border: "2px solid #ccc", fontSize: "2rem", fontWeight: "bold", textAlign: "center", color: "#333", boxSizing: "border-box" }} placeholder="0" autoFocus />
                                <div style={{ fontSize: "1.2rem", display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px 0' }}>
                                    <span>Tiền thừa:</span>
                                    <span style={{ fontSize: "2rem", fontWeight: "bold", color: change < 0 ? "#e91e63" : "#2e7d32" }}>{customerCash !== "" ? (change >= 0 ? change.toLocaleString() : "Thiếu") : "0"}đ</span>
                                </div>
                            </div>
                        )}

                        {/* QR Chuyển khoản */}
                        {paymentMethod === "bank" && (
                            <div style={{ display: "flex", gap: 20, alignItems: "center", background: "#f8f9fa", padding: 20, borderRadius: 16, marginBottom: 20 }}>
                                <img src={`https://img.vietqr.io/image/970407-5061989666-compact2.jpg?amount=${totalAmount}&addInfo=TABLE${selectedTable.id}`} alt="QR" style={{ width: 160, height: 160, borderRadius: 12, border: "2px solid #1976d2" }} />
                                <div style={{ flex: 1, textAlign: 'left' }}>
                                    <div style={{ fontSize: "1.1rem", marginBottom: 6 }}><b>Techcombank</b></div>
                                    <div style={{ fontSize: "1.3rem", fontWeight: "bold", color: "#333", marginBottom: 6 }}>5061989666</div>
                                    <div style={{ fontSize: "1.1rem" }}>HA THI NINH</div>
                                </div>
                            </div>
                        )}

                        {/* NÚT CHỨC NĂNG */}
                        <div style={{ display: 'flex', gap: 16, marginTop: 20 }}>
                            {/* ✅ Nút In Tem Ly (ĐÃ CÓ LOGIC LỌC ĐỒ UỐNG) */}
                            {/* ✅ Nút In Tem Ly (ĐÃ SỬA LOGIC CHẶN NƯỚC ĐÓNG CHAI) */}
                            <button
                                onClick={() => {
                                    // 1. DANH SÁCH ĐEN: Những từ khóa của nước đóng chai (Không in tem)
                                    const BOTTLED_DRINKS = ["coca", "pepsi", "7 up", "7up", "sting", "c2", "247", "redbull", "bò húc", "revive", "nước suối", "aquafina", "dasani", "lon"];

                                    // 2. DANH SÁCH TRẮNG: Những từ khóa của đồ pha chế (Cần in tem)
                                    const PREPARED_KEYWORDS = ["trà", "sữa", "ép", "sinh tố", "đá xay", "café", "cà phê", "bạc xỉu", "soda", "chanh", "quất", "tắc", "mơ", "sấu", "dừa", "cacao", "kem", "sầu riêng", "matcha", "topping"];

                                    // 3. DANH MỤC PHA CHẾ (Hỗ trợ thêm)
                                    const PREPARED_CATEGORIES = ["Trà Sữa", "Nước Ép", "Nước Ép & Sinh Tố", "Cà Phê", "Topping thêm"];

                                    const drinksOnly = selectedTable.orders.filter(item => {
                                        const name = item.name.toLowerCase(); // Chuyển tên về chữ thường để so sánh

                                        // 🛑 BƯỚC 1: KIỂM TRA LOẠI TRỪ TRƯỚC (QUAN TRỌNG NHẤT)
                                        // Nếu tên chứa từ khóa đóng chai -> LẬP TỨC BỎ QUA
                                        if (BOTTLED_DRINKS.some(bottle => name.includes(bottle))) return false;

                                        // ✅ BƯỚC 2: KIỂM TRA CHẤP NHẬN

                                        // Điều kiện A: Có chọn Size (S/M/L) -> Chắc chắn là đồ pha chế
                                        if (item.size) return true;

                                        // Điều kiện B: Tên chứa từ khóa pha chế (trà chanh, nước ép...)
                                        if (PREPARED_KEYWORDS.some(keyword => name.includes(keyword))) return true;

                                        // Điều kiện C: Thuộc danh mục đồ uống pha chế
                                        // (Lưu ý: Đã qua bước 1 nên Sting trong 'Đồ Uống Khác' đã bị loại rồi)
                                        if (item.category && PREPARED_CATEGORIES.includes(item.category)) return true;

                                        return false; // Còn lại thì bỏ qua
                                    });

                                    if (drinksOnly.length === 0) {
                                        alert("Bàn này không có đồ uống pha chế nào để in tem!");
                                        return;
                                    }

                                    setStickersToPrint(drinksOnly);
                                }}
                                style={{ flex: 1, background: "#ff9800", color: "#fff", border: "none", borderRadius: 12, padding: "16px", fontSize: "1.1rem", fontWeight: 700, cursor: "pointer", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                            >
                                🏷️ In Tem Ly
                            </button>

                            <button onClick={() => handlePay(true)} disabled={!isPaymentValid || isProcessing} style={{ flex: 2, background: "linear-gradient(90deg, #1976d2, #1565c0)", color: "#fff", border: "none", borderRadius: 12, padding: "16px", fontSize: "1.1rem", fontWeight: 700, cursor: isPaymentValid ? "pointer" : "not-allowed", opacity: isPaymentValid ? 1 : 0.6 }}>{isProcessing ? "Đang xử lý..." : "🖨️ TT & In Bill"}</button>

                            <button onClick={() => handlePay(false)} disabled={!isPaymentValid || isProcessing} style={{ flex: 1, background: "#eee", color: "#333", border: "none", borderRadius: 12, padding: "16px", fontSize: "1.1rem", fontWeight: 600, cursor: isPaymentValid ? "pointer" : "not-allowed", opacity: isPaymentValid ? 1 : 0.6 }}>Không in</button>
                        </div>
                    </div>
                </div>
            )}

            {showSuccess && <SuccessNotification onClose={() => setShowSuccess(false)} />}

            {/* ✅ VÙNG IN ẨN: Xử lý cả in lẻ (itemToPrint) và in tem hàng loạt (stickersToPrint) */}
            <div style={{ display: 'none' }}>
                <KitchenTicket ref={ticketRef} items={itemToPrint || stickersToPrint} orderInfo={`Bàn ${selectedTable?.id}`} />
                <Bill ref={billRef} order={orderToPrint} />
            </div>
        </div>
    );
};

export default TableManager;