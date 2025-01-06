import React from "react";
import { usePage } from "../context/PageContext";
import styles from "../styles/sidebar.module.css";
import PropTypes from "prop-types";

const Sidebar = ({ onLogout, isOpen, toggleSidebar }) => {
  const { activePage, setActivePage } = usePage();

  const menuItems = [
    { name: "Dashboard", label: "Dashboard" },
    { name: "ExpenseTracking", label: "Expense Tracking" },
    { name: "MyBooks", label: "My Books" },
    { name: "Reports", label: "Reports" },
    { name: "Budgeting", label: "Budgeting" },
  ];

  return (
    <aside className={`${styles.sidebar} ${!isOpen && styles.closed}`}>
      <button
        className={styles.closeButton}
        onClick={toggleSidebar}
        aria-label="Close Sidebar"
      >
        &times;
      </button>
      <div className={styles.logoSection}>
        <img
          src="/images/logo.png"
          alt="SpendSmart Logo"
          className={styles.logo}
        />
      </div>
      <nav className={styles.menu}>
        {menuItems.map((item) => (
          <button
            key={item.name}
            onClick={() => {
              setActivePage(item.name);
              if (window.innerWidth <= 768) {
                toggleSidebar();
              }
            }}
            className={`${styles.menuButton} ${
              activePage === item.name ? styles.active : ""
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <button
        className={styles.logoutButton}
        onClick={() => {
          onLogout();
          toggleSidebar();
        }}
      >
        Logout
      </button>
    </aside>
  );
};

Sidebar.propTypes = {
  onLogout: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
  toggleSidebar: PropTypes.func.isRequired,
};

export default Sidebar;
