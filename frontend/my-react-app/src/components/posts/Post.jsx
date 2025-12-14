import React, { useState } from "react";
import { format } from "timeago.js";
import { LikeOutlined, CommentOutlined } from "@ant-design/icons";
import { Image, Card, Dropdown, Modal, Button } from "react-bootstrap";
import { randomAvatar } from "../utils";
import axiosService from "../helpers/axios";
import UpdatePost from "./UpdatePost";

function Post({ post, refresh, user }) {
  const [liked, setLiked] = useState(post.liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [showDelete, setShowDelete] = useState(false);

  const isAuthor =
    user?.email === post.author?.email || user?.email === post.author;

  // ❤️ Like
  const handleLikeClick = () => {
    axiosService.post(`/api/post/posts/${post.id}/like/`).then(() => {
      setLiked(!liked);
      setLikesCount(liked ? likesCount - 1 : likesCount + 1);
      refresh();
    });
  };

  // 🗑 Delete
  const handleDelete = () => {
    axiosService.delete(`/api/post/posts/${post.id}/`).then(() => {
      setShowDelete(false);
      refresh();
    });
  };

  return (
    <>
      <Card className="rounded-3 my-4">
        <Card.Body>
          <Card.Title className="d-flex justify-content-between align-items-start">
            <div className="d-flex">
              <Image
                src={randomAvatar()}
                roundedCircle
                width={48}
                height={48}
                className="me-2 border border-primary"
              />
              <div>
                <p className="m-0">{post.author?.name || post.author}</p>
                <small className="text-muted">
                  {format(post.created)}
                </small>
              </div>
            </div>

            {/* ⋮ Dropdown */}
            <Dropdown align="end">
              <Dropdown.Toggle
                variant="light"
                size="sm"
                className="border-0 p-0"
              >
                ⋮
              </Dropdown.Toggle>

              <Dropdown.Menu>
                {isAuthor ? (
                  <>
                    {/* ✏ Edit */}
                    <UpdatePost post={post} refresh={refresh} />

                    {/* 🗑 Delete */}
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
        </Card.Body>

        <Card.Footer className="d-flex justify-content-between bg-white border-0">
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

          <div className="d-flex align-items-center">
            <CommentOutlined style={{ fontSize: 20 }} />
            <small className="ms-2">Comment</small>
          </div>
        </Card.Footer>
      </Card>

      {/* 🔥 Delete Modal */}
      <Modal show={showDelete} onHide={() => setShowDelete(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Post</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure? This cannot be undone.
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

export default Post;
