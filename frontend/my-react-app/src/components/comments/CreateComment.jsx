import React, { useState } from "react";
import { Button, Form, InputGroup, Image } from "react-bootstrap";
import axiosService from "../helpers/axios";
import useUserActions from "../../hooks/user.actions";

function CreateComment({ post, refresh }) {
  const userActions = useUserActions();
  const user = userActions.getUser();

  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      // ✅ Correct nested endpoint
      await axiosService.post(
        `/api/comment/post/${post.id}/comment/`,
        { content }
      );

      setContent(""); // clear input
      refresh(); // reload comments
    } catch (err) {
      console.error(
        "❌ Failed to create comment",
        err.response?.data || err
      );
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Form onSubmit={handleSubmit} className="mb-3">
      <InputGroup>
        <Image
          src={user.avatar}
          roundedCircle
          width={32}
          height={32}
          className="me-2"
        />
        <Form.Control
          placeholder="Write a comment..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="rounded-pill"
        />
        <Button
          type="submit"
          disabled={!content.trim() || loading}
          className="rounded-pill ms-2"
        >
          Comment
        </Button>
      </InputGroup>
    </Form>
  );
}

export default CreateComment;
