// src/components/posts/CreatePost.jsx
import React, { useState } from "react";
import { Button, Modal, Form, Image } from "react-bootstrap";
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { getUser } = useUserActions();
  const user = getUser();

  const handleShow = () => setShow(true);
  const handleClose = () => {
    setShow(false);
    setValidated(false);
    setForm({ body: "" });
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
    setIsSubmitting(true);

    const data = {
      content: form.body,
    };

    try {
      const response = await axiosService.post("/api/post/posts/", data);
      console.log("✅ Post created:", response.data);

      setToastMessage("Post created successfully! 🚀");
      setToastType("success");
      setForm({ body: "" });
      setShow(false);
      setShowToast(true);

      refresh();
    } catch (error) {
      console.error("❌ Failed to create post:", error.response?.data);
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.content?.[0] ||
        "Failed to create post. Please try again.";

      setToastMessage(errorMessage);
      setToastType("danger");
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const characterLimit = 500;
  const charactersRemaining = characterLimit - form.body.length;

  return (
    <>
      {/* Trigger Card */}
      <div 
        className="rounded-3 p-3 mb-4"
        style={{
          backgroundColor: '#1a1d2e',
          border: '1px solid #2d3348'
        }}
      >
        <div className="d-flex align-items-center gap-3">
          {/* User Avatar */}
          <Image
            src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.first_name}+${user?.last_name}&background=8b5cf6&color=fff`}
            roundedCircle
            width={48}
            height={48}
            style={{
              border: '2px solid #8b5cf6',
              objectFit: 'cover'
            }}
          />
          
          {/* Fake Input */}
          <div 
            className="flex-grow-1 py-2 px-3 rounded-pill"
            onClick={handleShow}
            style={{
              backgroundColor: '#1e2235',
              border: '1px solid #2d3348',
              color: '#8e8e93',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = '#8b5cf6';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = '#2d3348';
            }}
          >
            What's on your mind, {user?.first_name || 'there'}?
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="d-flex justify-content-around mt-3 pt-3" style={{ borderTop: '1px solid #2d3348' }}>
          <button
            className="btn d-flex align-items-center gap-2"
            onClick={handleShow}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#e5e7eb',
              padding: '0.5rem 1rem'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#2d3348';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16" style={{ color: '#8b5cf6' }}>
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
              <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
            </svg>
            <span className="d-none d-sm-inline">Create Post</span>
          </button>
        </div>
      </div>

      {/* Create Post Modal */}
      <Modal 
        show={show} 
        onHide={handleClose} 
        centered
        contentClassName="border-0"
      >
        <div style={{ backgroundColor: '#1a1d2e', borderRadius: '8px' }}>
          <Modal.Header 
            closeButton 
            className="border-0"
            style={{ borderBottom: '1px solid #2d3348' }}
          >
            <Modal.Title className="text-white">Create Post</Modal.Title>
          </Modal.Header>

          <Modal.Body style={{ backgroundColor: '#1a1d2e' }}>
            {/* User Info */}
            <div className="d-flex align-items-center mb-3">
              <Image
                src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.first_name}+${user?.last_name}&background=8b5cf6&color=fff`}
                roundedCircle
                width={40}
                height={40}
                style={{
                  border: '2px solid #8b5cf6',
                  objectFit: 'cover'
                }}
              />
              <div className="ms-2">
                <p className="mb-0 text-white fw-semibold">
                  {user?.first_name} {user?.last_name}
                </p>
                <small style={{ color: '#8e8e93' }}>Public</small>
              </div>
            </div>

            <Form noValidate validated={validated} onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Control
                  as="textarea"
                  rows={5}
                  name="body"
                  placeholder="What's on your mind?"
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  maxLength={characterLimit}
                  required
                  style={{
                    backgroundColor: '#1e2235',
                    border: '1px solid #2d3348',
                    color: '#fff',
                    borderRadius: '8px',
                    resize: 'none'
                  }}
                />
                <div className="d-flex justify-content-between mt-2">
                  <Form.Control.Feedback type="invalid" className="d-block">
                    Please enter some content for your post.
                  </Form.Control.Feedback>
                  <small 
                    style={{ 
                      color: charactersRemaining < 50 ? '#ef4444' : '#8e8e93' 
                    }}
                  >
                    {charactersRemaining} characters remaining
                  </small>
                </div>
              </Form.Group>
            </Form>
          </Modal.Body>

          <Modal.Footer 
            style={{ 
              backgroundColor: '#1a1d2e',
              borderTop: '1px solid #2d3348' 
            }}
          >
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={!form.body.trim() || isSubmitting}
              className="w-100 py-2 fw-semibold"
              style={{
                backgroundColor: '#8b5cf6',
                border: 'none',
                borderRadius: '6px'
              }}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Posting...
                </>
              ) : (
                'Post'
              )}
            </Button>
          </Modal.Footer>
        </div>
      </Modal>

      {/* Toast notifications */}
      <Toaster
        title="Post"
        message={toastMessage}
        showToast={showToast}
        type={toastType}
        onClose={() => setShowToast(false)}
      />

      <style>{`
        .btn-close {
          filter: invert(1);
        }

        textarea:focus {
          background-color: #1e2235 !important;
          border-color: #8b5cf6 !important;
          color: #fff !important;
          box-shadow: 0 0 0 0.2rem rgba(139, 92, 246, 0.25) !important;
        }

        textarea::placeholder {
          color: #8e8e93 !important;
        }
      `}</style>
    </>
  );
}

export default CreatePost;