import React from "react";
import Layout from "../components/Layout";
import { Row, Col, Image } from "react-bootstrap";
import { randomAvatar } from "../components/utils";
import useSWR from "swr";
import axiosService, { fetcher } from "../components/helpers/axios";
import useUserActions from "../hooks/user.actions";
import CreatePost from "../components/posts/CreatePost";
import Post from "../components/posts/Post";

function Home() {
  // ✅ Fixed: Use correct SWR configuration for better refresh handling
  const posts = useSWR("/api/post/posts/", fetcher, {
    refreshInterval: 10000,        // Refresh every 10 seconds
    revalidateOnFocus: true,       // Refresh when window gets focus
    revalidateOnReconnect: true,   // Refresh on reconnect
  });

  const userActions = useUserActions();
  const user = userActions.getUser();

  // 🔍 DEBUG: Enhanced logging
  console.log("📊 Posts SWR data:", posts.data);
  console.log("📊 Posts SWR error:", posts.error);
  console.log("📊 Posts SWR loading:", posts.isLoading);
  
  // Debug posts structure
  if (posts.data) {
    console.log("🔍 Posts data structure:", posts.data);
    if (posts.data.results) {
      console.log("🔍 Number of posts:", posts.data.results.length);
      console.log("🔍 Posts array:", posts.data.results);
    } else if (Array.isArray(posts.data)) {
      console.log("🔍 Posts is direct array, length:", posts.data.length);
    }
  }

  // ✅ Enhanced refresh function that forces revalidation
  const refreshPosts = async () => {
    console.log("🔄 Refreshing posts...");
    try {
      await posts.mutate();
      console.log("✅ Posts refreshed successfully");
    } catch (error) {
      console.error("❌ Error refreshing posts:", error);
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="d-flex justify-content-center align-items-center" style={{height: '50vh'}}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Layout>
    );
  }

  // ✅ Handle different response formats from backend
  const postsArray = posts.data?.results || posts.data || [];

  return (
    <Layout>
      <Row className="justify-content-center">
        <Col sm={8} md={6} lg={7}>
          <Row className="border rounded p-3 align-items-center bg-white shadow-sm my-4">
            <Col xs="auto" className="flex-shrink-0">
              <Image
                src={user.avatar || randomAvatar()}
                roundedCircle
                width={52}
                height={52}
                className="my-2"
                alt={`${user.first_name || 'User'}'s avatar`}
              />
            </Col>
            <Col className="flex-grow-1">
              {/* ✅ Pass enhanced refresh function */}
              <CreatePost refresh={refreshPosts} />
            </Col>
          </Row>
          
          <Row className="my-4">
            {/* ✅ Handle both paginated and direct array responses */}
            {postsArray.length > 0 ? (
              postsArray.map((post, index) => (
                <Post key={post.id || `post-${index}`} post={post} refresh={refreshPosts} />
              ))
            ) : (
              !posts.isLoading && (
                <div className="text-center my-4">
                  <p className="text-muted">No posts yet. Create your first post!</p>
                </div>
              )
            )}
          </Row>
          
          {posts.isLoading && (
            <div className="text-center my-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading posts...</span>
              </div>
            </div>
          )}
        </Col>
      </Row>
    </Layout>
  );
}

export default Home;