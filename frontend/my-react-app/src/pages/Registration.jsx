// src/pages/Registration.jsx
import React from "react";
import { Link } from "react-router-dom";
import RegistrationForm from "../components/forms/RegistrationForm";

function Registration() {
  return (
    <div className="container">
      <div className="row">
        {/* Intro / description section */}
        <div className="col-md-6 d-flex align-items-center">
          <div className="content text-center px-4">
            <h1 className="text-primary">Welcome to Postman!</h1>
            <p className="content">
              This is a new social media site that allows you to share your thoughts and experiences with your friends.
              Register now and start enjoying! <br />
              Already have an account? <Link to="/login/">Login</Link>.
            </p>
          </div>
        </div>

        {/* Registration form section */}
        <div className="col-md-6 p-5">
          <RegistrationForm />
        </div>
      </div>
    </div>
  );
}

export default Registration;
