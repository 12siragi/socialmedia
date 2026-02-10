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
      <div className="container my-3 my-md-5 px-2 px-md-3">{children}</div>
    </Context.Provider>
  );
}

export default Layout;
