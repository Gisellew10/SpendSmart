import React from "react";
import PropTypes from "prop-types";
import { BudgetCheckingBar } from "./BudgetCheckingBar";
import { GoalTrackingBar } from "./GoalTrackingBar";
import styles from "../styles/Budgeting.module.css";

export function BudgetingBars({ budget, goal, refreshBudgetAndGoal }) {
  return (
    <div className={styles.budgetingBars}>
      <div className={styles.budgettracking}>Budget Tracking</div>
      <div className={styles.budgetBar}>
        {!budget ? (
          <h2 className={styles.budgetHead}>
            No budgets added yet, try setting the budget.
          </h2>
        ) : (
          <BudgetCheckingBar
            budget={budget}
            refreshBudgetAndGoal={refreshBudgetAndGoal}
          />
        )}
      </div>
      <div className={styles.goaltracking}>Goal Tracking</div>
      <div className={styles.goalBar}>
        {!goal ? (
          <h2 className={styles.goalHead}>
            No goals added yet, try setting the goal.
          </h2>
        ) : (
          <GoalTrackingBar
            goal={goal}
            refreshBudgetAndGoal={refreshBudgetAndGoal}
          />
        )}
      </div>
    </div>
  );
}

BudgetingBars.propTypes = {
  budget: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    relatedBookId: PropTypes.string.isRequired,
    currentAmount: PropTypes.number.isRequired,
    goalAmount: PropTypes.number.isRequired,
  }),
  goal: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    relatedBookId: PropTypes.string.isRequired,
    currentAmount: PropTypes.number.isRequired,
    goalAmount: PropTypes.number.isRequired,
  }),
  refreshBudgetAndGoal: PropTypes.func.isRequired,
};

export default BudgetingBars;
