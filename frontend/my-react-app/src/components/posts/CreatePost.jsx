// src/components/posts/CreatePost.jsx
import React, { useState } from "react";
import { Button, Modal, Form } from "react-bootstrap";
import axiosService from "../helpers/axios";
import useUserActions from "../../hooks/user.actions";
import Toaster from "../Toaster";

function CreatePost({ refresh }) {
  const [show, setShow] = useState(false);
  const [validated, setValidated] = useState(false);
  const [form, setForm] = useState({ body: "" });

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  // ✅ Get logged-in user
  const { getUser } = useUserActions();
  const user = getUser();

  const handleShow = () => setShow(true);
  const handleClose = () => {
    setShow(false);
    setValidated(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;

    if (formElement.checkValidity() === false) {
      event.stopPropagation();
      setValidated(true);
      return;
    }

    setValidated(true);

    const data = {
      content: form.body, // backend expects 'content'
    };

    try {
      const response = await axiosService.post("/api/post/posts/", data);
      console.log("✅ Post created:", response.data);

      setToastMessage("Post created 🚀");
      setToastType("success");
      setForm({ body: "" });
      setShow(false);
      setShowToast(true);

      refresh(); // Refresh posts on home page
    } catch (error) {
      console.error("❌ Failed to create post:", error.response?.data);
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.content?.[0] ||
        JSON.stringify(error.response?.data) ||
        "An error occurred.";

      setToastMessage(`Error: ${errorMessage}`);
      setToastType("danger");
      setShowToast(true);
    }
  };

  return (
    <>
      {/* Trigger input (fake input) */}
      <Form.Group className="my-3 w-75">
        <Form.Control
          className="py-2 rounded-pill border-primary text-primary"
          type="text"
          placeholder="Write a post"
          onClick={handleShow}
          readOnly
        />
      </Form.Group>

      {/* Create Post Modal */}
      <Modal show={show} onHide={handleClose} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title>Create Post</Modal.Title>
        </Modal.Header>
        <Modal.Body className="border-0">
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Control
                as="textarea"
                rows={3}
                name="body"
                placeholder="What's on your mind?"
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                required
              />
              <Form.Control.Feedback type="invalid">
                Please enter some content for your post.
              </Form.Control.Feedback>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!form.body.trim()}
          >
            Post
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Toast notifications */}
      <Toaster
        title="Post!"
        message={toastMessage}
        showToast={showToast}
        type={toastType}
        onClose={() => setShowToast(false)}
      />
    </>
  );
}

export default CreatePost;
