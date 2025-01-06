import React from "react";
import Image from "next/image";
import styles from "../styles/home.module.css";
import image from "../media/home.jpg";

const Home = () => {
  return (
    <div className={styles.home}>
      <Image src={image} alt="Home page image" fill />
    </div>
  );
};

export default Home;
