import React, { useState, useEffect } from "react";
import { signup } from "../api/api.mjs";
import styles from "../styles/signup.module.css";
import { usePage } from "../context/PageContext";
import SigninGoogleButton from "../components/SigninGoogleButton";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [duplicatePassword, setDuplicatePassword] = useState("");
  const [age, setAge] = useState("");
  const { setActivePage } = usePage();
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== duplicatePassword || password === "") {
      setErrorMessage("Passwords do not match");
      return;
    }

    signup(name, email, password, age)
      .then((res) => {
        e.target.reset();
        if (res.message !== "User created successfully.") {
          setErrorMessage(res.message);
        } else {
          setSuccessMessage(res.message);
          setActivePage("Signin");
        }
      })
      .catch(() => {
        setErrorMessage("An error occurred during signup. Please try again.");
      });
  };

  return (
    <div className={styles.signup}>
      <form className={styles.signUpForm} onSubmit={handleSubmit}>
        {errorMessage && (
          <div className={styles.errorMessage}>{errorMessage}</div>
        )}
        {successMessage && (
          <div className={styles.successMessage}>{successMessage}</div>
        )}
        <h2 className={styles.formTitle}>Create an Account</h2>
        <input
          type="text"
          className={styles.formElement}
          placeholder="Enter your full name"
          required
          onChange={(e) => setName(e.target.value)}
        />
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
        <input
          type="password"
          className={styles.formElement}
          placeholder="Confirm your password"
          required
          onChange={(e) => setDuplicatePassword(e.target.value)}
        />
        <input
          type="number"
          className={styles.formElement}
          placeholder="Enter your age"
          required
          onChange={(e) => setAge(e.target.value)}
        />
        <button type="submit" className={styles.btn}>
          Create Account
        </button>
        <SigninGoogleButton />
      </form>
    </div>
  );
};

export default Signup;
