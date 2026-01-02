import React, { useState } from "react";
import { format } from "timeago.js";
import { LikeOutlined, CommentOutlined } from "@ant-design/icons";
import { Image, Card, Dropdown, Modal, Button } from "react-bootstrap";
import axiosService from "../helpers/axios";
import UpdatePost from "./UpdatePost";
import CreateComment from "../comments/CreateComment";
import Comment from "../comments/Comment";

function Post({ post, refresh, user }) {
  const [liked, setLiked] = useState(post.liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [showDelete, setShowDelete] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);

  const isAuthor =
    user?.email === post.author?.email || user?.email === post.author?.email;

  const handleLikeClick = async () => {
    try {
      await axiosService.post(`/api/post/posts/${post.id}/like/`);
      setLiked(!liked);
      setLikesCount(liked ? likesCount - 1 : likesCount + 1);
      refresh();
    } catch (err) {
      console.error("❌ Failed to like post", err);
    }
  };

  const handleDelete = async () => {
    try {
      await axiosService.delete(`/api/post/posts/${post.id}/`);
      setShowDelete(false);
      refresh();
    } catch (err) {
      console.error("❌ Failed to delete post", err);
    }
  };

  const toggleComments = async () => {
    if (showComments) {
      setShowComments(false);
      return;
    }

    if (comments.length === 0) {
      setLoadingComments(true);
      try {
        const res = await axiosService.get(
          `/api/comment/post/${post.id}/comment/`
        );
        setComments(res.data);
      } catch (err) {
        console.error("❌ Failed to load comments", err);
      } finally {
        setLoadingComments(false);
      }
    }

    setShowComments(true);
  };

  const refreshComments = async () => {
    try {
      const res = await axiosService.get(
        `/api/comment/post/${post.id}/comment/`
      );
      setComments(res.data);
    } catch (err) {
      console.error("❌ Failed to refresh comments", err);
    }
  };

  return (
    <>
      <Card className="rounded-3 my-4">
        <Card.Body>
          <Card.Title className="d-flex justify-content-between align-items-start">
            <div className="d-flex">
              {/* ✅ Author Avatar */}
              <Image
                src={post.author?.avatar || "/default-avatar.png"}
                roundedCircle
                width={48}
                height={48}
                className="me-2 border border-primary"
              />
              <div>
                {/* ✅ Author Name */}
                <p className="m-0">
                  {post.author?.full_name || post.author?.email || "Unknown"}
                </p>
                <small className="text-muted">{format(post.created_at)}</small>
              </div>
            </div>

            <Dropdown align="end">
              <Dropdown.Toggle variant="light" size="sm" className="border-0 p-0">
                ⋮
              </Dropdown.Toggle>

              <Dropdown.Menu>
                {isAuthor ? (
                  <>
                    <UpdatePost post={post} refresh={refresh} />
                    <Dropdown.Item
                      className="text-danger"
                      onClick={() => setShowDelete(true)}
                    >
                      Delete
                    </Dropdown.Item>
                  </>
                ) : (
                  <Dropdown.Item disabled>No actions</Dropdown.Item>
                )}
              </Dropdown.Menu>
            </Dropdown>
          </Card.Title>

          <Card.Text>{post.content}</Card.Text>

          {/* Optional Post Image */}
          {post.image && (
            <Image
              src={post.image}
              alt="Post Image"
              fluid
              className="mt-2 rounded"
            />
          )}
        </Card.Body>

        <Card.Footer className="bg-white border-0">
          <div className="d-flex justify-content-between">
            <div className="d-flex align-items-center">
              <LikeOutlined
                onClick={handleLikeClick}
                style={{
                  fontSize: 20,
                  color: liked ? "#0D6EFD" : "#C4C4C4",
                  cursor: "pointer",
                }}
              />
              <small className="ms-2">{likesCount} likes</small>
            </div>

            <div
              className="d-flex align-items-center"
              style={{ cursor: "pointer" }}
              onClick={toggleComments}
            >
              <CommentOutlined style={{ fontSize: 20 }} />
              <small className="ms-2">Comment</small>
            </div>
          </div>

          {showComments && (
            <div className="mt-3">
              <CreateComment post={post} refresh={refreshComments} />

              {loadingComments ? (
                <small className="text-muted">Loading comments...</small>
              ) : comments.length === 0 ? (
                <small className="text-muted">No comments yet</small>
              ) : (
                comments.map((comment) => (
                  <Comment
                    key={comment.id}
                    comment={comment}
                    refresh={refreshComments}
                  />
                ))
              )}
            </div>
          )}
        </Card.Footer>
      </Card>

      <Modal show={showDelete} onHide={() => setShowDelete(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Post</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure? This cannot be undone.</Modal.Body>
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

export default Post;
