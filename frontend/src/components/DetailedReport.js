import React, { useState, useEffect } from "react";
import reportStyles from "../styles/Reports.module.css";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const DetailedReport = ({ report, onBack }) => {
  const [chartData, setChartData] = useState({
    expenseChart: { labels: [], datasets: [] },
    incomeChart: { labels: [], datasets: [] },
  });

  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [loadingIncome, setLoadingIncome] = useState(true);

  useEffect(() => {
    const generateChartData = () => {
      if (report.formattedData) {
        const { income, expenses } = report.formattedData;

        const generateDonutChartColors = (length) => {
          const colors = [];
          const saturation = 70;
          const lightness = 50;

          for (let i = 0; i < length; i++) {
            const hue = (360 / length) * i;
            colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
          }
          return colors;
        };

        const newChartData = {
          expenseChart: expenses
            ? {
                labels: expenses.labels,
                datasets: [
                  {
                    data: expenses.values,
                    backgroundColor: generateDonutChartColors(
                      expenses.labels.length,
                    ),
                    borderWidth: 1,
                  },
                ],
              }
            : { labels: [], datasets: [] },
          incomeChart: income
            ? {
                labels: income.labels,
                datasets: [
                  {
                    data: income.values,
                    backgroundColor: generateDonutChartColors(
                      income.labels.length,
                    ),
                    borderWidth: 1,
                  },
                ],
              }
            : { labels: [], datasets: [] },
        };

        setChartData(newChartData);
        setLoadingExpenses(false);
        setLoadingIncome(false);
      }
    };

    const timer = setTimeout(generateChartData, 1000);

    return () => clearTimeout(timer);
  }, [report]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: { enabled: true },
      legend: {
        display: true,
        position: "bottom",
        labels: {
          color: "#000000",
          font: { family: "Poppins, sans-serif", size: 10 },
          boxWidth: 10,
          padding: 5,
        },
      },
    },
    layout: { padding: 10 },
  };

  return (
    <div className={reportStyles.detailedReport}>
      <button onClick={onBack} className={reportStyles.backButton}>
        Back
      </button>

      <div className={reportStyles.summary}>
        <h3>Report Summary</h3>
        <div>
          <strong>Username:</strong> {report.username}
        </div>
        <div>
          <strong>Book Name:</strong> {report.bookName}
        </div>
        <div>
          <strong>Report Type:</strong> {report.reportType}
        </div>
        <div>
          <strong>Total Income:</strong> {report.totalIncome}
        </div>
        <div>
          <strong>Total Expense:</strong> {report.totalExpense}
        </div>
        <div>
          <strong>Total Balance:</strong> {report.totalBalance}
        </div>
        <div>
          <strong>Number of Succeeded Budgets:</strong>{" "}
          {report.numberOfSucceededBudgets}
        </div>
        <div>
          <strong>Number of Succeeded Goals:</strong>{" "}
          {report.numberOfSucceededGoals}
        </div>
        <div>
          <strong>Number of Failed Budgets:</strong>{" "}
          {report.numberOfFailedBudgets}
        </div>
        <div>
          <strong>Number of Failed Goals:</strong> {report.numberOfFailedGoals}
        </div>
        <div>
          <strong>Report Year:</strong> {report.reportYear}
        </div>
        <div>
          <strong>Report Month:</strong> {report.reportMonth}
        </div>
        <div>
          <strong>Report Day:</strong> {report.reportDay}
        </div>
      </div>

      <div className={reportStyles.graphs}>
        <div
          className={`${reportStyles.graphContainer} ${
            loadingExpenses ? reportStyles.graphContainerLoading : ""
          }`}
        >
          <h3>Expenses</h3>
          {loadingExpenses ? (
            <p className={reportStyles.loadingMessage}>
              Generating expenses graph...
            </p>
          ) : chartData.expenseChart.labels.length > 0 ? (
            <div className={reportStyles.chart}>
              <Doughnut data={chartData.expenseChart} options={options} />
            </div>
          ) : (
            <p>
              {report.reportType === "Weekly"
                ? "No expenses for the past 7 days"
                : report.reportType === "Monthly"
                  ? "No expenses for the past 30 days"
                  : "No expenses available"}
            </p>
          )}
        </div>

        <div
          className={`${reportStyles.graphContainer} ${
            loadingIncome ? reportStyles.graphContainerLoading : ""
          }`}
        >
          <h3>Income</h3>
          {loadingIncome ? (
            <p className={reportStyles.loadingMessage}>
              Generating income graph...
            </p>
          ) : chartData.incomeChart.labels.length > 0 ? (
            <div className={reportStyles.chart}>
              <Doughnut data={chartData.incomeChart} options={options} />
            </div>
          ) : (
            <p>
              {report.reportType === "Weekly"
                ? "No income for the past 7 days"
                : report.reportType === "Monthly"
                  ? "No income for the past 30 days"
                  : "No income available"}
            </p>
          )}
        </div>
      </div>

      <div className={reportStyles.budgetings}>
        <div className={reportStyles.budgetingSection}>
          <h3>Completed Budgetings</h3>
          {report.completedBudgetings.length > 0 ? (
            report.completedBudgetings.map((budgeting, index) => (
              <div key={index} className={reportStyles.budgetingItem}>
                <div>
                  <strong>Type:</strong> {budgeting.budgetingType},
                  <strong> Current Amount:</strong> {budgeting.currentAmount},
                  <strong> Goal Amount:</strong> {budgeting.goalAmount},
                  <strong> Refresh Time:</strong> {budgeting.refreshTime}
                </div>
              </div>
            ))
          ) : (
            <p>No completed budgetings.</p>
          )}
        </div>

        <div className={reportStyles.budgetingSection}>
          <h3>Failed Budgetings</h3>
          {report.failedBudgetings.length > 0 ? (
            report.failedBudgetings.map((budgeting, index) => (
              <div key={index} className={reportStyles.budgetingItem}>
                <div>
                  <strong>Type:</strong> {budgeting.budgetingType},
                  <strong> Current Amount:</strong> {budgeting.currentAmount},
                  <strong> Goal Amount:</strong> {budgeting.goalAmount},
                  <strong> Refresh Time:</strong> {budgeting.refreshTime}
                </div>
              </div>
            ))
          ) : (
            <p>No failed budgetings.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailedReport;
