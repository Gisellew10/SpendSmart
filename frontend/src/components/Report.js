import React, { useState, useEffect } from "react";
import reportStyles from "../styles/Reports.module.css";
import DetailedReport from "./DetailedReport";
import ConfirmationModal from "../components/ConfirmationModal";
import {
  addReport,
  generateWeeklyReports,
  generateMonthlyReports,
  getWeeklyReports,
  getMonthlyReports,
  deleteReport as apiDeleteReport,
  getUser,
  fetchBooks,
} from "../api/api.mjs";

const ReportComponent = () => {
  const [userId, setUserId] = useState(null);
  const [reports, setReports] = useState([]);
  const [selected, setSelected] = useState("weekly");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalTitle, setConfirmModalTitle] = useState("");
  const [confirmModalMessage, setConfirmModalMessage] = useState("");
  const [reportIdToDelete, setReportIdToDelete] = useState(null);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const user = await getUser();
        if (!user || !user.user) {
          throw new Error("User not found");
        }
        setUserId(user.user);
      } catch (error) {
        setErrorMessage("Error fetching user ID.");
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
    const fetchReports = async () => {
      if (selectedBook && userId) {
        setIsLoading(true);
        try {
          let response;
          if (selected === "weekly") {
            response = await getWeeklyReports(selectedBook._id);
          } else {
            response = await getMonthlyReports(selectedBook._id);
          }
          setReports(response.reports);
        } catch (error) {
          setErrorMessage("Error fetching reports.");
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchReports();
  }, [selectedBook, selected, userId]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleWeeklyButtonClick = () => {
    setSelected("weekly");
  };

  const handleMonthlyButtonClick = () => {
    setSelected("monthly");
  };

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const handleSelectBook = (book) => {
    setSelectedBook(book);
    setIsDropdownOpen(false);
  };

  const handleReportClick = (report) => {
    setSelectedReport(report);
  };

  const handleAddReport = async () => {
    if (!userId || !selectedBook) {
      setErrorMessage("User ID or Selected Book is missing.");
      return;
    }

    try {
      await addReport(
        selected === "weekly" ? "Weekly" : "Monthly",
        selectedBook._id,
      );
      const response =
        selected === "weekly"
          ? await getWeeklyReports(selectedBook._id)
          : await getMonthlyReports(selectedBook._id);
      setReports(response.reports);
      setSuccessMessage("Report added successfully.");
    } catch (error) {
      setErrorMessage("Failed to add report. Please try again.");
    }
  };

  const handleGenerateWeeklyReport = async () => {
    try {
      await generateWeeklyReports();
      setSuccessMessage("Weekly reports generated successfully.");
      const response = await getWeeklyReports(selectedBook._id);
      setReports(response.reports);
    } catch (error) {
      setErrorMessage("Failed to generate weekly reports. Please try again.");
    }
  };

  const handleGenerateMonthlyReport = async () => {
    try {
      await generateMonthlyReports();
      setSuccessMessage("Monthly reports generated successfully.");
      const response = await getMonthlyReports(selectedBook._id);
      setReports(response.reports);
    } catch (error) {
      setErrorMessage("Failed to generate monthly reports. Please try again.");
    }
  };

  const handleDeleteReport = (reportId) => {
    setReportIdToDelete(reportId);
    setConfirmModalTitle("Confirm Deletion");
    setConfirmModalMessage("Are you sure you want to delete this report?");
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!reportIdToDelete) return;

    try {
      await apiDeleteReport(selectedBook._id, reportIdToDelete);
      setReports((prevReports) =>
        prevReports.filter((report) => report._id !== reportIdToDelete),
      );
      setSuccessMessage("Report deleted successfully.");
    } catch (error) {
      setErrorMessage("Failed to delete report. Please try again.");
    } finally {
      setIsConfirmModalOpen(false);
      setReportIdToDelete(null);
    }
  };

  const cancelDelete = () => {
    setIsConfirmModalOpen(false);
    setReportIdToDelete(null);
  };

  const renderReportList = () => (
    <div className={reportStyles.reportsContent}>
      {errorMessage && (
        <div className={reportStyles.errorMessage}>{errorMessage}</div>
      )}
      {successMessage && (
        <div className={reportStyles.successMessage}>{successMessage}</div>
      )}
      <div className={reportStyles.actionButtons}>
        <button
          className={reportStyles.addReportButton}
          onClick={handleAddReport}
        >
          Add Report
        </button>
        <button
          className={reportStyles.generateButton}
          onClick={handleGenerateWeeklyReport}
        >
          Generate Weekly Reports
        </button>
        <button
          className={reportStyles.generateButton}
          onClick={handleGenerateMonthlyReport}
        >
          Generate Monthly Reports
        </button>
      </div>

      <div className={reportStyles.reportTypeSelection}>
        <div
          className={`${reportStyles.typeButton} ${
            selected === "weekly" ? reportStyles.selectedType : ""
          }`}
          onClick={handleWeeklyButtonClick}
        >
          Weekly
        </div>
        <div
          className={`${reportStyles.typeButton} ${
            selected === "monthly" ? reportStyles.selectedType : ""
          }`}
          onClick={handleMonthlyButtonClick}
        >
          Monthly
        </div>
      </div>

      <div className={reportStyles.reportList}>
        {isLoading ? (
          <p>Loading reports...</p>
        ) : reports.length === 0 ? (
          <h2 className={reportStyles.head}>No reports generated yet.</h2>
        ) : (
          reports.map((report) => (
            <div
              key={`report-${report._id}`}
              className={reportStyles.reportItem}
            >
              <div
                className={reportStyles.reportText}
                onClick={() => handleReportClick(report)}
              >
                {report.reportType} Report of {report.reportMonthName}{" "}
                {report.reportDay}, {report.reportYear}
              </div>
              <button
                className={reportStyles.deleteReportButton}
                onClick={() => handleDeleteReport(report._id)}
                aria-label={`Delete ${report.reportType} Report`}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const handleBack = () => {
    setSelectedReport(null);
  };

  return (
    <div className={reportStyles.pageLayout}>
      <div className={reportStyles.sidebar}></div>
      <div className={reportStyles.dropdown}>
        <button
          className={reportStyles.dropdownButton}
          onClick={toggleDropdown}
          disabled={books.length <= 0}
        >
          {selectedBook ? selectedBook.bookName : "Select Book"}
          <img
            src="/images/down.png"
            alt="Dropdown Icon"
            className={reportStyles.dropdownIcon}
          />
        </button>
        {isDropdownOpen && (
          <div className={reportStyles.dropdownContent}>
            {books.map((book) => (
              <p
                key={book._id}
                onClick={() => handleSelectBook(book)}
                className={reportStyles.dropdownItem}
              >
                {book.bookName}
              </p>
            ))}
          </div>
        )}
      </div>
      <div className={reportStyles.content}>
        <h2 className={reportStyles.pageTitle}>Reports</h2>
        {selectedReport === null ? (
          renderReportList()
        ) : (
          <DetailedReport report={selectedReport} onBack={handleBack} />
        )}
      </div>

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        title={confirmModalTitle}
        message={confirmModalMessage}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
};

export default ReportComponent;
