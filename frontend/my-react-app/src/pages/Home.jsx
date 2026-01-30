// src/pages/Home.jsx
import React, { useState, useEffect } from "react";
import { Row, Col } from "react-bootstrap";
import Layout from "../components/Layout";
import useUserActions from "../hooks/user.actions";
import CreatePost from "../components/posts/CreatePost";
import Post from "../components/posts/Post";
import ProfileCard from "../components/profile/ProfileCard";
import useSWR from "swr";
import axiosService from "../components/helpers/axios";
import "../components/css/Home.css";

const fetcher = (url) => axiosService.get(url).then((res) => res.data);

function Home() {
  const { getUser } = useUserActions();
  const user = getUser();

  // State for posts
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch 5 suggested profiles
  const { data: profiles } = useSWR("/api/auth/user/?page=1", fetcher);

  // Fetch posts
  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosService.get("/api/post/posts/");
      setPosts(res.data);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
      setError("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  // Refresh posts function
  const refreshPosts = async () => {
    try {
      const res = await axiosService.get("/api/post/posts/");
      setPosts(res.data);
    } catch (err) {
      console.error("Failed to refresh posts:", err);
    }
  };

  // Fetch posts on component mount
  useEffect(() => {
    fetchPosts();
  }, []);

  // Calculate user's post count from fetched posts
  const userPostsCount = posts.filter(post => post.author?.id === user?.id).length;

  if (!user) {
    return (
      <Layout>
        <div className="d-flex justify-content-center align-items-center home-loading-container">
          <div className="text-center">
            <div className="spinner-border mb-3 home-loading-spinner" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="home-loading-text">Loading your feed...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Row className="justify-content-center g-4">
        {/* LEFT SIDEBAR - User Info */}
        <Col lg={3} className="d-none d-lg-block">
          <div className="rounded-3 p-3 sticky-top home-user-card">
            <div className="text-center mb-3">
              <img
                src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.first_name}+${user?.last_name}&background=8b5cf6&color=fff`}
                alt={user?.first_name}
                className="rounded-circle mb-2 home-user-avatar"
              />
              <h6 className="text-white mb-1">
                {user?.first_name} {user?.last_name}
              </h6>
              <small className="home-user-stats-label">
                @{user?.username || user?.email?.split('@')[0]}
              </small>
            </div>

            <hr className="home-divider" />

            <div className="d-flex justify-content-around text-center">
              <div>
                <div className="text-white fw-bold">
                  {userPostsCount}
                </div>
                <small className="home-user-stats-label">Posts</small>
              </div>
              <div>
                <div className="text-white fw-bold">
                  {user?.followers_count || 0}
                </div>
                <small className="home-user-stats-label">Followers</small>
              </div>
              <div>
                <div className="text-white fw-bold">
                  {user?.following_count || 0}
                </div>
                <small className="home-user-stats-label">Following</small>
              </div>
            </div>
          </div>
        </Col>

        {/* CENTER COLUMN - Posts Feed */}
        <Col lg={6} md={8} sm={12}>
          {/* Create Post Component */}
          <CreatePost refresh={refreshPosts} />

          {/* Loading State */}
          {loading && (
            <div className="text-center py-5 rounded-3 home-posts-state-card">
              <div className="spinner-border mb-2 home-spinner" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="home-spinner-text">Loading posts...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-5 rounded-3 home-posts-state-card">
              <svg 
                width="64" 
                height="64" 
                fill="currentColor" 
                viewBox="0 0 16 16"
                className="home-empty-icon"
                style={{ color: '#ef4444' }}
              >
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
              </svg>
              <h5 className="text-white mb-2">Failed to load posts</h5>
              <p className="home-empty-text">
                Please try again later
              </p>
              <button 
                className="btn px-4 py-2 home-load-more-btn mt-2"
                onClick={fetchPosts}
              >
                Retry
              </button>
            </div>
          )}

          {/* Posts List */}
          {!loading && !error && posts.length === 0 ? (
            <div className="text-center py-5 rounded-3 home-posts-state-card">
              <svg 
                width="64" 
                height="64" 
                fill="currentColor" 
                viewBox="0 0 16 16"
                className="home-empty-icon"
              >
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
              </svg>
              <h5 className="text-white mb-2">No posts yet</h5>
              <p className="home-empty-text">
                Be the first to share something!
              </p>
            </div>
          ) : (
            !loading && !error && (
              <div className="d-flex flex-column gap-3">
                {posts.map((post) => (
                  <Post key={post.id} post={post} refresh={refreshPosts} user={user} />
                ))}
              </div>
            )
          )}

          {/* Load More (if needed) */}
          {!loading && !error && posts.length > 0 && (
            <div className="text-center mt-4 mb-4">
              <button className="btn px-4 py-2 home-load-more-btn">
                Load more posts
              </button>
            </div>
          )}
        </Col>

        {/* RIGHT SIDEBAR - Suggested People */}
        <Col lg={3} md={4} className="d-none d-md-block">
          <div className="rounded-3 p-3 sticky-top home-suggestions-card">
            <h5 className="text-white fw-semibold mb-3">
              Suggested for you
            </h5>

            {/* Loading state for profiles */}
            {!profiles ? (
              <div className="text-center py-3">
                <div className="spinner-border spinner-border-sm home-suggestions-spinner" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : profiles.results.length === 0 ? (
              <p className="text-center home-no-suggestions">
                No suggestions available
              </p>
            ) : (
              <div className="d-flex flex-column gap-3">
                {profiles.results.slice(0, 5).map((profile) => (
                  <ProfileCard key={profile.id} user={profile} />
                ))}
              </div>
            )}

            {/* See All Link */}
            {profiles && profiles.results.length > 5 && (
              <div className="text-center mt-3">
                <a href="/explore" className="home-see-all-link">
                  See all suggestions
                </a>
              </div>
            )}
          </div>

          {/* Footer/Info Card */}
          <div className="rounded-3 p-3 mt-3 home-footer-card">
            <small className="home-footer-link">
              <a href="/about" className="home-footer-link">About</a> · 
              <a href="/help" className="home-footer-link"> Help</a> · 
              <a href="/privacy" className="home-footer-link"> Privacy</a> · 
              <a href="/terms" className="home-footer-link"> Terms</a>
            </small>
            <div className="mt-2">
              <small className="home-footer-copyright">
                © 2026 PingChart
              </small>
            </div>
          </div>
        </Col>
      </Row>
    </Layout>
  );
}

export default Home;