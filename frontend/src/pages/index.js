import React from "react";
import { PageProvider } from "../context/PageContext";
import MainContent from "../MainContent";

function App() {
  return (
    <PageProvider>
      <MainContent />
    </PageProvider>
  );
}

export default App;
