import React, { useState, useEffect } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import {
  fetchBooks,
  getDashboardData,
  getRecommendationsData,
} from "../api/api.mjs";
import styles from "../styles/dashboardDonutChart.module.css";

ChartJS.register(ArcElement, Tooltip, Legend);

const DashboardDonutChart = () => {
  const range = 30;
  const [chartData, setChartData] = useState(null);
  const [noDataMessage, setNoDataMessage] = useState(null);
  const [recommendationsSection, setRecommendationsSection] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isRecommendationsLoading, setIsRecommendationsLoading] =
    useState(false);

  const toggleDropdown = () => setIsDropdownOpen((prev) => !prev);

  const handleSelectBook = (book) => {
    setSelectedBook(book);
    setIsDropdownOpen(false);
    setSuccessMessage(`Selected book: ${book.bookName}`);
    setErrorMessage("");
  };

  useEffect(() => {
    fetchBooks()
      .then((res) => {
        setBooks(res.books);
        const dailyExpensesBook = res.books.find(
          (book) => book.bookName === "Daily Expenses",
        );
        if (dailyExpensesBook) {
          setSelectedBook(dailyExpensesBook);
          setSuccessMessage('"Daily Expenses" book loaded successfully.');
          setErrorMessage("");
        } else if (res.books.length > 0) {
          setSelectedBook(res.books[0]);
          setErrorMessage(
            'Default "Daily Expenses" book not found. Please create it or select another book.',
          );
          setSuccessMessage("");
        } else {
          setErrorMessage("No books found. Please create a book first.");
          setSuccessMessage("");
        }
      })
      .catch((error) => {
        setErrorMessage(`Failed to fetch books: ${error.message}`);
      });
  }, []);

  useEffect(() => {
    if (!selectedBook) return;
    getDashboardData(selectedBook._id, range)
      .then((res) => {
        const data = res.formattedData;

        if (
          !data ||
          !data.expenses ||
          !data.income ||
          (data.expenses.length === 0 && data.income.length === 0)
        ) {
          setNoDataMessage("No transactions for the past 30 days");
          setChartData(null);
          return;
        }

        function generateDonutChartColors(length) {
          const colors = [];
          for (let i = 0; i < length; i++) {
            const hue = (360 / length) * i;
            colors.push(`hsl(${hue}, 70%, 50%)`);
          }
          return colors;
        }

        setChartData({
          expenseChart: {
            labels: data.expenses.labels,
            datasets: [
              {
                data: data.expenses.values,
                backgroundColor: generateDonutChartColors(
                  data.expenses.values.length,
                ),
                borderWidth: 1,
              },
            ],
          },
          incomeChart: {
            labels: data.income.labels,
            datasets: [
              {
                data: data.income.values,
                backgroundColor: generateDonutChartColors(
                  data.income.values.length,
                ),
                borderWidth: 1,
              },
            ],
          },
        });
        setNoDataMessage(null);
      })
      .catch((error) => {
        setErrorMessage(`Failed to fetch dashboard data: ${error.message}`);
        setChartData(null);
        setNoDataMessage(null);
      });

    setIsRecommendationsLoading(true);
    getRecommendationsData(selectedBook._id)
      .then((res) => {
        const data = res.message;

        if (!data || !Array.isArray(data)) {
          setRecommendationsSection(
            <p className={styles.errorRecommendation}>
              Error generating AI insights & recommendations. At least 5
              transactions in the past 30 days are required.
            </p>,
          );
          setIsRecommendationsLoading(false);
          return;
        }

        const recommendationsContent = data.map((pair, index) => {
          const insight = pair.insight;
          const recommendation = pair.recommendation;

          return (
            <div className={styles.dashboardRecommendationCard} key={index}>
              <h4 className={styles.insightTitle}>Insight {index + 1}</h4>
              <p className={styles.insightText}>{insight}</p>
              <h4 className={styles.recommendationTitle}>Recommendation</h4>
              <p className={styles.recommendationText}>{recommendation}</p>
            </div>
          );
        });

        setRecommendationsSection(recommendationsContent);
        setIsRecommendationsLoading(false);
      })
      .catch((error) => {
        setRecommendationsSection(
          <p className={styles.errorRecommendation}>
            Failed to fetch recommendations: {error.message}
          </p>,
        );
        setIsRecommendationsLoading(false);
      });
  }, [selectedBook]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        enabled: true,
      },
      legend: {
        display: true,
        position: "bottom",
        labels: {
          font: {
            size: "1rem",
          },
        },
      },
    },
    cutout: "50%",
  };

  return (
    <div className={styles.pageLayout}>
      <div
        className={`${styles.dropdown} ${isDropdownOpen ? styles.dropdownActive : ""}`}
      >
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
      <div className={styles.dashboardDonutContainer}>
        {errorMessage && (
          <div className={styles.errorMessage}>{errorMessage}</div>
        )}
        {successMessage && (
          <div className={styles.successMessage}>{successMessage}</div>
        )}
        {noDataMessage ? (
          <h1 className={styles.noDataMessage}>{noDataMessage}</h1>
        ) : !chartData ? (
          <div className={styles.loading}>Loading...</div>
        ) : (
          <div className={styles.chartsContainer}>
            <div className={styles.dashboardDonutChartContainer}>
              <h3 className={styles.chartTitle}>Expenses in Past 30 Days</h3>
              {chartData.expenseChart.labels.length > 0 ? (
                <Doughnut data={chartData.expenseChart} options={options} />
              ) : (
                <h1 className={styles.noChartData}>
                  No expenses for the past 30 days
                </h1>
              )}
            </div>
            <div className={styles.dashboardDonutChartContainer}>
              <h3 className={styles.chartTitle}>Income in Past 30 Days</h3>
              {chartData.incomeChart.labels.length > 0 ? (
                <Doughnut data={chartData.incomeChart} options={options} />
              ) : (
                <h1 className={styles.noChartData}>
                  No income for the past 30 days
                </h1>
              )}
            </div>
          </div>
        )}
        <div className={styles.dashboardRecommendationsContainer}>
          <h3 className={styles.recommendationsHeader}>
            AI Insights & Recommendations For Past 30 Days
          </h3>
          {isRecommendationsLoading && (
            <div className={styles.recommendationsLoading}>
              Generating recommendations...
            </div>
          )}
          {!isRecommendationsLoading && recommendationsSection}
        </div>
      </div>
    </div>
  );
};

export default DashboardDonutChart;
