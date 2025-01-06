import React, { useState } from "react";
import { signin } from "../api/api.mjs";
import styles from "../styles/signin.module.css";
import { usePage } from "../context/PageContext";
import SigninGoogleButton from "../components/SigninGoogleButton";

const Signin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { setActivePage } = usePage();
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await signin(email, password);
      e.target.reset();
      setSuccessMessage(res.message);
      setErrorMessage("");
      if (res.message === "Login successful.") {
        setActivePage("Dashboard");
      }
    } catch (error) {
      setErrorMessage("An error occurred during login. Please try again.");
      setSuccessMessage("");
    }
  };

  return (
    <div className={styles.signin}>
      <form className={styles.signInForm} onSubmit={handleSubmit}>
        {successMessage && (
          <div className={styles.successMessage}>{successMessage}</div>
        )}
        {errorMessage && (
          <div className={styles.errorMessage}>{errorMessage}</div>
        )}
        <div className={styles.formTitle}>Sign In</div>
        <input
          type="email"
          className={styles.formElement}
          placeholder="Enter your e-mail address"
          required
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className={styles.formElement}
          placeholder="Enter your password"
          required
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className={styles.btn}>
          Sign in
        </button>
        <SigninGoogleButton />
      </form>
    </div>
  );
};

export default Signin;
