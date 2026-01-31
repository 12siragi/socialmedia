// src/components/comments/Comment.jsx
import React, { useState } from "react";
import { Card, Dropdown, Button, Form, Modal, Image } from "react-bootstrap";
import { LikeOutlined, LikeFilled } from "@ant-design/icons";
import { format } from "timeago.js";
import axiosService from "../helpers/axios";
import useUserActions from "../../hooks/user.actions";

function Comment({ comment, refresh }) {
  const { getUser } = useUserActions();
  const user = getUser();

  // Normalize author object
  const author =
    typeof comment.author === "object" ? comment.author : { email: comment.author };

  // Ownership check
  const isAuthor = user?.email && author?.email && user.email === author.email;

  // State
  const [liked, setLiked] = useState(!!comment.liked);
  const [likesCount, setLikesCount] = useState(comment.likes_count ?? 0);
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(comment.content || "");
  const [showDelete, setShowDelete] = useState(false);

  // Like / unlike
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

  // Update comment
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

  // Delete comment
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
      <div className="mb-3">
        <div className="d-flex align-items-start gap-2">
          {/* Avatar */}
          <Image
            src={
              author?.avatar || 
              `https://ui-avatars.com/api/?name=${author?.username || author?.full_name || author?.email || 'User'}&background=8b5cf6&color=fff`
            }
            roundedCircle
            width={36}
            height={36}
            style={{
              border: '2px solid #8b5cf6',
              objectFit: 'cover',
              flexShrink: 0
            }}
          />

          <div className="flex-grow-1" style={{ minWidth: 0 }}>
            {/* Comment Bubble */}
            <div 
              className="rounded-3 p-3"
              style={{
                backgroundColor: '#2d3348',
                border: '1px solid #3d4358',
                position: 'relative'
              }}
            >
              {/* Header - Author and Dropdown */}
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <strong 
                    className="text-white"
                    style={{ fontSize: '0.9rem' }}
                  >
                    {author?.username || author?.full_name || author?.email || "User"}
                  </strong>
                  <small 
                    className="d-block"
                    style={{ color: '#8e8e93', fontSize: '0.75rem' }}
                  >
                    {comment.created_at ? format(comment.created_at) : ""}
                  </small>
                </div>

                {isAuthor && (
                  <Dropdown align="end">
                    <Dropdown.Toggle
                      variant="light"
                      size="sm"
                      className="border-0 p-1"
                      style={{
                        backgroundColor: 'transparent',
                        color: '#8e8e93',
                        fontSize: '1.25rem',
                        lineHeight: 1
                      }}
                    >
                      ⋮
                    </Dropdown.Toggle>

                    <Dropdown.Menu
                      style={{
                        backgroundColor: '#1a1d2e',
                        border: '1px solid #2d3348',
                        minWidth: '140px'
                      }}
                    >
                      <Dropdown.Item
                        onClick={() => setIsEditing(true)}
                        className="dropdown-item-custom"
                        style={{
                          color: '#e5e7eb',
                          padding: '0.5rem 1rem',
                          fontSize: '0.9rem'
                        }}
                      >
                        <svg 
                          width="14" 
                          height="14" 
                          fill="currentColor" 
                          viewBox="0 0 16 16"
                          style={{ marginRight: '0.5rem' }}
                        >
                          <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                        </svg>
                        Edit
                      </Dropdown.Item>
                      
                      <Dropdown.Divider style={{ borderColor: '#2d3348' }} />
                      
                      <Dropdown.Item
                        onClick={() => setShowDelete(true)}
                        className="dropdown-item-custom"
                        style={{
                          color: '#ef4444',
                          padding: '0.5rem 1rem',
                          fontSize: '0.9rem'
                        }}
                      >
                        <svg 
                          width="14" 
                          height="14" 
                          fill="currentColor" 
                          viewBox="0 0 16 16"
                          style={{ marginRight: '0.5rem' }}
                        >
                          <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                          <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                        </svg>
                        Delete
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                )}
              </div>

              {/* Comment Content / Edit Mode */}
              {!isEditing ? (
                <p 
                  className="mb-0"
                  style={{ 
                    color: '#e5e7eb',
                    fontSize: '0.9rem',
                    lineHeight: '1.5',
                    wordBreak: 'break-word'
                  }}
                >
                  {content}
                </p>
              ) : (
                <div>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    autoFocus
                    style={{
                      backgroundColor: '#1a1d2e',
                      border: '1px solid #3d4358',
                      color: '#fff',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      resize: 'none'
                    }}
                  />
                  <div className="d-flex gap-2 mt-2">
                    <Button 
                      size="sm" 
                      onClick={handleUpdate}
                      style={{
                        backgroundColor: '#8b5cf6',
                        border: 'none',
                        fontSize: '0.85rem',
                        padding: '0.4rem 1rem'
                      }}
                    >
                      Save
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        setIsEditing(false);
                        setContent(comment.content || "");
                      }}
                      style={{
                        backgroundColor: '#2d3348',
                        border: '1px solid #3d4358',
                        color: '#e5e7eb',
                        fontSize: '0.85rem',
                        padding: '0.4rem 1rem'
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Like Button - Outside bubble */}
            {!isEditing && (
              <div className="d-flex align-items-center gap-3 mt-1 ms-2">
                <button
                  onClick={handleLike}
                  className="btn btn-sm p-0 d-flex align-items-center gap-1"
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: liked ? '#8b5cf6' : '#8e8e93',
                    fontSize: '0.85rem',
                    fontWeight: liked ? '600' : '400'
                  }}
                >
                  {liked ? (
                    <LikeFilled style={{ fontSize: 16, color: '#8b5cf6' }} />
                  ) : (
                    <LikeOutlined style={{ fontSize: 16 }} />
                  )}
                  <span>{likesCount > 0 ? likesCount : ''} {likesCount === 1 ? 'Like' : likesCount > 1 ? 'Likes' : 'Like'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <Modal 
        show={showDelete} 
        onHide={() => setShowDelete(false)} 
        centered
        contentClassName="border-0"
      >
        <div style={{ backgroundColor: '#1a1d2e', borderRadius: '12px' }}>
          <Modal.Header 
            closeButton
            style={{ borderBottom: '1px solid #2d3348' }}
          >
            <Modal.Title className="text-white" style={{ fontSize: '1.1rem' }}>
              Delete Comment
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ backgroundColor: '#1a1d2e', color: '#e5e7eb' }}>
            Are you sure you want to delete this comment? This action cannot be undone.
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

        <style>{`
          .btn-close {
            filter: invert(1);
          }

          .dropdown-item-custom {
            background-color: transparent !important;
            transition: background-color 0.2s ease;
          }

          .dropdown-item-custom:hover {
            background-color: #2d3348 !important;
          }

          .dropdown-toggle::after {
            display: none;
          }

          textarea:focus {
            background-color: #1a1d2e !important;
            border-color: #8b5cf6 !important;
            color: #fff !important;
            box-shadow: 0 0 0 0.2rem rgba(139, 92, 246, 0.25) !important;
          }

          textarea::placeholder {
            color: #6b7280 !important;
          }
        `}</style>
      </Modal>
    </>
  );
}

export default Comment;