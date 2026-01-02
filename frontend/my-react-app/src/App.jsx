import React from "react";
import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import Home from "./pages/Home";
import Registration from "./pages/Registration";
import Login from "./pages/LoginForm"; // 
import Profile from "./pages/Profile";

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      
      <Route path="/login/" element={<Login />} />
      <Route path="/profile/:userId/" element={<Profile />} />
      <Route path="/register/" element={<Registration />} />
    </Routes>
  );
}

export default App;