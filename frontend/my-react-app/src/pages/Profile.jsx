// src/pages/Profile.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Row, Col, Spinner, Alert } from "react-bootstrap";

import Layout from "../components/Layout";
import ProfileDetails from "../components/profile/ProfileDetails";
import Post from "../components/posts/Post";
import axiosService from "../components/helpers/axios";
import useUserActions from "../hooks/user.actions";

function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { getUser } = useUserActions();
  const currentUser = getUser();

  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user info + posts
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ FIXED ENDPOINT
      const userRes = await axiosService.get(`/api/auth/user/${userId}/`);
      setProfileUser(userRes.data);

      const postsRes = await axiosService.get(
        `/api/post/posts/?author=${userId}`
      );
      setPosts(postsRes.data);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  // Refresh posts only
  const refreshPosts = async () => {
    try {
      const res = await axiosService.get(
        `/api/post/posts/?author=${userId}`
      );
      setPosts(res.data);
    } catch (err) {
      console.error("Failed to refresh posts:", err);
    }
  };

  const handleEditProfile = () => {
    navigate("/profile/edit");
  };

  // Initial load
  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  // Auto refresh posts every 20s
  useEffect(() => {
    const interval = setInterval(() => {
      refreshPosts();
    }, 20000);

    return () => clearInterval(interval);
  }, [userId]);

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="text-center mt-5">
          <Spinner animation="border" />
          <p className="mt-2">Loading profile...</p>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout>
        <Alert variant="danger" className="mt-3">
          {error}
        </Alert>
      </Layout>
    );
  }

  return (
    <Layout hasNavigationBack>
      <Row className="justify-content-center">
        <Col lg={8}>
          {/* Profile info */}
          <ProfileDetails
            user={profileUser}
            onEdit={handleEditProfile}
            isOwner={currentUser?.id === profileUser?.id}
          />

          {/* Posts header */}
          <div className="mb-3">
            <h4>Posts ({posts.length})</h4>
          </div>

          {/* Posts */}
          {posts.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">No posts yet</p>
            </div>
          ) : (
            posts.map((post) => (
              <Post
                key={post.id}
                post={post}
                refresh={refreshPosts}
                user={currentUser}
              />
            ))
          )}
        </Col>
      </Row>
    </Layout>
  );
}

export default Profile;
