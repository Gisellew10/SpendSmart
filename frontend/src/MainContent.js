import React, { useState, useEffect } from "react";
import { usePage } from "./context/PageContext";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import SigninPage from "./pages/Signin";
import SignupPage from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import ExpenseTrackingPage from "./pages/ExpenseTracking";
import MyBooks from "./pages/MyBooks";
import ReportsPage from "./pages/Reports";
import Budgeting from "./pages/Budgeting";
import BookDetail from "./pages/BookDetail";
import styles from "./styles/mainContent.module.css";
import { getUser, signout } from "./api/api.mjs";

function MainContent() {
  const { activePage, setActivePage } = usePage();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const noSidebarPages = ["Home", "Signin", "Signup"];

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getUser();
        if (res.user) {
          setActivePage("Dashboard");
        } else {
          setActivePage("Home");
        }
      } catch (error) {
        setErrorMessage("An error occurred while verifying your session.");
      }
    };

    fetchUser();
  }, [setActivePage]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    handleResize();

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isSidebarOpen && window.innerWidth <= 768) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleLogout = async () => {
    try {
      const res = await signout();
      if (res.message === "Failed to logout.") {
        setErrorMessage(res.message);
        return;
      }
      setActivePage("Home");
      setIsSidebarOpen(false);
    } catch (error) {
      setErrorMessage("An unexpected error occurred during logout.");
    }
  };

  const renderPage = () => {
    switch (activePage) {
      case "Home":
        return <Home />;
      case "Signin":
        return <SigninPage />;
      case "Signup":
        return <SignupPage />;
      case "Dashboard":
        return <Dashboard />;
      case "ExpenseTracking":
        return <ExpenseTrackingPage />;
      case "MyBooks":
        return <MyBooks />;
      case "Reports":
        return <ReportsPage />;
      case "Budgeting":
        return <Budgeting />;
      case "BookDetail":
        return <BookDetail />;
      default:
        return <Home />;
    }
  };

  return (
    <div className={styles.mainContentContainer}>
      {!noSidebarPages.includes(activePage) && (
        <>
          <button
            className={styles.toggleButton}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label="Toggle Sidebar"
          >
            &#9776;
          </button>
          <Sidebar
            onLogout={handleLogout}
            isOpen={isSidebarOpen}
            toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          />
        </>
      )}

      {noSidebarPages.includes(activePage) && (
        <Navbar onNavigate={setActivePage} />
      )}

      <main className={styles.mainContent}>
        {errorMessage && (
          <div className={styles.errorMessage} role="alert">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className={styles.successMessage} role="status">
            {successMessage}
          </div>
        )}
        {renderPage()}
      </main>
    </div>
  );
}

export default MainContent;
