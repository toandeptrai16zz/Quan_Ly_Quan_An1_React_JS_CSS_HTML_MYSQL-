import React from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import styles from './SuccessNotification.module.css';

const SuccessNotification = ({ onClose }) => {
    return (
        <div className={styles.notification}>
            <div className={styles.icon}>
                <FaCheckCircle />
            </div>
            <p className={styles.message}>Thanh toán thành công!</p>
            <button onClick={onClose} className={styles.okButton}>
                OK
            </button>
        </div>
    );
};

export default SuccessNotification;