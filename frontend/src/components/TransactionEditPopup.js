import React, { useState, useEffect } from "react";
import styles from "../styles/TransactionEditPopup.module.css";
import { getCustomLabels, updateTransaction } from "../api/api.mjs";

const TransactionEditPopup = ({ transaction, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    amount: "",
    vendor: "",
    customLabel: "",
    dateOfTransaction: "",
  });

  const [type, setType] = useState("");
  const [typeOptions, setTypeOptions] = useState([]);
  const [customLabelOptions, setCustomLabelOptions] = useState([]);
  const [isCustomLabelDisabled, setIsCustomLabelDisabled] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (transaction) {
      const isIncome = transaction.amount >= 0;

      setFormData({
        amount: Math.abs(transaction.amount),
        vendor: transaction.vendor || "",
        customLabel: transaction.tags[0] || "none",
        dateOfTransaction: new Date(transaction.dateOfTransaction)
          .toISOString()
          .substr(0, 10),
      });

      setType(isIncome ? "Income" : "Expense");

      const types = isIncome
        ? ["Salary", "Investment", "Year-end Bonus", "Other"]
        : [
            "Dining",
            "Shopping",
            "Daily Necessities",
            "Transportation",
            "Entertainment",
            "Housing",
            "Travel",
            "Other",
          ];

      setTypeOptions(types);

      fetchCustomLabels(isIncome ? "Income" : "Expense");
    }
  }, [transaction]);

  const fetchCustomLabels = async (transactionType) => {
    try {
      const data = await getCustomLabels(transactionType);
      const labels = data.customLabels;

      const labelNames = ["none"];
      if (labels && labels.length > 0) {
        labelNames.push(...labels.map((label) => label.labelName));
      }

      setCustomLabelOptions(labelNames);
      setIsCustomLabelDisabled(false);

      if (!labelNames.includes(formData.customLabel)) {
        setFormData((prev) => ({ ...prev, customLabel: "none" }));
      }
    } catch (error) {
      setCustomLabelOptions(["none"]);
      setIsCustomLabelDisabled(false);
      setFormData((prev) => ({ ...prev, customLabel: "none" }));
      setErrorMessage("Failed to fetch custom labels. Please try again.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "amount" && type === "Expense") {
      setFormData({ ...formData, [name]: -Math.abs(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleUpdate = () => {
    const { amount, vendor, customLabel, dateOfTransaction } = formData;

    if (
      amount === "" ||
      vendor.trim() === "" ||
      dateOfTransaction === "" ||
      type.trim() === ""
    ) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    const updatedData = {
      amount: formData.amount,
      vendor: formData.vendor,
      customLabel: formData.customLabel,
      dateOfTransaction: formData.dateOfTransaction,
    };

    onUpdate(updatedData);
    setErrorMessage("");
  };

  if (!transaction) return null;

  return (
    <div className={styles.popupOverlay}>
      <div className={styles.popupContent}>
        {errorMessage && (
          <div className={styles.errorMessage}>{errorMessage}</div>
        )}
        <button
          className={styles.cancelButton}
          onClick={onClose}
          aria-label="Close"
        >
          <img src="/images/cancel.png" alt="Cancel" />
        </button>
        <h2 className={styles.popupTitle}>Edit Transaction</h2>
        <div className={styles.formGroup}>
          <label>Amount:</label>
          <input
            type="number"
            name="amount"
            value={Math.abs(formData.amount)}
            onChange={handleChange}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label>Vendor:</label>
          <input
            type="text"
            name="vendor"
            value={formData.vendor}
            onChange={handleChange}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label>Type:</label>
          <input
            type="text"
            name="type"
            value={type}
            readOnly
            className={styles.readOnlyInput}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label>Custom Label:</label>
          <select
            name="customLabel"
            value={formData.customLabel}
            onChange={handleChange}
            disabled={isCustomLabelDisabled}
            required
          >
            {customLabelOptions.map((labelOption, index) => (
              <option key={index} value={labelOption}>
                {labelOption}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Transaction Date:</label>
          <input
            type="date"
            name="dateOfTransaction"
            value={formData.dateOfTransaction}
            onChange={handleChange}
            required
          />
        </div>
        <button className={styles.updateButton} onClick={handleUpdate}>
          Update
        </button>
      </div>
    </div>
  );
};

export default TransactionEditPopup;
