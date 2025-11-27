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

  const handleClose = () => {
    setShow(false);
    setForm({}); // Clear form on close
    setValidated(false); // Reset validation
  };

  const handleShow = () => setShow(true);

  const handleSubmit = (event) => {
    event.preventDefault();
    const createPostForm = event.currentTarget;

    if (createPostForm.checkValidity() === false) {
      event.stopPropagation();
      setValidated(true);
      return;
    }

    setValidated(true);

    // Check if content is empty
    if (!form.body || !form.body.trim()) {
      setToastMessage("Please enter some content for your post.");
      setToastType("danger");
      setShowToast(true);
      return;
    }

    // ✅ FIXED: Use 'content' field name (backend expects this)
    const data = {
      content: form.body.trim(),  // Backend expects 'content' field
    };

    console.log("📤 Sending data:", data);
    console.log("👤 User:", user);

    axiosService
      .post("/api/post/posts/", data)
      .then((response) => {
        console.log("✅ Post created successfully:", response.data);
        
        // Reset form and close modal
        handleClose();
        setToastMessage("Post created successfully! 🚀");
        setToastType("success");
        setShowToast(true);
        
        // ✅ Enhanced refresh with delay to ensure backend processing
        if (refresh && typeof refresh === 'function') {
          console.log("🔄 Calling refresh function...");
          setTimeout(() => {
            refresh();
            console.log("✅ Posts refreshed");
          }, 500); // Small delay to ensure backend has processed
        } else {
          console.warn("⚠️ Refresh function is not available:", refresh);
        }
      })
      .catch((error) => {
        console.error("❌ Error creating post:", error);
        console.error("❌ Error response:", error.response?.data);
        
        const errorMessage = error.response?.data?.detail || 
                            error.response?.data?.content?.[0] ||
                            error.response?.data?.non_field_errors?.[0] ||
                            JSON.stringify(error.response?.data) || 
                            error.message ||
                            "An error occurred while creating the post.";
        
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
                minLength={1}
                maxLength={500}
              />
              <Form.Control.Feedback type="invalid">
                Please enter some content for your post (1-500 characters).
              </Form.Control.Feedback>
              <Form.Text className="text-muted">
                {form.body ? `${form.body.length}/500 characters` : "0/500 characters"}
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        
        <Modal.Footer className="border-0">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!form.body || form.body.trim() === "" || form.body.length > 500}
          >
            Post
          </Button>
        </Modal.Footer>
      </Modal>
      
      <Toaster
        title="Post Status"
        message={toastMessage}
        showToast={showToast}
        type={toastType}
        onClose={() => setShowToast(false)}
      />
    </>
  );
}

export default CreatePost;