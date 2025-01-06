import React, { useEffect, useRef } from "react";
import styles from "../styles/ConfirmationModal.module.css";

const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.modalOverlay}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
      aria-describedby="confirmation-modal-message"
    >
      <div
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
        tabIndex="-1"
        ref={modalRef}
        role="dialog"
        aria-labelledby="confirmation-modal-title"
        aria-describedby="confirmation-modal-message"
      >
        <h3 className={styles.modalTitle} id="confirmation-modal-title">
          {title}
        </h3>
        <p className={styles.modalMessage} id="confirmation-modal-message">
          {message}
        </p>
        <div className={styles.modalActions}>
          <button className={styles.confirmButton} onClick={onConfirm}>
            Confirm
          </button>
          <button className={styles.cancelButton} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
