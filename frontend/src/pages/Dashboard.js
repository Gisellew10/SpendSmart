import React from "react";
import DashboardDonutChart from "../components/DashboardDonutChart";
import styles from "../styles/dashboard.module.css";

const Dashboard = () => {
  return (
    <div className={styles.dashboard}>
      <DashboardDonutChart />
    </div>
  );
};

export default Dashboard;
