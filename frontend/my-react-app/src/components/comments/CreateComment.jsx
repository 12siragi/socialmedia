// src/components/comments/CreateComment.jsx
import React, { useState } from "react";
import { Button, Form, Image } from "react-bootstrap";
import axiosService from "../helpers/axios";
import useUserActions from "../../hooks/user.actions";

function CreateComment({ post, refresh }) {
  const userActions = useUserActions();
  const user = userActions.getUser();

  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      await axiosService.post(
        `/api/comment/post/${post.id}/comment/`,
        { content }
      );

      setContent(""); // clear input
      setIsFocused(false); // collapse
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
    <Form 
      onSubmit={handleSubmit} 
      className="mb-3"
      style={{
        backgroundColor: isFocused ? '#2d3348' : 'transparent',
        border: `1px solid ${isFocused ? '#8b5cf6' : '#2d3348'}`,
        borderRadius: '12px',
        padding: '0.75rem',
        transition: 'all 0.2s ease'
      }}
    >
      <div className="d-flex align-items-start gap-2">
        {/* User Avatar */}
        <Image
          src={
            user.avatar || 
            `https://ui-avatars.com/api/?name=${user.first_name}+${user.last_name}&background=8b5cf6&color=fff`
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

        <div className="flex-grow-1">
          {/* Comment Input */}
          <Form.Control
            as="textarea"
            rows={isFocused ? 3 : 1}
            placeholder="Write a comment..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsFocused(true)}
            style={{
              backgroundColor: '#1a1d2e',
              border: 'none',
              color: '#fff',
              borderRadius: '8px',
              fontSize: '0.9rem',
              resize: 'none',
              transition: 'all 0.2s ease'
            }}
          />

          {/* Action Buttons - Show when focused */}
          {isFocused && (
            <div className="d-flex justify-content-end gap-2 mt-2">
              <Button
                size="sm"
                onClick={() => {
                  setContent("");
                  setIsFocused(false);
                }}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #3d4358',
                  color: '#8e8e93',
                  fontSize: '0.85rem',
                  padding: '0.4rem 1rem',
                  borderRadius: '6px'
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!content.trim() || loading}
                style={{
                  backgroundColor: '#8b5cf6',
                  border: 'none',
                  fontSize: '0.85rem',
                  padding: '0.4rem 1rem',
                  borderRadius: '6px'
                }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                    Posting...
                  </>
                ) : (
                  'Comment'
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        textarea:focus {
          background-color: #1a1d2e !important;
          border: none !important;
          color: #fff !important;
          box-shadow: none !important;
          outline: none !important;
        }

        textarea::placeholder {
          color: #6b7280 !important;
        }

        textarea::-webkit-scrollbar {
          width: 6px;
        }

        textarea::-webkit-scrollbar-track {
          background: transparent;
        }

        textarea::-webkit-scrollbar-thumb {
          background: #2d3348;
          border-radius: 3px;
        }

        textarea::-webkit-scrollbar-thumb:hover {
          background: #3d4358;
        }
      `}</style>
    </Form>
  );
}

export default CreateComment;