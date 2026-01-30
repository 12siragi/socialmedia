// src/components/posts/Post.jsx
import React, { useState } from "react";
import { format } from "timeago.js";
import { LikeOutlined, CommentOutlined, EditOutlined, DeleteOutlined, LikeFilled } from "@ant-design/icons";
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

  const isAuthor = user?.id === post.author?.id;

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
      <Card 
        className="rounded-3 my-4 border-0"
        style={{
          backgroundColor: '#1a1d2e',
          border: '1px solid #2d3348'
        }}
      >
        <Card.Body>
          <Card.Title className="d-flex justify-content-between align-items-start">
            <div className="d-flex">
              {/* Author Avatar */}
              <Image
                src={post.author?.avatar || `https://ui-avatars.com/api/?name=${post.author?.full_name || post.author?.email}&background=8b5cf6&color=fff`}
                roundedCircle
                width={48}
                height={48}
                className="me-2"
                style={{
                  border: '2px solid #8b5cf6',
                  objectFit: 'cover'
                }}
              />
              <div>
                <p className="m-0 text-white fw-semibold">
                  {post.author?.full_name || post.author?.email || "Unknown"}
                </p>
                <small style={{ color: '#8e8e93' }}>{format(post.created_at)}</small>
              </div>
            </div>

            {/* Only show dropdown if user is the author */}
            {isAuthor && (
              <Dropdown align="end">
                <Dropdown.Toggle
                  variant="light"
                  size="sm"
                  className="border-0 p-1"
                  style={{
                    backgroundColor: 'transparent',
                    color: '#e5e7eb',
                    fontSize: '1.25rem'
                  }}
                >
                  ⋮
                </Dropdown.Toggle>

                <Dropdown.Menu
                  style={{
                    backgroundColor: '#1a1d2e',
                    border: '1px solid #2d3348',
                    minWidth: '160px'
                  }}
                >
                  <Dropdown.Item 
                    as="div" 
                    className="dropdown-item-custom d-flex align-items-center gap-2"
                    style={{
                      color: '#e5e7eb',
                      padding: '0.5rem 1rem'
                    }}
                  >
                    <EditOutlined />
                    <UpdatePost post={post} refresh={refresh} />
                  </Dropdown.Item>

                  <Dropdown.Divider style={{ borderColor: '#2d3348' }} />

                  <Dropdown.Item
                    className="dropdown-item-custom d-flex align-items-center gap-2"
                    onClick={() => setShowDelete(true)}
                    style={{
                      color: '#ef4444',
                      padding: '0.5rem 1rem'
                    }}
                  >
                    <DeleteOutlined />
                    Delete
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            )}
          </Card.Title>

          <Card.Text style={{ color: '#e5e7eb' }} className="mt-3">
            {post.content}
          </Card.Text>

          {/* Optional Post Image */}
          {post.image && (
            <Image
              src={post.image}
              alt="Post Image"
              fluid
              className="mt-3 rounded"
              style={{
                border: '1px solid #2d3348',
                maxHeight: '500px',
                objectFit: 'cover',
                width: '100%'
              }}
            />
          )}
        </Card.Body>

        <Card.Footer 
          className="border-0"
          style={{ backgroundColor: '#1a1d2e' }}
        >
          {/* Like and Comment Stats */}
          <div 
            className="d-flex justify-content-between mb-2 pb-2"
            style={{ borderBottom: '1px solid #2d3348' }}
          >
            <small style={{ color: '#8e8e93' }}>
              {likesCount} {likesCount === 1 ? 'like' : 'likes'}
            </small>
            <small style={{ color: '#8e8e93' }}>
              {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
            </small>
          </div>

          {/* Action Buttons */}
          <div className="d-flex justify-content-around pt-2">
            {/* Like Button */}
            <button
              onClick={handleLikeClick}
              className="btn d-flex align-items-center gap-2 flex-grow-1"
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: liked ? '#8b5cf6' : '#e5e7eb',
                padding: '0.5rem',
                borderRadius: '6px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!liked) e.target.style.backgroundColor = '#2d3348';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              {liked ? (
                <LikeFilled style={{ fontSize: 20, color: '#8b5cf6' }} />
              ) : (
                <LikeOutlined style={{ fontSize: 20 }} />
              )}
              <span className="d-none d-sm-inline">
                {liked ? 'Liked' : 'Like'}
              </span>
            </button>

            {/* Comment Button */}
            <button
              onClick={toggleComments}
              className="btn d-flex align-items-center gap-2 flex-grow-1"
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#e5e7eb',
                padding: '0.5rem',
                borderRadius: '6px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#2d3348';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              <CommentOutlined style={{ fontSize: 20 }} />
              <span className="d-none d-sm-inline">Comment</span>
            </button>
          </div>

          {/* Comments Section */}
          {showComments && (
            <div 
              className="mt-3 pt-3"
              style={{ borderTop: '1px solid #2d3348' }}
            >
              <CreateComment post={post} refresh={refreshComments} />

              {loadingComments ? (
                <div className="text-center py-3">
                  <div className="spinner-border spinner-border-sm" role="status" style={{ color: '#8b5cf6' }}>
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : comments.length === 0 ? (
                <small className="d-block text-center py-3" style={{ color: '#8e8e93' }}>
                  No comments yet. Be the first to comment!
                </small>
              ) : (
                <div className="mt-3">
                  {comments.map((comment) => (
                    <Comment
                      key={comment.id}
                      comment={comment}
                      refresh={refreshComments}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </Card.Footer>
      </Card>

      {/* Delete confirmation modal */}
      <Modal 
        show={showDelete} 
        onHide={() => setShowDelete(false)} 
        centered
        contentClassName="border-0"
      >
        <div style={{ backgroundColor: '#1a1d2e', borderRadius: '8px' }}>
          <Modal.Header 
            closeButton
            style={{ borderBottom: '1px solid #2d3348' }}
          >
            <Modal.Title className="text-white">Delete Post</Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ backgroundColor: '#1a1d2e', color: '#e5e7eb' }}>
            Are you sure you want to delete this post? This action cannot be undone.
          </Modal.Body>
          <Modal.Footer style={{ backgroundColor: '#1a1d2e', borderTop: '1px solid #2d3348' }}>
            <Button 
              variant="secondary" 
              onClick={() => setShowDelete(false)}
              style={{
                backgroundColor: '#2d3348',
                border: 'none',
                color: '#e5e7eb'
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={handleDelete}
              style={{
                backgroundColor: '#ef4444',
                border: 'none'
              }}
            >
              Delete
            </Button>
          </Modal.Footer>
        </div>
      </Modal>

      <style>{`
        .dropdown-item-custom {
          background-color: transparent !important;
          transition: background-color 0.2s ease;
        }

        .dropdown-item-custom:hover {
          background-color: #2d3348 !important;
        }

        .btn-close {
          filter: invert(1);
        }

        .dropdown-toggle::after {
          display: none;
        }
      `}</style>
    </>
  );
}

export default Post;