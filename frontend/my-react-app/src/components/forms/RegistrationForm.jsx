// src/components/forms/RegistrationForm.jsx
import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";
import useUserActions from "../../hooks/user.actions";

function RegistrationForm() {
  const userActions = useUserActions();
  const [validated, setValidated] = useState(false);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password1: "",
    password2: ""
  });

  const [error, setError] = useState(null);

  const handleSubmit = (event) => {
    event.preventDefault();

    const formElement = event.currentTarget;

    if (formElement.checkValidity() === false) {
      event.stopPropagation();
      setValidated(true);
      return;
    }

    if (form.password1 !== form.password2) {
      setError("Passwords do not match");
      return;
    }

    setValidated(true);
    setError(null);

    const formData = form; // Could also be: const formData = { ...form };
    userActions.register(formData)
      .catch((err) => {
        const apiError = err.response?.data;
        setError(
          apiError?.detail ||
          apiError?.email ||
          "Registration failed"
        );
      });
  };

  return (
    <Form
      className="border p-4 rounded"
      noValidate
      validated={validated}
      onSubmit={handleSubmit}
    >
      {/* First Name */}
      <Form.Group className="mb-3">
        <Form.Label>First Name</Form.Label>
        <Form.Control
          type="text"
          placeholder="Enter first name"
          value={form.first_name}
          onChange={(e) => setForm({ ...form, first_name: e.target.value })}
          required
        />
        <Form.Control.Feedback type="invalid">
          This field is required.
        </Form.Control.Feedback>
      </Form.Group>

      {/* Last Name */}
      <Form.Group className="mb-3">
        <Form.Label>Last Name</Form.Label>
        <Form.Control
          type="text"
          placeholder="Enter last name"
          value={form.last_name}
          onChange={(e) => setForm({ ...form, last_name: e.target.value })}
          required
        />
        <Form.Control.Feedback type="invalid">
          This field is required.
        </Form.Control.Feedback>
      </Form.Group>

      {/* Email */}
      <Form.Group className="mb-3">
        <Form.Label>Email Address</Form.Label>
        <Form.Control
          type="email"
          placeholder="Enter email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <Form.Control.Feedback type="invalid">
          Please provide a valid email.
        </Form.Control.Feedback>
      </Form.Group>

      {/* Password */}
      <Form.Group className="mb-3">
        <Form.Label>Password</Form.Label>
        <Form.Control
          type="password"
          placeholder="Password"
          minLength={8}
          value={form.password1}
          onChange={(e) => setForm({ ...form, password1: e.target.value })}
          required
        />
        <Form.Control.Feedback type="invalid">
          Password must be at least 8 characters.
        </Form.Control.Feedback>
      </Form.Group>

      {/* Confirm Password */}
      <Form.Group className="mb-3">
        <Form.Label>Confirm Password</Form.Label>
        <Form.Control
          type="password"
          placeholder="Confirm Password"
          minLength={8}
          value={form.password2}
          onChange={(e) => setForm({ ...form, password2: e.target.value })}
          required
        />
        <Form.Control.Feedback type="invalid">
          Please confirm your password.
        </Form.Control.Feedback>
      </Form.Group>

      {/* API Error */}
      {error && <div className="text-danger mb-3">{error}</div>}

      {/* Submit */}
      <Button variant="primary" type="submit">
        Register
      </Button>
    </Form>
  );
}

export default RegistrationForm;
