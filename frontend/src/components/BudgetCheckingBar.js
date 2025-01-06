import React, { useState } from "react";
import PropTypes from "prop-types";
import { deleteBudgeting } from "../api/api.mjs";
import styles from "../styles/Budgeting.module.css";

export function BudgetCheckingBar({ budget, refreshBudgetAndGoal }) {
  const [errorMessage, setErrorMessage] = useState("");

  if (!budget) return null;

  const percent = Math.min(
    ((budget.currentAmount / budget.goalAmount) * 100).toFixed(2),
    100,
  );

  const handleDelete = async () => {
    try {
      await deleteBudgeting(budget._id, budget.relatedBookId);
      refreshBudgetAndGoal();
      setErrorMessage("");
    } catch (error) {
      setErrorMessage("Failed to delete budget. Please try again.");
    }
  };

  return (
    <div className={styles.budgetCheckingBar}>
      <div className={styles.progressBarContainer}>
        <div
          className={styles.filledBar}
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        ></div>
      </div>
      <div className={styles.ofyourbudgetspent}>
        {percent}% of your budget spent
      </div>
      <div className={styles.budgetAmount}>${budget.goalAmount.toFixed(2)}</div>
      <button
        className={styles.deleteButton}
        onClick={handleDelete}
        aria-label="Delete budget"
      >
        Delete Budget
      </button>
      {errorMessage && (
        <div className={styles.errorMessage}>{errorMessage}</div>
      )}
    </div>
  );
}

BudgetCheckingBar.propTypes = {
  budget: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    relatedBookId: PropTypes.string.isRequired,
    currentAmount: PropTypes.number.isRequired,
    goalAmount: PropTypes.number.isRequired,
  }).isRequired,
  refreshBudgetAndGoal: PropTypes.func.isRequired,
};

export default BudgetCheckingBar;
