// src/pages/Bookmarks.jsx
import React, { useState, useEffect } from 'react';
import { Container, Button, Spinner, Alert } from 'react-bootstrap';
import Layout from '../components/Layout';
import PostCard from '../components/posts/PostCard';
import useUserActions from '../hooks/user.actions';
import '../components/css/Home.css';

function Bookmarks() {
  const { getMyBookmarks } = useUserActions();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getMyBookmarks();

      // Backend returns bookmarks with a nested post object
      // Shape: [{ id, post: {...}, created_at }, ...]  OR just posts array
      let bookmarkedPosts = [];
      if (Array.isArray(data)) {
        // If items have a .post field, extract it; otherwise use item directly
        bookmarkedPosts = data.map(item => item.post || item);
      } else if (data && Array.isArray(data.results)) {
        bookmarkedPosts = data.results.map(item => item.post || item);
      }

      setPosts(bookmarkedPosts);
    } catch (err) {
      console.error('Failed to load bookmarks:', err);
      setError(err.response?.data?.detail || 'Failed to load bookmarks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // When user unbookmarks a post, remove it from the list
  const handlePostDeleted = (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  return (
    <Layout>
      <Container className="home-container py-4">
        {/* Header */}
        <div className="mb-4">
          <h2 className="fw-bold">
            <i className="bi bi-bookmark-fill me-2 text-primary"></i>
            Saved Posts
          </h2>
          <p className="text-muted">Posts you've bookmarked for later</p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted">Loading bookmarks...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
            <Button variant="link" className="p-0 ms-2" onClick={loadBookmarks}>
              Retry
            </Button>
          </Alert>
        )}

        {/* Empty state */}
        {!loading && !error && posts.length === 0 && (
          <div className="text-center py-5">
            <i className="bi bi-bookmark display-1 text-muted"></i>
            <h4 className="mt-3">No saved posts yet</h4>
            <p className="text-muted">
              Tap the bookmark icon on any post to save it here.
            </p>
          </div>
        )}

        {/* Bookmarked Posts */}
        {!loading && !error && posts.length > 0 && (
          <div className="posts-list">
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onDelete={handlePostDeleted}
                onUpdate={() => {}}
              />
            ))}
          </div>
        )}
      </Container>
    </Layout>
  );
}

export default Bookmarks;