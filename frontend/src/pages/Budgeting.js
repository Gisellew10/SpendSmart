import React, { useState, useEffect } from "react";
import styles from "../styles/Budgeting.module.css";
import { AddBudgetingForm } from "../components/AddBugetingForm.js";
import { BudgetingBars } from "../components/Budgeting.js";
import {
  getBudget,
  getGoal,
  addBudgeting,
  getUser,
  fetchBooks,
} from "../api/api.mjs";

const Budgeting = () => {
  const [userId, setUserId] = useState(null);
  const [budget, setBudget] = useState(null);
  const [goal, setGoal] = useState(null);
  const [showAddBudgetingForm, setAddBudgetingForm] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const user = await getUser();
        if (!user || !user.user) {
          throw new Error("User not found");
        }
        setUserId(user.user);
      } catch (error) {
        setErrorMessage("Failed to fetch user information.");
      }
    };
    fetchUserId();
  }, []);

  useEffect(() => {
    const fetchAllBooks = async () => {
      try {
        const data = await fetchBooks();
        setBooks(data.books);
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
      } catch (error) {
        setErrorMessage(`Failed to fetch books: ${error.message}`);
      }
    };
    fetchAllBooks();
  }, []);

  useEffect(() => {
    if (selectedBook != null) {
      getBudget(selectedBook._id)
        .then((response) => setBudget(response.budget))
        .catch((error) => {
          setErrorMessage("Failed to fetch budget information.");
        });
      getGoal(selectedBook._id)
        .then((response) => setGoal(response.goal))
        .catch((error) => {
          setErrorMessage("Failed to fetch goal information.");
        });
    }
  }, [selectedBook]);

  const refreshBudgetAndGoal = () => {
    if (selectedBook) {
      getBudget(selectedBook._id)
        .then((response) => {
          if (response.budget) {
            setBudget(response.budget);
          } else {
            setBudget(null);
          }
        })
        .catch((error) => {
          setErrorMessage("Failed to refresh budget information.");
        });
      getGoal(selectedBook._id)
        .then((response) => {
          if (response.goal) {
            setGoal(response.goal);
          } else {
            setGoal(null);
          }
        })
        .catch((error) => {
          setErrorMessage("Failed to refresh goal information.");
        });
    }
  };

  const handleAddButtonClick = () => {
    setAddBudgetingForm(!showAddBudgetingForm);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const handleSelectBook = (book) => {
    setSelectedBook(book);
    setIsDropdownOpen(false);
    setSuccessMessage(`Selected book: ${book.bookName}`);
    setErrorMessage("");
  };

  const handleAddBudgeting = async (
    budgetingType,
    goalAmount,
    refreshTime,
    relatedBookId,
    userId,
  ) => {
    try {
      await addBudgeting(budgetingType, goalAmount, refreshTime, relatedBookId);
      refreshBudgetAndGoal();
      setSuccessMessage("Budgeting added successfully.");
      setErrorMessage("");
    } catch (error) {
      setErrorMessage("Failed to add budgeting.");
      setSuccessMessage("");
    }
  };

  return (
    <div className={styles.pageLayout}>
      <div className={styles.sidebar}></div>
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
      <div className={styles.budgetingContent}>
        {successMessage && (
          <div className={styles.successMessage}>{successMessage}</div>
        )}
        {errorMessage && (
          <div className={styles.errorMessage}>{errorMessage}</div>
        )}
        <button
          className={styles.addBudgetButton}
          onClick={handleAddButtonClick}
        >
          {showAddBudgetingForm ? "Back" : "Set a budget/goal"}
        </button>
        {showAddBudgetingForm && (
          <AddBudgetingForm
            relatedBookId={selectedBook?._id}
            userId={userId}
            addBudgeting={handleAddBudgeting}
            handleAddButtonClick={handleAddButtonClick}
          />
        )}
        {!showAddBudgetingForm && (
          <BudgetingBars
            budget={budget}
            goal={goal}
            refreshBudgetAndGoal={refreshBudgetAndGoal}
          />
        )}
      </div>
    </div>
  );
};

export default Budgeting;
