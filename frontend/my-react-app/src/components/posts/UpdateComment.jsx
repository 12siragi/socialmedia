// src/components/posts/UpdateComment.jsx
import React, { useState } from "react";
import { Button, Modal, Form, Dropdown } from "react-bootstrap";
import axiosService from "../helpers/axios";

function UpdateComment({ comment, refresh }) {
  const [show, setShow] = useState(false);
  const [validated, setValidated] = useState(false);
  const [form, setForm] = useState({
    content: comment.content || "",
  });
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setShow(false);
    setValidated(false);
  };

  const handleShow = () => setShow(true);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const updateForm = event.currentTarget;

    if (updateForm.checkValidity() === false) {
      event.stopPropagation();
      setValidated(true);
      return;
    }

    setValidated(true);
    setLoading(true);

    const data = {
      content: form.content.trim(),
    };

    try {
      // ✅ FIXED: Use nested route endpoint
      const response = await axiosService.put(
        `/api/post/${comment.post}/comment/${comment.id}/`,
        data
      );
      console.log("✅ Comment updated successfully:", response.data);
      handleClose();
      refresh();
    } catch (error) {
      console.error("❌ Error updating comment:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dropdown.Item onClick={handleShow}>Edit</Dropdown.Item>

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Comment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Control
                name="content"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                as="textarea"
                rows={3}
                placeholder="Edit your comment..."
                required
                maxLength={500}
              />
              <Form.Control.Feedback type="invalid">
                Please enter a comment.
              </Form.Control.Feedback>
              <Form.Text className="text-muted">
                {form.content ? `${form.content.length}/500 characters` : "0/500 characters"}
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!form.content.trim() || loading}
          >
            {loading ? "Updating..." : "Update Comment"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default UpdateComment;