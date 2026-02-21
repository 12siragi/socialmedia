// src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { Container, Button, Spinner, Alert } from 'react-bootstrap';
import Layout from '../components/Layout';
import PostCard from '../components/posts/PostCard';
import CreatePostModal from '../components/posts/CreatePostModal';
import useUserActions from '../hooks/user.actions';
import '../components/css/Home.css';

function Home() {
  const { getPosts } = useUserActions();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Load posts
  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getPosts();
      console.log('Loaded posts:', data); // ✅ Debug
      
      // ✅ Handle both array and object responses
      if (Array.isArray(data)) {
        setPosts(data);
      } else if (data && Array.isArray(data.results)) {
        setPosts(data.results);
      } else {
        console.error('Unexpected data format:', data);
        setPosts([]);
      }
    } catch (err) {
      console.error('Failed to load posts:', err);
      setError(err.response?.data?.detail || 'Failed to load posts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle post created
  const handlePostCreated = () => {
    console.log('Post created, reloading feed...');
    loadPosts(); // Reload feed
  };

  // Handle post deleted
  const handlePostDeleted = (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  // Handle post updated
  const handlePostUpdated = (post) => {
    // TODO: Open edit modal
    console.log('Edit post:', post);
  };

  return (
    <Layout>
      <Container className="home-container py-4">
        {/* Create post button */}
        <div className="create-post-section mb-4">
          <Button
            variant="primary"
            size="lg"
            className="w-100"
            onClick={() => setShowCreateModal(true)}
          >
            <i className="bi bi-plus-circle me-2"></i>
            What's on your mind?
          </Button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted">Loading posts...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Posts */}
        {!loading && !error && (
          <>
            {posts.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-inbox display-1 text-muted"></i>
                <h4 className="mt-3">No posts yet</h4>
                <p className="text-muted">Be the first to share something!</p>
                <Button
                  variant="primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  Create Post
                </Button>
              </div>
            ) : (
              <div className="posts-list">
                {posts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onUpdate={handlePostUpdated}
                    onDelete={handlePostDeleted}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Create Post Modal */}
        <CreatePostModal
          show={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handlePostCreated}
        />
      </Container>
    </Layout>
  );
}

export default Home;