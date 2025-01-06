import React from "react";
import { signinGoogle } from "../api/api.mjs";
import styles from "../styles/signin.module.css";

const SigninGoogleButton = () => {
  return (
    <button className={styles.googleBtn} onClick={signinGoogle}>
      Login with Google
    </button>
  );
};

export default SigninGoogleButton;
