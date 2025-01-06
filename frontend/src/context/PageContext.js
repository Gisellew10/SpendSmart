import React, { createContext, useContext, useState } from "react";

const PageContext = createContext({
  activePage: "Home",
  setActivePage: () => {},
  selectedBook: null,
  setSelectedBook: () => {},
});

export const PageProvider = ({ children }) => {
  const [activePage, setActivePage] = useState("Home");
  const [selectedBook, setSelectedBook] = useState(null);

  return (
    <PageContext.Provider
      value={{ activePage, setActivePage, selectedBook, setSelectedBook }}
    >
      {children}
    </PageContext.Provider>
  );
};

export const usePage = () => useContext(PageContext);
