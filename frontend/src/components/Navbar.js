import React from "react";
import PropTypes from "prop-types";
import styles from "../styles/navbar.module.css";

const Navbar = ({ onNavigate }) => {
  return (
    <header className={styles.navbar}>
      <div className={styles.logoSection}>
        <img
          src="/images/logo.png"
          alt="SpendSmart Logo"
          className={styles.logo}
        />
      </div>
      <nav className={styles.menu}>
        <button
          onClick={() => onNavigate("Home")}
          className={styles.menuButton}
        >
          Home
        </button>
        <button
          onClick={() => onNavigate("Signup")}
          className={styles.menuButton}
        >
          Sign Up
        </button>
        <button
          onClick={() => onNavigate("Signin")}
          className={styles.menuButton}
        >
          Sign In
        </button>
      </nav>
    </header>
  );
};

Navbar.propTypes = {
  onNavigate: PropTypes.func.isRequired,
};

export default Navbar;
