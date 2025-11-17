// src/components/posts/CreatePost.jsx
import React, { useState } from "react";
import { Button, Modal, Form } from "react-bootstrap";
import axiosService from "../../components/helpers/axios";
import useUserActions from "../../hooks/user.actions"; // ✅ default import
import Toaster from "../Toaster";


function CreatePost({ refresh }) {
  const userActions = useUserActions();
  const user = userActions.getUser();
  
  const [show, setShow] = useState(false);
  const [validated, setValidated] = useState(false);
  const [form, setForm] = useState({ body: "" });
  const [toast, setToast] = useState({
    show: false,
    title: "",
    message: "",
    type: "success"
  });

  const handleClose = () => {
    setShow(false);
    setForm({ body: "" });
    setValidated(false);
  };

  const handleShow = () => setShow(true);

  const showToast = (title, message, type = "success") => {
    setToast({
      show: true,
      title,
      message,
      type
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const createPostForm = event.currentTarget;
    
    if (createPostForm.checkValidity() === false) {
      event.stopPropagation();
      setValidated(true);
      return;
    }
    
    setValidated(true);
    
    // ✅ Check if user exists before making request
    if (!user || !user.id) {
      showToast("Error!", "You must be logged in to create a post", "danger");
      return;
    }
    
    const data = {
      body: form.body,  // ✅ Remove author field - let backend handle this
    };
    
    console.log("Creating post with data:", data); // ✅ Debug log
    console.log("User:", user); // ✅ Debug log
    
    axiosService
      .post("/api/post/posts/", data)
      .then((response) => {
        console.log("Post created successfully:", response.data); // ✅ Debug log
        showToast("Success!", "Post created successfully!", "success");
        handleClose();
        if (refresh) refresh();
      })
      .catch((error) => {
        console.log("Full error:", error.response); // ✅ Better error logging
        showToast("Error!", `Failed to create post: ${error.response?.data?.detail || error.message}`, "danger");
      });
  };

  // ✅ Don't render if user is not authenticated
  if (!user) {
    return null;
  }

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
        
        <Modal.Footer className="border-0">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            variant="primary"
            onClick={handleSubmit}
            disabled={!form.body || form.body.trim() === ""}
          >
            Post
          </Button>
        </Modal.Footer>
      </Modal>

      {toast.show && (
        <div 
          className={`alert alert-${toast.type === 'success' ? 'success' : 'danger'} position-fixed`}
          style={{ top: '20px', right: '20px', zIndex: 9999 }}
        >
          <strong>{toast.title}</strong> {toast.message}
          <button 
            type="button" 
            className="btn-close ms-2" 
            onClick={() => setToast({ ...toast, show: false })}
            aria-label="Close"
          ></button>
        </div>
      )}
    </>
  );
}

export default CreatePost;