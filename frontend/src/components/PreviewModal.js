import React, { useEffect, useState } from "react";
import previewStyles from "../styles/previewModal.module.css";
import { addTransactionsBulk, getCustomLabels } from "../api/api.mjs";

const parseDate = (dateString) => {
  if (!dateString) {
    return "2024-01-01";
  }

  const parts = dateString.split("-").map(Number);
  let year, month, day;

  if (parts.length === 3) {
    [year, month, day] = parts;
  } else {
    return "2024-01-01";
  }

  if (
    isNaN(year) ||
    isNaN(month) ||
    isNaN(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return "2024-01-01";
  }

  month = month < 10 ? `0${month}` : month;
  day = day < 10 ? `0${day}` : day;
  return `${year}-${month}-${day}`;
};

const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

const PreviewModal = ({
  extractedData,
  loading,
  setShowPreview,
  selectedBook,
}) => {
  const [data, setData] = useState([]);
  const [customLabelsIncome, setCustomLabelsIncome] = useState([]);
  const [customLabelsExpense, setCustomLabelsExpense] = useState([]);
  const [hasCustomLabels, setHasCustomLabels] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  const expenseCategories = [
    "Dining",
    "Shopping",
    "Daily Necessities",
    "Transportation",
    "Entertainment",
    "Housing",
    "Travel",
    "Other",
  ];
  const incomeCategories = ["Salary", "Investment", "Year-end Bonus", "Other"];

  useEffect(() => {
    if (extractedData && selectedBook) {
      const enrichedData = extractedData.map((transaction) => ({
        relatedBookId: selectedBook._id,
        category: "Other",
        transactionType: "",
        tags: ["none"],
        vendor: transaction.vendor || "Unknown Vendor",
        amount: Math.abs(transaction.amount) || 0.0,
        dateOfTransaction: parseDate(transaction.date),
        isCategoryDisabled: true,
        isTagsDisabled: true,
        customLabelOptions: [],
        showTagsDropdown: false,
      }));
      setData(enrichedData);
    }
  }, [extractedData, selectedBook]);

  useEffect(() => {
    const fetchCustomLabels = async () => {
      try {
        const incomeLabelsResponse = await getCustomLabels("Income");
        const expenseLabelsResponse = await getCustomLabels("Expense");

        setCustomLabelsIncome(incomeLabelsResponse.customLabels || []);
        setCustomLabelsExpense(expenseLabelsResponse.customLabels || []);

        if (
          (incomeLabelsResponse.customLabels &&
            incomeLabelsResponse.customLabels.length > 0) ||
          (expenseLabelsResponse.customLabels &&
            expenseLabelsResponse.customLabels.length > 0)
        ) {
          setHasCustomLabels(true);
        }
      } catch (error) {
        console.error("Error fetching custom labels:", error);
      }
    };

    fetchCustomLabels();
  }, []);

  const handleChange = (index, field, value) => {
    const updatedData = [...data];
    if (field === "tags") {
      updatedData[index][field] = value;
    } else if (field === "amount") {
      updatedData[index][field] = parseFloat(value) || 0.0;
    } else {
      updatedData[index][field] = value;
    }

    if (field === "transactionType") {
      updatedData[index]["category"] = "Other";
      updatedData[index]["isCategoryDisabled"] = false;
      updatedData[index]["isTagsDisabled"] = false;
      updatedData[index]["tags"] = ["none"];
      updatedData[index]["showTagsDropdown"] = false;

      if (value === "Expense") {
        updatedData[index]["customLabelOptions"] = customLabelsExpense;
      } else if (value === "Income") {
        updatedData[index]["customLabelOptions"] = customLabelsIncome;
      }
    }
    setData(updatedData);

    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      if (newErrors[index]) {
        delete newErrors[index][field];
        if (Object.keys(newErrors[index]).length === 0) {
          delete newErrors[index];
        }
      }
      return newErrors;
    });
  };

  const handleTagsChange = (index, tagName) => {
    const updatedData = [...data];
    const transaction = updatedData[index];

    if (tagName === "none") {
      transaction.tags = ["none"];
    } else {
      if (transaction.tags.includes("none")) {
        transaction.tags = [];
      }

      if (transaction.tags.includes(tagName)) {
        transaction.tags = transaction.tags.filter((tag) => tag !== tagName);
      } else {
        transaction.tags.push(tagName);
      }

      if (transaction.tags.length === 0) {
        transaction.tags = ["none"];
      }
    }

    setData(updatedData);
  };

  const toggleTagsDropdown = (index) => {
    const updatedData = [...data];
    updatedData[index].showTagsDropdown = !updatedData[index].showTagsDropdown;
    setData(updatedData);
  };

  const handleDelete = (index) => {
    setData((prevData) => prevData.filter((_, i) => i !== index));
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      delete newErrors[index];
      const adjustedErrors = {};
      Object.keys(newErrors).forEach((key) => {
        const keyNum = parseInt(key, 10);
        const newKey = keyNum > index ? keyNum - 1 : keyNum;
        adjustedErrors[newKey] = newErrors[key];
      });
      return adjustedErrors;
    });
  };

  const handleSave = async () => {
    setSuccessMessage("");
    setSaveError("");

    const formattedData = data.map((transaction) => ({
      ...transaction,
      dateOfTransaction: parseDate(transaction.dateOfTransaction),
    }));

    const newErrors = {};

    formattedData.forEach((transaction, i) => {
      const transactionErrors = {};

      if (!transaction.vendor || transaction.vendor.trim() === "") {
        transactionErrors.vendor = "Vendor is required.";
      }

      if (isNaN(transaction.amount)) {
        transactionErrors.amount = "Amount must be a number.";
      }

      if (
        !transaction.dateOfTransaction ||
        !isValidDate(transaction.dateOfTransaction)
      ) {
        transactionErrors.dateOfTransaction = "Valid date is required.";
      }

      if (!transaction.transactionType) {
        transactionErrors.transactionType = "Transaction type is required.";
      }

      if (!transaction.category) {
        transactionErrors.category = "Category is required.";
      }

      if (!transaction.relatedBookId) {
        transactionErrors.relatedBookId = "Related book is required.";
      }

      if (!transaction.tags || transaction.tags.length === 0) {
        transactionErrors.tags = "At least one tag is required.";
      }

      if (Object.keys(transactionErrors).length > 0) {
        newErrors[i] = transactionErrors;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstErrorIndex = Object.keys(newErrors)[0];
      const firstErrorField = Object.keys(newErrors[firstErrorIndex])[0];
      const element = document.querySelector(
        `#transaction-${firstErrorIndex}-${firstErrorField}`,
      );
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.focus();
      }
      return;
    }

    const adjustedData = formattedData.map((transaction) => {
      let adjustedAmount = parseFloat(transaction.amount);
      if (transaction.transactionType === "Expense") {
        adjustedAmount = -Math.abs(adjustedAmount);
      } else {
        adjustedAmount = Math.abs(adjustedAmount);
      }
      return {
        ...transaction,
        amount: adjustedAmount,
      };
    });

    setIsSaving(true);
    try {
      await addTransactionsBulk(adjustedData);
      setSuccessMessage("Transactions saved successfully.");
      setShowPreview(false);
    } catch (error) {
      setSaveError("Failed to save transactions. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setShowPreview(false);
  };

  return (
    <div className={previewStyles.modalOverlay}>
      <div className={previewStyles.modalContent}>
        {loading ? (
          <p className={previewStyles.processingMessage}>
            Processing file, please wait...
          </p>
        ) : (
          <>
            <h3 className={previewStyles.heading}>Preview Extracted Data</h3>

            {successMessage && (
              <div className={previewStyles.successMessage}>
                {successMessage}
              </div>
            )}

            {saveError && (
              <div className={previewStyles.saveErrorMessage}>{saveError}</div>
            )}

            {data.length > 0 ? (
              <div className={previewStyles.tableContainer}>
                <table className={previewStyles.extractedDataTable}>
                  <thead>
                    <tr>
                      <th>Vendor</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Transaction Type</th>
                      <th>Category</th>
                      {hasCustomLabels && <th>Tags</th>}
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((transaction, index) => (
                      <tr key={index}>
                        <td>
                          <input
                            id={`transaction-${index}-vendor`}
                            type="text"
                            value={transaction.vendor}
                            onChange={(e) =>
                              handleChange(index, "vendor", e.target.value)
                            }
                            className={`${previewStyles.inputField} ${
                              errors[index]?.vendor
                                ? previewStyles.errorInput
                                : ""
                            }`}
                            required
                          />
                          {errors[index]?.vendor && (
                            <span className={previewStyles.errorMessage}>
                              {errors[index].vendor}
                            </span>
                          )}
                        </td>
                        <td>
                          <input
                            id={`transaction-${index}-amount`}
                            type="number"
                            step="0.01"
                            value={transaction.amount}
                            onChange={(e) =>
                              handleChange(index, "amount", e.target.value)
                            }
                            className={`${previewStyles.inputField} ${
                              errors[index]?.amount
                                ? previewStyles.errorInput
                                : ""
                            }`}
                            required
                          />
                          {errors[index]?.amount && (
                            <span className={previewStyles.errorMessage}>
                              {errors[index].amount}
                            </span>
                          )}
                        </td>
                        <td>
                          <input
                            id={`transaction-${index}-dateOfTransaction`}
                            type="date"
                            value={transaction.dateOfTransaction}
                            onChange={(e) =>
                              handleChange(
                                index,
                                "dateOfTransaction",
                                e.target.value,
                              )
                            }
                            className={`${previewStyles.inputField} ${
                              errors[index]?.dateOfTransaction
                                ? previewStyles.errorInput
                                : ""
                            }`}
                            required
                          />
                          {errors[index]?.dateOfTransaction && (
                            <span className={previewStyles.errorMessage}>
                              {errors[index].dateOfTransaction}
                            </span>
                          )}
                        </td>
                        <td>
                          <select
                            id={`transaction-${index}-transactionType`}
                            value={transaction.transactionType}
                            onChange={(e) =>
                              handleChange(
                                index,
                                "transactionType",
                                e.target.value,
                              )
                            }
                            className={`${previewStyles.inputField} ${
                              errors[index]?.transactionType
                                ? previewStyles.errorInput
                                : ""
                            }`}
                            required
                          >
                            <option value="" disabled>
                              Select Type
                            </option>
                            <option value="Expense">Expense</option>
                            <option value="Income">Income</option>
                          </select>
                          {errors[index]?.transactionType && (
                            <span className={previewStyles.errorMessage}>
                              {errors[index].transactionType}
                            </span>
                          )}
                        </td>
                        <td>
                          <select
                            id={`transaction-${index}-category`}
                            value={transaction.category}
                            onChange={(e) =>
                              handleChange(index, "category", e.target.value)
                            }
                            className={`${previewStyles.inputField} ${
                              errors[index]?.category
                                ? previewStyles.errorInput
                                : ""
                            }`}
                            required
                            disabled={transaction.isCategoryDisabled}
                          >
                            <option value="" disabled>
                              Select Category
                            </option>
                            {(transaction.transactionType === "Expense"
                              ? expenseCategories
                              : incomeCategories
                            ).map((categoryOption) => (
                              <option
                                key={categoryOption}
                                value={categoryOption}
                              >
                                {categoryOption}
                              </option>
                            ))}
                          </select>
                          {errors[index]?.category && (
                            <span className={previewStyles.errorMessage}>
                              {errors[index].category}
                            </span>
                          )}
                        </td>
                        {hasCustomLabels && (
                          <td>
                            <div
                              className={`${previewStyles.dropdownWrapper} ${
                                transaction.isTagsDisabled
                                  ? previewStyles.disabled
                                  : ""
                              }`}
                            >
                              <div
                                className={previewStyles.dropdownHeader}
                                onClick={() => toggleTagsDropdown(index)}
                              >
                                {transaction.tags.includes("none")
                                  ? "None"
                                  : transaction.tags.join(", ") ||
                                    "Select Tags"}
                                <span className={previewStyles.dropdownArrow}>
                                  ▼
                                </span>
                              </div>
                              {transaction.showTagsDropdown && (
                                <div className={previewStyles.dropdownList}>
                                  <label className={previewStyles.dropdownItem}>
                                    <input
                                      type="checkbox"
                                      checked={transaction.tags.includes(
                                        "none",
                                      )}
                                      onChange={() =>
                                        handleTagsChange(index, "none")
                                      }
                                    />
                                    None
                                  </label>
                                  {transaction.customLabelOptions.map(
                                    (label) => (
                                      <label
                                        key={label.labelName}
                                        className={previewStyles.dropdownItem}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={transaction.tags.includes(
                                            label.labelName,
                                          )}
                                          onChange={() =>
                                            handleTagsChange(
                                              index,
                                              label.labelName,
                                            )
                                          }
                                        />
                                        {label.labelName}
                                      </label>
                                    ),
                                  )}
                                </div>
                              )}
                            </div>
                            {errors[index]?.tags && (
                              <span className={previewStyles.errorMessage}>
                                {errors[index].tags}
                              </span>
                            )}
                          </td>
                        )}
                        <td>
                          <button
                            onClick={() => handleDelete(index)}
                            className={previewStyles.deleteButton}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No data available.</p>
            )}
            <div className={previewStyles.modalButtons}>
              <button
                onClick={handleSave}
                className={previewStyles.saveButton}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Transactions"}
              </button>
              <button
                onClick={handleCancel}
                className={previewStyles.cancelButton}
                disabled={isSaving}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PreviewModal;
