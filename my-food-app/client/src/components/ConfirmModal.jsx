import React from "react";

const ConfirmModal = ({ open, onClose, onConfirm }) => {
    if (!open) return null;
    return (
        <div style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.25)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
        }}>
            <div style={{
                background: "#fff",
                borderRadius: 16,
                padding: "32px 28px",
                minWidth: 320,
                boxShadow: "0 4px 32px #0002",
                textAlign: "center"
            }}>
                <h3>Xác nhận đặt món?</h3>
                <p>Bạn muốn chuyển sang trang giỏ hàng để xác nhận đơn?</p>
                <div style={{ marginTop: 24, display: "flex", justifyContent: "center", gap: 18 }}>
                    <button
                        onClick={onConfirm}
                        style={{
                            background: "linear-gradient(90deg, #1976d2 60%, #42a5f5 100%)",
                            color: "#fff",
                            border: "none",
                            borderRadius: 8,
                            padding: "10px 28px",
                            fontSize: "1rem",
                            fontWeight: 600,
                            cursor: "pointer"
                        }}
                    >
                        Xác nhận
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            background: "#eee",
                            color: "#333",
                            border: "none",
                            borderRadius: 8,
                            padding: "10px 22px",
                            fontSize: "1rem",
                            fontWeight: 500,
                            cursor: "pointer"
                        }}
                    >
                        Hủy
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;