import React, { useEffect, useState } from "react";
import { usePage } from "../context/PageContext";
import TransactionEditPopup from "../components/TransactionEditPopup";
import ConfirmationModal from "../components/ConfirmationModal";
import styles from "../styles/BookDetail.module.css";
import {
  getTransactionsByBookId,
  deleteTransaction,
  updateTransaction,
} from "../api/api.mjs";

const BookDetail = () => {
  const { selectedBook, setActivePage } = usePage();
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  const LIMIT = 8;

  useEffect(() => {
    if (selectedBook) {
      setCurrentPage(1);
      fetchTransactions(1);
    }
  }, [selectedBook]);

  useEffect(() => {
    if (selectedBook) {
      fetchTransactions(currentPage);
    }
  }, [currentPage, selectedBook]);

  const fetchTransactions = async (page) => {
    setIsLoading(true);
    setError(null);

    if (!selectedBook || !selectedBook._id) {
      setError("Selected book is invalid. Please try again.");
      setIsLoading(false);
      return;
    }

    try {
      const data = await getTransactionsByBookId(selectedBook._id, page, LIMIT);

      if (
        !data ||
        !Array.isArray(data.transactions) ||
        typeof data.totalPages !== "number"
      ) {
        setError("Received unexpected data from the server.");
        setIsLoading(false);
        return;
      }

      if (page > data.totalPages && data.totalPages > 0) {
        setCurrentPage(data.totalPages);
        return;
      }

      setTransactions(data.transactions);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
    } catch (error) {
      setError(
        error.message ||
          "Failed to load transactions. Check your connection or try again later.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTransaction = (transactionId) => {
    setTransactionToDelete(transactionId);
    setIsConfirmModalOpen(true);
  };

  const confirmDeleteTransaction = async () => {
    if (!transactionToDelete) return;

    try {
      await deleteTransaction(transactionToDelete);

      setIsConfirmModalOpen(false);
      setTransactionToDelete(null);

      fetchTransactions(currentPage);
    } catch (error) {
      setError(
        error.message || "Unable to delete transaction. Please try again.",
      );
      setIsConfirmModalOpen(false);
      setTransactionToDelete(null);
    }
  };

  const cancelDeleteTransaction = () => {
    setIsConfirmModalOpen(false);
    setTransactionToDelete(null);
  };

  const handleEditTransaction = (transaction) => {
    setTransactionToEdit(transaction);
    setIsEditPopupOpen(true);
  };

  const handleUpdateTransaction = async (updatedData) => {
    try {
      const transactionId = transactionToEdit._id;

      const payload = {
        amount:
          transactionToEdit.amount >= 0
            ? Number(updatedData.amount)
            : -Number(updatedData.amount),
        vendor: updatedData.vendor,
        customLabel: updatedData.customLabel,
        dateOfTransaction: updatedData.dateOfTransaction,
      };

      await updateTransaction(transactionId, payload);

      setIsEditPopupOpen(false);
      setTransactionToEdit(null);

      fetchTransactions(currentPage);
    } catch (error) {
      setError(
        error.message || "Unable to update transaction. Please try again.",
      );
    }
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  if (!selectedBook) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.content}>
          <div className={styles.error}>No book selected.</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h2
            className={styles.title}
          >{`${selectedBook.bookName} - Details`}</h2>

          <button
            className={styles.addExpenseButton}
            onClick={() => setActivePage("ExpenseTracking")}
            aria-label="Add Expense"
          >
            <img src="/images/add.png" alt="Add Expense" />
          </button>
        </div>
        {isLoading ? (
          <div className={styles.loading}>Loading transactions...</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : transactions.length === 0 ? (
          <p className={styles.noTransactions}>
            No transactions available for this book. Please add some!
          </p>
        ) : (
          <>
            <div className={styles.transactionList}>
              {transactions.map((transaction) => {
                const isIncome = transaction.amount >= 0;
                const hasTags =
                  transaction.tags &&
                  transaction.tags.length > 0 &&
                  !(
                    transaction.tags.length === 1 &&
                    transaction.tags[0].toLowerCase() === "none"
                  );
                return (
                  <div key={transaction._id} className={styles.transactionCard}>
                    <button
                      className={styles.deleteButton}
                      onClick={() => handleDeleteTransaction(transaction._id)}
                      aria-label="Delete Transaction"
                    >
                      <img src="/images/cancel.png" alt="Delete" />
                    </button>
                    <button
                      className={styles.editButton}
                      onClick={() => handleEditTransaction(transaction)}
                      aria-label="Edit Transaction"
                    >
                      <img src="/images/edit.png" alt="Edit" />
                    </button>
                    <p className={styles.transactionDate}>
                      {new Date(
                        transaction.dateOfTransaction,
                      ).toLocaleDateString()}
                    </p>
                    <p className={styles.transactionType}>
                      {isIncome ? "Income" : "Expense"}
                    </p>
                    <div className={styles.transactionCategoryAndTags}>
                      <span className={styles.transactionCategory}>
                        {transaction.category}
                      </span>
                      {hasTags && (
                        <div className={styles.transactionTags}>
                          {transaction.tags.map((tag, index) => (
                            <span key={index} className={styles.transactionTag}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {transaction.vendor && (
                      <p className={styles.transactionVendor}>
                        Vendor: {transaction.vendor}
                      </p>
                    )}
                    <p className={styles.transactionAmount}>
                      ${Math.abs(transaction.amount).toFixed(2)}
                    </p>
                    <p className={styles.transactionBalance}>
                      Balance: ${transaction.balance.toFixed(2)}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className={styles.pagination}>
              <button
                className={styles.pageButton}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Previous Page"
              >
                Previous
              </button>
              <span className={styles.pageNumber}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                className={styles.pageButton}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Next Page"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      {isEditPopupOpen && (
        <TransactionEditPopup
          transaction={transactionToEdit}
          onClose={() => setIsEditPopupOpen(false)}
          onUpdate={handleUpdateTransaction}
        />
      )}

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        title="Confirm Deletion"
        message="Are you sure you want to delete this transaction?"
        onConfirm={confirmDeleteTransaction}
        onCancel={cancelDeleteTransaction}
      />
    </div>
  );
};

export default BookDetail;
