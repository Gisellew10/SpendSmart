import React, { useState } from "react";
import styles from "../styles/Budgeting.module.css";

export function AddBudgetingForm(props) {
  const { relatedBookId, userId, addBudgeting, handleAddButtonClick } = props;

  const [budgetingType, setBudgetingType] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [refreshTime, setRefreshTime] = useState("Never");

  const handleSubmit = (e) => {
    e.preventDefault();
    addBudgeting(budgetingType, goalAmount, refreshTime, relatedBookId).then(
      () => {
        e.target.reset();
        handleAddButtonClick();
      },
    );
  };

  return (
    <form className={styles.budgetingForm} onSubmit={handleSubmit}>
      <div className={styles.type}>Type</div>
      <select
        className={styles.budgetingTypeSelect}
        name="type"
        required
        defaultValue=""
        onChange={(e) => setBudgetingType(e.target.value)}
      >
        <option value="" disabled>
          Select budgeting type
        </option>
        <option value="Goal">Goal</option>
        <option value="Budget">Budget</option>
      </select>
      <div className={styles.amount}>Amount</div>
      <input
        className={styles.amountInput}
        type="number"
        placeholder="Enter the amount"
        name="content"
        required
        min="0"
        step="0.01"
        onChange={(e) => setGoalAmount(e.target.value)}
      ></input>
      <div className={styles.refreshtime}>Refresh Time</div>
      <select
        className={styles.refreshTimeSelect}
        name="refresh"
        required
        defaultValue=""
        onChange={(e) => setRefreshTime(e.target.value)}
      >
        <option value="" disabled>
          Select refreshment time
        </option>
        <option value="Yearly">Yearly</option>
        <option value="Monthly">Monthly</option>
        <option value="Never">Never</option>
      </select>
      <button className={styles.submitButton} type="submit">
        Submit the budget/goal
      </button>
    </form>
  );
}

export default AddBudgetingForm;
