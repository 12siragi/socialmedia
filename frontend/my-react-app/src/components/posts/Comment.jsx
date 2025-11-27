// src/components/posts/Comment.jsx
import React, { useState } from "react";
import { format } from "timeago.js";
import { Image, Dropdown } from "react-bootstrap";
import { randomAvatar } from "../utils";
import axiosService from "../helpers/axios";
import UpdateComment from "./UpdateComment";

function Comment({ comment, refresh, currentUser }) {
  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      axiosService
        // ✅ FIXED: Use nested route instead of flat route
        .delete(`/api/post/${comment.post}/comment/${comment.id}/`)
        .then(() => {
          console.log("✅ Comment deleted successfully");
          refresh();
        })
        .catch((err) => {
          console.error("❌ Error deleting comment:", err);
        });
    }
  };

  // Check if current user can edit/delete this comment
  const canModify = currentUser && (currentUser.id === comment.author?.id);

  return (
    <div className="d-flex flex-row border-bottom pb-2 mb-2">
      <Image
        src={comment.author?.avatar || randomAvatar()}
        roundedCircle
        width={32}
        height={32}
        className="me-2"
      />
      <div className="flex-grow-1">
        <div className="d-flex justify-content-between align-items-start">
          <div className="flex-grow-1">
            <div className="bg-light rounded-3 p-2">
              <p className="fw-bold mb-1 small">
                {comment.author?.first_name} {comment.author?.last_name}
              </p>
              <p className="mb-0 small">{comment.content}</p>
            </div>
            <small className="text-muted ms-2">
              {format(comment.created)}
            </small>
          </div>
          
          {canModify && (
            <Dropdown>
              <Dropdown.Toggle variant="light" size="sm" className="border-0">
                ⋯
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <UpdateComment comment={comment} refresh={refresh} />
                <Dropdown.Item onClick={handleDelete} className="text-danger">
                  Delete
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          )}
        </div>
      </div>
    </div>
  );
}

export default Comment;