// src/pages/Profile.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Row, Col, Nav } from "react-bootstrap";

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
  const [activeTab, setActiveTab] = useState("posts");

  // Fetch user info and posts
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const userRes = await axiosService.get(`/api/auth/user/${userId}/`);
      setProfileUser(userRes.data);

      const postsRes = await axiosService.get(
        `/api/post/posts/?author=${userId}`
      );
      setPosts(postsRes.data.results || []);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setError(err.response?.status === 404 ? "User not found" : "Failed to load profile");
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
      setPosts(res.data.results || []);
    } catch (err) {
      console.error("Failed to refresh posts:", err);
    }
  };

  // Navigate to edit profile page
  const handleEditProfile = () => {
    navigate("/profile/edit");
  };

  // Fetch profile on page load
  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div 
          className="d-flex justify-content-center align-items-center"
          style={{ minHeight: '60vh' }}
        >
          <div className="text-center">
            <div 
              className="spinner-border mb-3" 
              role="status"
              style={{ 
                width: '3rem', 
                height: '3rem',
                color: '#8b5cf6'
              }}
            >
              <span className="visually-hidden">Loading...</span>
            </div>
            <p style={{ color: '#8e8e93' }}>Loading profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout>
        <div 
          className="text-center py-5 rounded-3 mx-auto"
          style={{
            backgroundColor: '#1a1d2e',
            border: '1px solid #2d3348',
            maxWidth: '600px',
            marginTop: '3rem'
          }}
        >
          <svg 
            width="64" 
            height="64" 
            fill="currentColor" 
            viewBox="0 0 16 16"
            style={{ color: '#ef4444', marginBottom: '1rem' }}
          >
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
            <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
          </svg>
          <h4 className="text-white mb-2">{error}</h4>
          <p style={{ color: '#8e8e93' }} className="mb-4">
            {error === "User not found" 
              ? "This user doesn't exist or has been removed." 
              : "Please try again later."}
          </p>
          <button
            className="btn px-4 py-2"
            onClick={() => navigate('/')}
            style={{
              backgroundColor: '#8b5cf6',
              border: 'none',
              color: '#fff',
              borderRadius: '8px'
            }}
          >
            Go to Home
          </button>
        </div>
      </Layout>
    );
  }

  const isOwnProfile = currentUser?.id === profileUser?.id;

  // Main content
  return (
    <Layout>
      <Row className="justify-content-center">
        <Col lg={10} xl={8}>
          {/* Profile Details Component */}
          <ProfileDetails 
            user={profileUser} 
            onEdit={handleEditProfile}
            isOwnProfile={isOwnProfile}
            refreshProfile={fetchProfile}
          />

          {/* Tabs Navigation */}
          <div 
            className="rounded-3 mb-4"
            style={{
              backgroundColor: '#1a1d2e',
              border: '1px solid #2d3348',
              overflow: 'hidden'
            }}
          >
            <Nav variant="tabs" className="border-0">
              <Nav.Item>
                <Nav.Link
                  active={activeTab === "posts"}
                  onClick={() => setActiveTab("posts")}
                  className="px-4 py-3"
                  style={{
                    backgroundColor: activeTab === "posts" ? '#2d3348' : 'transparent',
                    color: activeTab === "posts" ? '#8b5cf6' : '#8e8e93',
                    border: 'none',
                    borderBottom: activeTab === "posts" ? '3px solid #8b5cf6' : 'none',
                    fontWeight: activeTab === "posts" ? '600' : '400',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <svg 
                    width="18" 
                    height="18" 
                    fill="currentColor" 
                    viewBox="0 0 16 16"
                    style={{ marginRight: '0.5rem', marginBottom: '2px' }}
                  >
                    <path d="M2.5 1A1.5 1.5 0 0 0 1 2.5v11A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 13.5 1h-11zM2 2.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11z"/>
                  </svg>
                  Posts
                  <span 
                    className="ms-2 px-2 py-1 rounded-pill"
                    style={{
                      backgroundColor: activeTab === "posts" ? '#8b5cf6' : '#2d3348',
                      color: '#fff',
                      fontSize: '0.75rem'
                    }}
                  >
                    {posts.length}
                  </span>
                </Nav.Link>
              </Nav.Item>

              <Nav.Item>
                <Nav.Link
                  active={activeTab === "media"}
                  onClick={() => setActiveTab("media")}
                  className="px-4 py-3"
                  style={{
                    backgroundColor: activeTab === "media" ? '#2d3348' : 'transparent',
                    color: activeTab === "media" ? '#8b5cf6' : '#8e8e93',
                    border: 'none',
                    borderBottom: activeTab === "media" ? '3px solid #8b5cf6' : 'none',
                    fontWeight: activeTab === "media" ? '600' : '400',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <svg 
                    width="18" 
                    height="18" 
                    fill="currentColor" 
                    viewBox="0 0 16 16"
                    style={{ marginRight: '0.5rem', marginBottom: '2px' }}
                  >
                    <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                    <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z"/>
                  </svg>
                  Media
                </Nav.Link>
              </Nav.Item>

              <Nav.Item>
                <Nav.Link
                  active={activeTab === "likes"}
                  onClick={() => setActiveTab("likes")}
                  className="px-4 py-3"
                  style={{
                    backgroundColor: activeTab === "likes" ? '#2d3348' : 'transparent',
                    color: activeTab === "likes" ? '#8b5cf6' : '#8e8e93',
                    border: 'none',
                    borderBottom: activeTab === "likes" ? '3px solid #8b5cf6' : 'none',
                    fontWeight: activeTab === "likes" ? '600' : '400',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <svg 
                    width="18" 
                    height="18" 
                    fill="currentColor" 
                    viewBox="0 0 16 16"
                    style={{ marginRight: '0.5rem', marginBottom: '2px' }}
                  >
                    <path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15z"/>
                  </svg>
                  Likes
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </div>

          {/* Tab Content */}
          {activeTab === "posts" && (
            <>
              {posts.length === 0 ? (
                <div 
                  className="text-center py-5 rounded-3"
                  style={{
                    backgroundColor: '#1a1d2e',
                    border: '1px solid #2d3348'
                  }}
                >
                  <svg 
                    width="64" 
                    height="64" 
                    fill="currentColor" 
                    viewBox="0 0 16 16"
                    style={{ color: '#8e8e93', marginBottom: '1rem' }}
                  >
                    <path d="M2.5 1A1.5 1.5 0 0 0 1 2.5v11A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 13.5 1h-11zM2 2.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11z"/>
                  </svg>
                  <h5 className="text-white mb-2">No posts yet</h5>
                  <p style={{ color: '#8e8e93' }}>
                    {isOwnProfile 
                      ? "Share your first post with your followers!" 
                      : `${profileUser?.first_name} hasn't posted anything yet.`}
                  </p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {posts.map((post) => (
                    <Post
                      key={post.id}
                      post={post}
                      refresh={refreshPosts}
                      user={currentUser}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === "media" && (
            <div 
              className="text-center py-5 rounded-3"
              style={{
                backgroundColor: '#1a1d2e',
                border: '1px solid #2d3348'
              }}
            >
              <svg 
                width="64" 
                height="64" 
                fill="currentColor" 
                viewBox="0 0 16 16"
                style={{ color: '#8e8e93', marginBottom: '1rem' }}
              >
                <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z"/>
              </svg>
              <h5 className="text-white mb-2">No media yet</h5>
              <p style={{ color: '#8e8e93' }}>
                Photos and videos will appear here
              </p>
            </div>
          )}

          {activeTab === "likes" && (
            <div 
              className="text-center py-5 rounded-3"
              style={{
                backgroundColor: '#1a1d2e',
                border: '1px solid #2d3348'
              }}
            >
              <svg 
                width="64" 
                height="64" 
                fill="currentColor" 
                viewBox="0 0 16 16"
                style={{ color: '#8e8e93', marginBottom: '1rem' }}
              >
                <path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15z"/>
              </svg>
              <h5 className="text-white mb-2">No liked posts</h5>
              <p style={{ color: '#8e8e93' }}>
                Liked posts will appear here
              </p>
            </div>
          )}
        </Col>
      </Row>

      <style>{`
        .nav-tabs .nav-link {
          border: none !important;
        }

        .nav-tabs .nav-link:hover {
          background-color: #2d3348 !important;
          color: #8b5cf6 !important;
        }

        .nav-tabs {
          border-bottom: none !important;
        }
      `}</style>
    </Layout>
  );
}

export default Profile;