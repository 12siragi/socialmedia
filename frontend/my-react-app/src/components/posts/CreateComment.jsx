// src/components/posts/CreateComment.jsx
import React, { useState } from "react";
import { Button, Form, InputGroup, Image } from "react-bootstrap";
import { randomAvatar } from "../utils";
import axiosService from "../helpers/axios";
import useUserActions from "../../hooks/user.actions";

function CreateComment({ post, refresh }) {
  const userActions = useUserActions();
  const user = userActions.getUser();
  
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!content.trim()) return;
    
    setLoading(true);

    // ✅ FIXED: Remove post field - backend will get it from URL
    const data = {
      content: content.trim(),
    };

    try {
      // ✅ FIXED: Use nested route endpoint
      const response = await axiosService.post(`/api/post/${post.id}/comment/`, data);
      console.log("✅ Comment created successfully:", response.data);
      setContent("");
      refresh();
    } catch (error) {
      console.error("❌ Error creating comment:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="border-top pt-3 mt-3">
      <Form onSubmit={handleSubmit}>
        <InputGroup>
          <Image
            src={user.avatar || randomAvatar()}
            roundedCircle
            width={32}
            height={32}
            className="me-2"
          />
          <Form.Control
            type="text"
            placeholder="Write a comment..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={500}
            className="rounded-pill"
          />
          <Button
            variant="primary"
            type="submit"
            disabled={!content.trim() || loading}
            className="rounded-pill ms-2"
          >
            {loading ? "..." : "Post"}
          </Button>
        </InputGroup>
      </Form>
    </div>
  );
}

export default CreateComment;