import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import styles from "../styles/expenseTracking.module.css";
import PreviewModal from "../components/PreviewModal";
import CustomLabelsModal from "../components/CustomLabelsModal";
import {
  fetchBooks,
  getCustomLabels,
  addTransaction,
  uploadDocument,
  addCustomLabel,
  deleteCustomLabel,
} from "../api/api.mjs";

const ExpenseTracking = () => {
  const router = useRouter();
  const { bookName } = router.query;

  const [amount, setAmount] = useState("0.00");
  const [vendor, setVendor] = useState("");
  const [date, setDate] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [file, setFile] = useState(null);
  const [selectedTab, setSelectedTab] = useState("Expense");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [customLabels, setCustomLabels] = useState([]);
  const [showCustomLabelsPopup, setShowCustomLabelsPopup] = useState(false);
  const [selectedCustomLabels, setSelectedCustomLabels] = useState([]);
  const [currentPage, setCurrentPage] = useState({ Expense: 1, Income: 1 });
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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
    const fetchAllBooks = async () => {
      try {
        const data = await fetchBooks();
        setBooks(data.books);
        if (bookName) {
          const foundBook = data.books.find(
            (book) => book.bookName === bookName,
          );
          if (foundBook) {
            setSelectedBook(foundBook);
          } else {
            setErrorMessage(
              "Selected book not found. Please select a different book.",
            );
            const defaultBook =
              data.books.find((book) => book.bookName === "Daily Expenses") ||
              data.books[0];
            setSelectedBook(defaultBook);
          }
        } else {
          const dailyExpensesBook = data.books.find(
            (book) => book.bookName === "Daily Expenses",
          );
          if (dailyExpensesBook) {
            setSelectedBook(dailyExpensesBook);
          } else if (data.books.length > 0) {
            setSelectedBook(data.books[0]);
            setErrorMessage(
              'Default "Daily Expenses" book not found. Please create it or select another book.',
            );
          } else {
            setErrorMessage("No books found. Please create a book first.");
          }
        }
      } catch (error) {
        setErrorMessage(`Failed to fetch books: ${error.message}`);
      }
    };

    if (router.isReady) {
      fetchAllBooks();
    }
  }, [router.isReady, bookName]);

  useEffect(() => {
    setSelectedCategory(null);
    setSelectedCustomLabels([]);
    setSuccessMessage("");
    setErrorMessage("");

    const fetchLabels = async () => {
      try {
        const data = await getCustomLabels(selectedTab);
        setCustomLabels(data.customLabels);
      } catch (error) {
        setErrorMessage(`Failed to fetch custom labels: ${error.message}`);
      }
    };

    fetchLabels();
  }, [selectedTab]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const handleSelectBook = (book) => {
    setSelectedBook(book);
    setIsDropdownOpen(false);
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleNumberClick = (num) => {
    setAmount((prev) => (prev === "0.00" ? num.toString() : prev + num));
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleClear = () => {
    setAmount("0.00");
    setSuccessMessage("");
    setErrorMessage("");
  };

  const isCustomLabel = (category) => {
    return customLabels.some((label) => label.labelName === category);
  };

  const handleCategoryClick = (category) => {
    if (isCustomLabel(category)) {
      setSelectedCustomLabels((prev) => {
        if (prev.includes(category)) {
          return prev.filter((label) => label !== category);
        } else {
          return [...prev, category];
        }
      });
    } else {
      setSelectedCategory((prevCategory) =>
        prevCategory === category ? null : category,
      );
    }
  };

  const handleSubmit = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!selectedCategory && selectedCustomLabels.length === 0) {
      setErrorMessage("Please select at least one category before submitting.");
      return;
    }
    if (!selectedCategory) {
      setErrorMessage(
        "Please select at least one default category before submitting.",
      );
      return;
    }
    if (!vendor.trim()) {
      setErrorMessage("Please enter a vendor/source before submitting.");
      return;
    }
    if (!amount || parseFloat(amount) === 0) {
      setErrorMessage("Please enter a valid amount before submitting.");
      return;
    }
    if (!date) {
      setErrorMessage("Please enter a date before submitting.");
      return;
    }
    if (!selectedBook) {
      setErrorMessage("Please select a book before submitting.");
      return;
    }

    let transactionAmount = parseFloat(amount);

    if (selectedTab === "Expense" && transactionAmount > 0) {
      transactionAmount = -transactionAmount;
    }

    const expenseData = {
      amount: transactionAmount,
      vendor,
      dateOfTransaction: date,
      category: selectedCategory,
      customLabels: selectedCustomLabels,
      relatedBookId: selectedBook._id,
    };

    try {
      await addTransaction(expenseData);
      setSuccessMessage("Transaction submitted successfully!");
      setAmount("0.00");
      setVendor("");
      setDate("");
      setSelectedCategory(null);
      setSelectedCustomLabels([]);
    } catch (error) {
      setErrorMessage(`Failed to submit transaction: ${error.message}`);
    }
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      const fileType = selectedFile.type;
      if (fileType.startsWith("image/")) {
        setFile(selectedFile);
        handleUpload(selectedFile);
        setErrorMessage("");
      } else {
        setErrorMessage("Only image files are allowed.");
      }
    }
    event.target.value = null;
  };

  const handleUpload = async (selectedFile) => {
    if (!selectedFile) {
      setErrorMessage("Please select a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("document", selectedFile);

    setLoading(true);
    setShowPreview(true);

    try {
      const data = await uploadDocument(formData);
      if (data && data.finalData) {
        setExtractedData(data.finalData);
        setErrorMessage("");
        setShowPreview(true);
      } else {
        setErrorMessage("No data extracted from the image.");
        setShowPreview(false);
      }
    } catch (error) {
      setShowPreview(false);

      if (error.message.includes("Uploaded image is not a bank statement")) {
        setErrorMessage(
          "The uploaded image is not a bank statement. Please upload a valid bank statement.",
        );
      } else if (error.message.includes("Failed to process OCR")) {
        setErrorMessage(
          "The image could not be processed. Please ensure it is a clear bank statement.",
        );
      } else {
        setErrorMessage(`Failed to upload and extract data: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomLabel = async (labelName) => {
    try {
      const data = await addCustomLabel(labelName, selectedTab);
      setCustomLabels((prev) => [...prev, data.customLabel]);
    } catch (error) {
      setErrorMessage(`Failed to add custom label: ${error.message}`);
    }
  };

  const handleDeleteCustomLabel = async (labelName) => {
    try {
      await deleteCustomLabel(labelName, selectedTab);
      setCustomLabels((prev) =>
        prev.filter((label) => label.labelName !== labelName),
      );
      adjustCurrentPageAfterDeletion(customLabels);
    } catch (error) {
      setErrorMessage(`Failed to delete custom label: ${error.message}`);
    }
  };

  const adjustCurrentPageAfterDeletion = (updatedCustomLabels) => {
    const allCategories =
      selectedTab === "Expense" ? expenseCategories : incomeCategories;
    const customLabelNames = updatedCustomLabels.map(
      (label) => label.labelName,
    );
    const combinedCategories = [...allCategories, ...customLabelNames];
    const categoriesPerPage = 8;
    const totalCategories = combinedCategories.length;
    const totalPages = Math.ceil(totalCategories / categoriesPerPage);

    let currentTabPage = currentPage[selectedTab];

    if (currentTabPage > totalPages) {
      currentTabPage = totalPages;
      setCurrentPage((prev) => ({
        ...prev,
        [selectedTab]: currentTabPage,
      }));
    }

    const startIndex = (currentTabPage - 1) * categoriesPerPage;
    const endIndex = startIndex + categoriesPerPage;
    const displayedCategories = combinedCategories.slice(startIndex, endIndex);

    if (displayedCategories.length === 0 && currentTabPage > 1) {
      setCurrentPage((prev) => ({
        ...prev,
        [selectedTab]: prev[selectedTab] - 1,
      }));
    }
  };

  const inputPlaceholder =
    selectedTab === "Expense"
      ? "Enter the transaction vendor name"
      : "Enter the source of income";

  const allCategories =
    selectedTab === "Expense" ? expenseCategories : incomeCategories;
  const customLabelNames = customLabels.map((label) => label.labelName);
  const combinedCategories = [...allCategories, ...customLabelNames];
  const categoriesPerPage = 8;
  const totalCategories = combinedCategories.length;
  const totalPages = Math.ceil(totalCategories / categoriesPerPage);

  const currentTabPage = currentPage[selectedTab];

  const startIndex = (currentTabPage - 1) * categoriesPerPage;
  const endIndex = startIndex + categoriesPerPage;
  const displayedCategories = combinedCategories.slice(startIndex, endIndex);

  const handleNextPage = () => {
    if (currentTabPage < totalPages)
      setCurrentPage((prev) => ({
        ...prev,
        [selectedTab]: prev[selectedTab] + 1,
      }));
  };

  const handlePreviousPage = () => {
    if (currentTabPage > 1)
      setCurrentPage((prev) => ({
        ...prev,
        [selectedTab]: prev[selectedTab] - 1,
      }));
  };

  return (
    <div className={styles.pageLayout}>
      <div className={styles.dropdown}>
        <button
          className={styles.dropdownButton}
          onClick={toggleDropdown}
          disabled={books.length <= 0}
        >
          {selectedBook ? selectedBook.bookName : "Select Book"}
          <img
            src="/images/down.png"
            alt="Dropdown Icon"
            className={styles.dropdownIcon}
          />
        </button>
        {isDropdownOpen && (
          <div className={styles.dropdownContent}>
            {books.map((book) => (
              <p
                key={book._id}
                onClick={() => handleSelectBook(book)}
                className={styles.dropdownItem}
              >
                {book.bookName}
              </p>
            ))}
          </div>
        )}
      </div>
      <div className={styles.expenseTracking}>
        {successMessage && (
          <div className={styles.successMessage}>{successMessage}</div>
        )}
        {errorMessage && (
          <div className={styles.errorMessage}>{errorMessage}</div>
        )}
        <div className={styles.titleContainer}>
          <div className={styles.titles}>
            <h2
              className={
                selectedTab === "Expense"
                  ? `${styles.title} ${styles.activeTitle}`
                  : styles.title
              }
              onClick={() => setSelectedTab("Expense")}
            >
              Expense
            </h2>
            <h2
              className={
                selectedTab === "Income"
                  ? `${styles.title} ${styles.activeTitle}`
                  : styles.title
              }
              onClick={() => setSelectedTab("Income")}
            >
              Income
            </h2>
          </div>
          <button
            className={styles.customLabelsButton}
            onClick={() => setShowCustomLabelsPopup(true)}
          >
            Custom Labels
          </button>
        </div>
        <div className={styles.innerMainContent}>
          <div className={styles.calculatorContainer}>
            <div className={styles.categoryButtonsContainer}>
              <div className={styles.categoryButtons}>
                {displayedCategories.map((category) => {
                  const isSelected =
                    selectedCustomLabels.includes(category) ||
                    selectedCategory === category;
                  return (
                    <button
                      key={category}
                      className={`${styles.categoryButton} ${
                        isCustomLabel(category) ? styles.customLabelButton : ""
                      } ${isSelected ? styles.selectedCategory : ""}`}
                      onClick={() => handleCategoryClick(category)}
                      title={category}
                      aria-label={category}
                    >
                      {category.length > 8
                        ? `${category.slice(0, 7)}...`
                        : category}
                    </button>
                  );
                })}
              </div>
              {totalPages > 1 && (
                <div className={styles.paginationButtons}>
                  {currentTabPage > 1 && (
                    <button
                      className={styles.paginationButton}
                      onClick={handlePreviousPage}
                    >
                      &#9664;
                    </button>
                  )}
                  {currentTabPage < totalPages && (
                    <button
                      className={styles.paginationButton}
                      onClick={handleNextPage}
                    >
                      &#9654;
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className={styles.expenseInputSection}>
              <input
                type="text"
                placeholder={inputPlaceholder}
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                className={styles.input}
                required
              />
              <div className={styles.amountDisplay}>${amount}</div>
              <label className={styles.receiptButton}>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*"
                  style={{ display: "none" }}
                />
                <img
                  src="/images/camera.svg"
                  alt="Camera Icon"
                  className={styles.icon}
                />
              </label>
            </div>

            <div className={styles.keypad}>
              {[7, 8, 9, 4, 5, 6, 1, 2, 3, ".", 0].map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumberClick(num)}
                  className={styles.keypadButton}
                >
                  {num}
                </button>
              ))}
              <button onClick={handleClear} className={styles.backspaceButton}>
                <img
                  src="/images/backspace.svg"
                  alt="Backspace Icon"
                  className={styles.icon}
                />
              </button>
            </div>
          </div>

          <div className={styles.submitDateContainer}>
            <input
              type="date"
              placeholder="dd/mm/yy"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={styles.dateInput}
              required
            />
            <button className={styles.submitButton} onClick={handleSubmit}>
              Submit
            </button>
          </div>
        </div>

        {showPreview && (
          <PreviewModal
            extractedData={extractedData}
            loading={loading}
            setShowPreview={setShowPreview}
            selectedBook={selectedBook}
          />
        )}

        {showCustomLabelsPopup && (
          <CustomLabelsModal
            customLabels={customLabels}
            onClose={() => setShowCustomLabelsPopup(false)}
            onAddLabel={handleAddCustomLabel}
            onDeleteLabel={handleDeleteCustomLabel}
            type={selectedTab}
          />
        )}
      </div>
    </div>
  );
};

export default ExpenseTracking;
