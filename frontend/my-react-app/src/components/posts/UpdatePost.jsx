import React, { useState } from "react";
import { Button, Modal, Form, Dropdown } from "react-bootstrap";
import axiosService from "../helpers/axios";
import Toaster from "../Toaster";

function UpdatePost({ post, refresh }) {
  const [show, setShow] = useState(false);
  const [validated, setValidated] = useState(false);
  const [content, setContent] = useState(post.content);
  const [toast, setToast] = useState({ show: false, msg: "", type: "success" });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!content.trim()) {
      setValidated(true);
      return;
    }

    axiosService
      .put(`/api/post/posts/${post.id}/`, { content })
      .then(() => {
        setShow(false);
        setToast({ show: true, msg: "Post updated ✅", type: "success" });
        refresh();
      })
      .catch(() => {
        setToast({ show: true, msg: "Update failed ❌", type: "danger" });
      });
  };

  return (
    <>
      <Dropdown.Item onClick={() => setShow(true)}>
        Edit
      </Dropdown.Item>

      <Modal show={show} onHide={() => setShow(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Post</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Form.Control
              as="textarea"
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Update
          </Button>
        </Modal.Footer>
      </Modal>

      <Toaster
        title="Post"
        message={toast.msg}
        type={toast.type}
        showToast={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </>
  );
}

export default UpdatePost;
