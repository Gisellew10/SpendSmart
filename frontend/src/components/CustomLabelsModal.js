import React, { useState } from "react";
import styles from "../styles/CustomLabelsModal.module.css";

const CustomLabelsModal = ({
  customLabels,
  onClose,
  onAddLabel,
  onDeleteLabel,
  type,
}) => {
  const [newLabelName, setNewLabelName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleAddLabel = () => {
    if (newLabelName.trim() === "") {
      setErrorMessage("A label name is required.");
      return;
    }
    onAddLabel(newLabelName.trim());
    setNewLabelName("");
    setErrorMessage("");
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button className={styles.closeButton} onClick={onClose}>
          X
        </button>
        <h2>{type} Custom Labels</h2>
        {customLabels.length > 0 ? (
          <ul className={styles.labelList}>
            {customLabels.map((label) => (
              <li key={label._id} className={styles.labelItem}>
                {label.labelName}
                <button
                  className={styles.deleteButton}
                  onClick={() => onDeleteLabel(label.labelName)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>Empty</p>
        )}
        <div className={styles.newLabelForm}>
          <h3>New Custom Label</h3>
          <input
            type="text"
            value={newLabelName}
            onChange={(e) => setNewLabelName(e.target.value)}
            placeholder="Enter label name"
          />
          <button onClick={handleAddLabel}>Create</button>
          {errorMessage && (
            <p className={styles.errorMessage}>{errorMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomLabelsModal;
