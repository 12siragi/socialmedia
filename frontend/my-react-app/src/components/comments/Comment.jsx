// src/components/comments/Comment.jsx
import React, { useState } from "react";
import { Card, Dropdown, Button, Form, Modal, Image } from "react-bootstrap";
import { LikeOutlined } from "@ant-design/icons";
import { format } from "timeago.js";
import axiosService from "../helpers/axios";
import useUserActions from "../../hooks/user.actions";

function Comment({ comment, refresh }) {
  const { getUser } = useUserActions();
  const user = getUser();

  // 🔐 Normalize author (object OR string)
  const author =
    typeof comment.author === "object"
      ? comment.author
      : { email: comment.author };

  // 🔐 Ownership check (SAFE)
  const isAuthor = user?.email && author?.email && user.email === author.email;

  // 🔹 State
  const [liked, setLiked] = useState(!!comment.liked);
  const [likesCount, setLikesCount] = useState(comment.likes_count ?? 0);
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(comment.content || "");
  const [showDelete, setShowDelete] = useState(false);

  // ❤️ LIKE / UNLIKE
  const handleLike = async () => {
    try {
      const res = await axiosService.post(
        `/api/comment/post/${comment.post?.id}/comment/${comment.id}/like/`
      );
      setLiked(res.data.liked);
      setLikesCount(res.data.likes_count);
    } catch (err) {
      console.error("Like error", err);
    }
  };

  // ✏️ UPDATE
  const handleUpdate = async () => {
    if (!content.trim()) return;

    try {
      await axiosService.put(
        `/api/comment/post/${comment.post?.id}/comment/${comment.id}/`,
        { content }
      );
      setIsEditing(false);
      refresh();
    } catch (err) {
      console.error("Update error", err);
    }
  };

  // 🗑 DELETE
  const handleDelete = async () => {
    try {
      await axiosService.delete(
        `/api/comment/post/${comment.post?.id}/comment/${comment.id}/`
      );
      setShowDelete(false);
      refresh();
    } catch (err) {
      console.error("Delete error", err);
    }
  };

  return (
    <>
      <Card className="border-0 mb-2">
        <Card.Body className="p-2">
          <div className="d-flex align-items-start">
            {/* 🧠 Avatar fallback */}
            <Image
              src={author?.avatar || "/default-avatar.png"}
              roundedCircle
              width={32}
              height={32}
              className="me-2"
              onError={(e) => {
                e.target.src = "/default-avatar.png";
              }}
            />

            <div className="flex-grow-1 bg-light rounded p-2">
              <div className="d-flex justify-content-between">
                <strong>{author?.username || author?.email || "User"}</strong>

                {isAuthor && (
                  <Dropdown align="end">
                    <Dropdown.Toggle
                      variant="light"
                      size="sm"
                      className="border-0 p-0"
                    >
                      ⋮
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                      <Dropdown.Item onClick={() => setIsEditing(true)}>
                        Edit
                      </Dropdown.Item>
                      <Dropdown.Item
                        className="text-danger"
                        onClick={() => setShowDelete(true)}
                      >
                        Delete
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                )}
              </div>

              {!isEditing ? (
                <p className="mb-1">{comment.content}</p>
              ) : (
                <>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                  <div className="mt-1">
                    <Button size="sm" onClick={handleUpdate}>
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="ms-2"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              )}

              <div className="d-flex align-items-center text-muted mt-1">
                <LikeOutlined
                  onClick={handleLike}
                  style={{
                    color: liked ? "#0D6EFD" : "#6c757d",
                    cursor: "pointer",
                  }}
                />
                <small className="ms-1">{likesCount}</small>
                <small className="ms-3">
                  {comment.created_at ? format(comment.created_at) : ""}
                </small>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* 🗑 DELETE CONFIRMATION */}
      <Modal show={showDelete} onHide={() => setShowDelete(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Comment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this comment?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDelete(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default Comment;
