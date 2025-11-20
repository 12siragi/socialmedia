// src/components/posts/CreatePost.jsx
import React, { useState } from "react";
import { Button, Modal, Form } from "react-bootstrap";
import axiosService from "../helpers/axios";
import useUserActions from "../../hooks/user.actions";
import Toaster from "../Toaster";

function CreatePost(props) {
  const { refresh } = props;
  const [show, setShow] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("");
  const [validated, setValidated] = useState(false);
  const [form, setForm] = useState({});

  // ✅ Fixed: Use useUserActions hook properly
  const userActions = useUserActions();
  const user = userActions.getUser();

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleSubmit = (event) => {
    event.preventDefault();
    const createPostForm = event.currentTarget;

    if (createPostForm.checkValidity() === false) {
      event.stopPropagation();
    }

    setValidated(true);

    // ✅ FIXED: Use 'content' field name (not 'body') and remove manual author
    const data = {
      content: form.body,  // Backend expects 'content' field
    };

    console.log("Sending data:", data);
    console.log("User:", user);

    axiosService
      .post("/api/post/posts/", data)
      .then((response) => {
        console.log("✅ Success:", response.data);
        handleClose();
        setToastMessage("Post created 🚀");
        setToastType("success");
        setForm({});
        setShowToast(true);
        refresh();
      })
      .catch((error) => {
        console.error("❌ Error:", error.response?.data);
        const errorMessage = error.response?.data?.detail || 
                            error.response?.data?.content?.[0] ||
                            JSON.stringify(error.response?.data) || 
                            "An error occurred.";
        setToastMessage(`Error: ${errorMessage}`);
        setToastType("danger");
        setShowToast(true);
      });
  };

  return (
    <>
      <Form.Group className="my-3 w-75">
        <Form.Control
          className="py-2 rounded-pill border-primary text-primary"
          type="text"
          placeholder="Write a post"
          onClick={handleShow}
          readOnly
        />
      </Form.Group>

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton className="border-0">
          <Modal.Title>Create Post</Modal.Title>
        </Modal.Header>
        <Modal.Body className="border-0">
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Control
                name="body"
                value={form.body || ""}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                as="textarea"
                rows={3}
                placeholder="What's on your mind?"
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
            disabled={!form.body || form.body.trim() === ""}
          >
            Post
          </Button>
        </Modal.Footer>
      </Modal>
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