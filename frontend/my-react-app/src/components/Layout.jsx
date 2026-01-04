import React, { createContext, useState } from "react";
import Navigationbar from "./Navbar";

// Create the context
export const Context = createContext();

function Layout({ children }) {
  const [toaster, setToaster] = useState({
    show: false,
    type: "",
    message: "",
    title: "",
  });

  return (
    <Context.Provider value={{ toaster, setToaster }}>
      <Navigationbar />
      <div className="container m-5">{children}</div>
    </Context.Provider>
  );
}

export default Layout;
