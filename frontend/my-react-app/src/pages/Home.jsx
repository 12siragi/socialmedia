// src/pages/Home.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Container, Button, Spinner, Alert } from 'react-bootstrap';
import Layout from '../components/Layout';
import PostCard from '../components/posts/PostCard';
import CreatePostModal from '../components/posts/CreatePostModal';
import useFeed from '../hooks/useFeed';
import '../components/css/Home.css';

function Home() {
  const {
    posts, loading, hasMore, error,
    fetchPosts, loadMore, addPost, removePost, updatePost
  } = useFeed();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const bottomRef = useRef(null);

  // Initial load
  useEffect(() => {
    fetchPosts();
  }, []);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && hasMore && !loading) loadMore(); },
      { threshold: 0.1 }
    );
    if (bottomRef.current) observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, [loadMore, hasMore, loading]);

  const handlePostCreated = (newPost) => {
    if (newPost) {
      addPost(newPost); // instant prepend — no refetch
    } else {
      fetchPosts(); // fallback: full reload
    }
    setShowCreateModal(false);
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

        {/* Error */}
        {error && (
          <Alert variant="danger" dismissible onClose={() => {}}>
            {error}
          </Alert>
        )}

        {/* Empty state */}
        {!loading && !error && posts.length === 0 && (
          <div className="text-center py-5">
            <i className="bi bi-inbox display-1 text-muted"></i>
            <h4 className="mt-3">No posts yet</h4>
            <p className="text-muted">Be the first to share something!</p>
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              Create Post
            </Button>
          </div>
        )}

        {/* Posts list */}
        <div className="posts-list">
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onUpdate={updatePost}
              onDelete={removePost}
            />
          ))}
        </div>

        {/* Loading spinner */}
        {loading && (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
          </div>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={bottomRef} />

        {/* End of feed */}
        {!hasMore && posts.length > 0 && (
          <p className="text-center text-muted py-3">
            <i className="bi bi-check-circle me-2"></i>
            You're all caught up!
          </p>
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