import React from "react";
import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";

import Home from "./pages/Home";
import Registration from "./pages/Registration";
import Login from "./pages/LoginForm";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";

console.log("VITE_API_URL:", import.meta.env.VITE_API_URL);

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
      <Route path="/register/" element={<Registration />} />

      <Route
        path="/profile/:userId/"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile/:profileId/edit/"
        element={
          <ProtectedRoute>
            <EditProfile />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
