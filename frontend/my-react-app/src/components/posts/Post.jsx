import React, { useState } from "react";
import { format } from "timeago.js";
import {
  LikeFilled,
  CommentOutlined,
  LikeOutlined,
} from "@ant-design/icons";
import { Image, Card, Dropdown, Collapse } from "react-bootstrap";
import { randomAvatar } from "../utils";
import axiosService from "../helpers/axios";
import useUserActions from "../../hooks/user.actions";
import useSWR from "swr";
import { fetcher } from "../helpers/axios";
import UpdatePost from "./UpdatePost";
import Comment from "./Comment";
import CreateComment from "./CreateComment";

function Post(props) {
  const { post, refresh, isSinglePost = false } = props;
  const [showComments, setShowComments] = useState(false);
  
  const userActions = useUserActions();
  const user = userActions.getUser();
  
  // Fetch comments for this post
  const comments = useSWR(
    (showComments || isSinglePost) ? `/api/post/${post.id}/comment/` : null,
    fetcher
  );

  const handleLikeClick = (action) => {
    axiosService
      .post(`/api/post/posts/${post.id}/${action}/`)
      .then(() => {
        refresh();
      })
      .catch((err) => console.error(err));
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      axiosService
        .delete(`/api/post/posts/${post.id}/`)
        .then(() => {
          refresh();
        })
        .catch((err) => console.error(err));
    }
  };

  const toggleComments = () => {
    setShowComments(!showComments);
  };

  const refreshComments = () => {
    comments.mutate();
  };

  // Check if current user can modify this post
  const canModifyPost = user && (user.id === post.author?.id);

  return (
    <>
      <Card className="rounded-3 my-4">
        <Card.Body>
          <Card.Title className="d-flex flex-row justify-content-between">
            <div className="d-flex flex-row">
              <Image
                src={post.author?.avatar || randomAvatar()}
                roundedCircle
                width={48}
                height={48}
                className="me-2 border border-primary border-2"
              />
              <div className="d-flex flex-column justify-content-start align-self-center mt-2">
                <p className="fs-6 m-0">
                  {post.author?.first_name} {post.author?.last_name} 
                  {post.author?.name}
                </p>
                <p className="fs-6 fw-lighter">
                  <small>{format(post.created)}</small>
                </p>
              </div>
            </div>
            
            {canModifyPost && (
              <Dropdown>
                <Dropdown.Toggle variant="light" size="sm">
                  ⋯
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <UpdatePost post={post} refresh={refresh} />
                  <Dropdown.Item onClick={handleDelete} className="text-danger">
                    Delete
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            )}
          </Card.Title>
          
          <Card.Text>{post.content || post.body || "No content"}</Card.Text>
          
          <div className="d-flex flex-row">
            <LikeFilled
              style={{
                color: "#fff",
                backgroundColor: "#0D6EFD",
                borderRadius: "50%",
                width: "18px",
                height: "18px",
                fontSize: "75%",
                padding: "2px",
                margin: "3px",
              }}
            />
            <p className="ms-1 fs-6">
              <small>{post.likes_count || 0} like{post.likes_count !== 1 ? 's' : ''}</small>
            </p>
          </div>
        </Card.Body>
        
        <Card.Footer className="d-flex bg-white w-50 justify-content-between border-0">
          <div className="d-flex flex-row">
            <LikeOutlined
              style={{
                width: "24px",
                height: "24px",
                padding: "2px",
                fontSize: "20px",
                color: post.liked ? "#0D6EFD" : "#C4C4C4",
              }}
              onClick={() => {
                if (post.liked) {
                  handleLikeClick("remove_like");
                } else {
                  handleLikeClick("like");
                }
              }}
            />
            <p className="ms-1">
              <small>Like</small>
            </p>
          </div>
          
          <div className="d-flex flex-row" onClick={toggleComments} style={{cursor: 'pointer'}}>
            <CommentOutlined
              style={{
                width: "24px",
                height: "24px",
                padding: "2px",
                fontSize: "20px",
                color: showComments ? "#0D6EFD" : "#C4C4C4",
              }}
            />
            <p className="ms-1 mb-0">
              <small>Comment ({post.comments_count || 0})</small>
            </p>
          </div>
        </Card.Footer>
        
        <Collapse in={showComments}>
          <div className="px-3 pb-3">
            {comments.isLoading && (
              <div className="text-center py-3">
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Loading comments...</span>
                </div>
              </div>
            )}
            
            {comments.data?.results?.map((comment) => (
              <Comment
                key={comment.id}
                comment={comment}
                refresh={refreshComments}
                currentUser={user}
              />
            ))}
            
            {showComments && <CreateComment post={post} refresh={refreshComments} />}
          </div>
        </Collapse>
      </Card>
    </>
  );
}

export default Post;