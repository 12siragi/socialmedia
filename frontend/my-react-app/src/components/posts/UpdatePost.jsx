// src/components/posts/UpdatePost.jsx
import React, { useState } from "react";
import { Button, Modal, Form, Dropdown } from "react-bootstrap";
import axiosService from "../helpers/axios";  // ✅ Fixed: Correct import path
import Toaster from "../Toaster";

function UpdatePost(props) {
  const { post, refresh } = props;
  const [show, setShow] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [validated, setValidated] = useState(false);
  const [form, setForm] = useState({
    // ✅ Fixed: Use 'content' field to match backend
    content: post.content || post.body || "",  // Handle both field names
  });

  const handleClose = () => {
    setShow(false);
    setValidated(false);
  };
  
  const handleShow = () => setShow(true);

  const handleSubmit = (event) => {
    event.preventDefault();
    const updatePostForm = event.currentTarget;

    if (updatePostForm.checkValidity() === false) {
      event.stopPropagation();
      setValidated(true);
      return;
    }

    setValidated(true);

    // ✅ Fixed: Use 'content' field and correct endpoint
    const data = {
      content: form.content.trim(),  // Backend expects 'content'
    };

    console.log("📤 Updating post with data:", data);

    axiosService
      .put(`/api/post/posts/${post.id}/`, data)  // ✅ Fixed: Correct endpoint
      .then((response) => {
        console.log("✅ Post updated successfully:", response.data);
        handleClose();
        setToastMessage("Post updated successfully! 🚀");
        setToastType("success");
        setShowToast(true);
        
        // ✅ Enhanced refresh with delay
        if (refresh && typeof refresh === 'function') {
          setTimeout(() => {
            refresh();
          }, 500);
        }
      })
      .catch((error) => {
        console.error("❌ Error updating post:", error);
        console.error("❌ Error response:", error.response?.data);
        
        const errorMessage = error.response?.data?.detail || 
                            error.response?.data?.content?.[0] ||
                            error.message ||
                            "Failed to update post.";
        
        setToastMessage(`Error: ${errorMessage}`);
        setToastType("danger");
        setShowToast(true);
      });
  };

  return (
    <>
      <Dropdown.Item onClick={handleShow}>Modify</Dropdown.Item>

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton className="border-0">
          <Modal.Title>Update Post</Modal.Title>
        </Modal.Header>
        <Modal.Body className="border-0">
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Control
                name="content"
                value={form.content || ""}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
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
                {form.content ? `${form.content.length}/500 characters` : "0/500 characters"}
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
            disabled={!form.content || form.content.trim() === "" || form.content.length > 500}
          >
            Update Post
          </Button>
        </Modal.Footer>
      </Modal>
      
      <Toaster
        title="Post Update"
        message={toastMessage}
        type={toastType}
        showToast={showToast}
        onClose={() => setShowToast(false)}
      />
    </>
  );
}

export default UpdatePost;