import React from "react";
import { deleteBudgeting } from "../api/api.mjs";
import styles from "../styles/Budgeting.module.css";

export function GoalTrackingBar({ goal, refreshBudgetAndGoal }) {
  if (!goal) return null;

  let percent = ((goal.currentAmount / goal.goalAmount) * 100).toFixed(2);
  if (percent < 0) percent = 0;
  else if (percent > 100) percent = 100;
  const goalAmount = goal.goalAmount;

  const handleDelete = async () => {
    try {
      await deleteBudgeting(goal._id, goal.relatedBookId);
      refreshBudgetAndGoal();
    } catch (error) {
      console.error("Error deleting goal:", error);
    }
  };

  return (
    <div className={styles.goalTrackingBar}>
      <div className={styles.progressBarContainer}>
        <div
          className={styles.filledBar}
          style={{ width: `${percent}%` }}
        ></div>
      </div>
      <div className={styles.ofYourSavingsGoalReached}>
        {percent}% of your savings goal reached
      </div>
      <div className={styles.goalAmount}>${goalAmount.toFixed(2)}</div>
      <button className={styles.deleteButton} onClick={handleDelete}>
        Delete Goal
      </button>
    </div>
  );
}

export default GoalTrackingBar;
