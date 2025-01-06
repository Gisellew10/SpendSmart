import React, { useEffect, useState } from "react";
import ConfirmationModal from "../components/ConfirmationModal";
import styles from "../styles/myBooksPage.module.css";
import { usePage } from "../context/PageContext";
import { fetchBooks, addBook, deleteBook } from "../api/api.mjs";

const MyBooksPage = () => {
  const { setActivePage, setSelectedBook } = usePage();
  const [books, setBooks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBookName, setNewBookName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalTitle, setConfirmModalTitle] = useState("");
  const [confirmModalMessage, setConfirmModalMessage] = useState("");
  const [bookIdToDelete, setBookIdToDelete] = useState(null);

  const booksPerPage = 6;

  useEffect(() => {
    fetchAllBooks();
  }, []);

  const fetchAllBooks = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const data = await fetchBooks();
      setBooks(data.books);
    } catch (error) {
      setErrorMessage("Failed to fetch books. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBook = async () => {
    if (!newBookName.trim()) {
      setErrorMessage("Book name cannot be empty.");
      return;
    }

    try {
      const data = await addBook(newBookName.trim());
      setBooks((prevBooks) => [...prevBooks, data.book]);
      setShowAddModal(false);
      setNewBookName("");
      setErrorMessage("");
      setSuccessMessage(`Book "${data.book.bookName}" added successfully!`);
    } catch (error) {
      if (error.message.includes("Book name already exists")) {
        setErrorMessage("Book name already exists.");
      } else {
        setErrorMessage("Failed to create book. Please try again.");
      }
    }
  };

  const handleDelete = (bookId, bookName) => {
    setBookIdToDelete(bookId);
    setConfirmModalTitle("Confirm Deletion");
    setConfirmModalMessage(
      `Are you sure you want to delete the book "${bookName}"?`,
    );
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!bookIdToDelete) return;

    setBooks((prevBooks) =>
      prevBooks.map((book) =>
        book._id === bookIdToDelete ? { ...book, isDeleting: true } : book,
      ),
    );

    try {
      await deleteBook(bookIdToDelete);
      setBooks((prevBooks) =>
        prevBooks.filter((book) => book._id !== bookIdToDelete),
      );
      setSuccessMessage("Book deleted successfully.");
    } catch (error) {
      setErrorMessage("Failed to delete book. Please try again.");
      setBooks((prevBooks) =>
        prevBooks.map((book) =>
          book._id === bookIdToDelete ? { ...book, isDeleting: false } : book,
        ),
      );
    } finally {
      setIsConfirmModalOpen(false);
      setBookIdToDelete(null);
    }
  };

  const cancelDelete = () => {
    setIsConfirmModalOpen(false);
    setBookIdToDelete(null);
  };

  const handleSelectBook = (book) => {
    setSelectedBook(book);
    setActivePage("BookDetail");
  };

  const indexOfLastBook = currentPage * booksPerPage;
  const indexOfFirstBook = indexOfLastBook - booksPerPage;
  const currentBooks = books.slice(indexOfFirstBook, indexOfLastBook);
  const totalPages = Math.ceil(books.length / booksPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.sidebar}></div>
      <div className={styles.content}>
        <div className={styles.header}>
          <h2 className={styles.pageTitle}>My Books</h2>
          <button
            className={styles.addBookButton}
            onClick={() => {
              setShowAddModal(true);
              setErrorMessage("");
              setSuccessMessage("");
            }}
            aria-label="Add Book"
          >
            <img src="/images/add.png" alt="Add Book" />
          </button>
        </div>

        <div className={styles.messageContainer}>
          {successMessage && (
            <div className={styles.successMessage}>{successMessage}</div>
          )}
          {errorMessage && (
            <div className={styles.errorMessage}>{errorMessage}</div>
          )}
        </div>

        {isLoading ? (
          <div className={styles.loading}>Loading books...</div>
        ) : books.length === 0 ? (
          <div className={styles.emptyState}>
            No books available. Click the add button to create one.
          </div>
        ) : (
          <>
            <div className={styles.booksGrid}>
              {currentBooks.map((book) => (
                <div
                  key={book._id}
                  className={`${styles.bookCard} ${book.isDeleting ? styles.fadeOut : ""}`}
                  onClick={() => handleSelectBook(book)}
                  style={{ cursor: "pointer" }}
                >
                  <img
                    src="/images/book-cover.png"
                    alt={`${book.bookName} cover`}
                    className={styles.bookImage}
                  />
                  <p className={styles.bookTitle}>{book.bookName}</p>
                  {book.bookName !== "Daily Expenses" && (
                    <button
                      className={styles.deleteButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(book._id, book.bookName);
                      }}
                      aria-label={`Delete ${book.bookName}`}
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </div>
            {books.length > booksPerPage && (
              <div className={styles.pagination}>
                <button
                  className={styles.pageButton}
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  aria-label="Previous Page"
                >
                  Previous
                </button>
                <span className={styles.pageInfo}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className={styles.pageButton}
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  aria-label="Next Page"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {showAddModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <h3 className={styles.modalTitle}>New Book Name</h3>
              <input
                type="text"
                value={newBookName}
                onChange={(e) => setNewBookName(e.target.value)}
                className={styles.modalInput}
                placeholder="Enter book name"
              />
              {errorMessage && (
                <p className={styles.errorMessage}>{errorMessage}</p>
              )}
              <div className={styles.modalButtons}>
                <button
                  className={styles.submitButton}
                  onClick={handleAddBook}
                  aria-label="Submit"
                >
                  Submit
                </button>
                <button
                  className={styles.cancelButton}
                  onClick={() => {
                    setShowAddModal(false);
                    setNewBookName("");
                    setErrorMessage("");
                    setSuccessMessage("");
                  }}
                  aria-label="Cancel"
                >
                  <img
                    src="/images/cancel.png"
                    alt="Cancel"
                    className={styles.cancelIcon}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        <ConfirmationModal
          isOpen={isConfirmModalOpen}
          title={confirmModalTitle}
          message={confirmModalMessage}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      </div>
    </div>
  );
};

export default MyBooksPage;
