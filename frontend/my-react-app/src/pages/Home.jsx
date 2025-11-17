import React from "react";
import Layout from "../components/Layout"; // ✅ Fixed: changed from "./components/Layout" to "../components/Layout"
import { Row, Col, Image } from "react-bootstrap";
import { randomAvatar } from "../components/utils";
import useSWR from "swr";
import axiosService, { fetcher } from "../components/helpers/axios";
import useUserActions from "../hooks/user.actions";
import CreatePost from "../components/posts/CreatePost";
import Post from "../components/posts/Post";

function Home() {
  // ✅ Change from "/api/post/" to "/api/post/posts/"
  const posts = useSWR("/api/post/posts/", fetcher, {
    refreshInterval: 20000,
  });


  const userActions = useUserActions();
  const user = userActions.getUser();

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
              <CreatePost refresh={posts.mutate} />
            </Col>
          </Row>
          
          <Row className="my-4">
            {posts.data?.results?.map((post, index) => (
              <Post key={post.id || index} post={post} refresh={posts.mutate} />
            ))}
          </Row>
          
          {posts.isLoading && (
            <div className="text-center my-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading posts...</span>
              </div>
            </div>
          )}
          
          {posts.data && posts.data.results?.length === 0 && (
            <div className="text-center my-4">
              <p className="text-muted">No posts yet. Create your first post!</p>
            </div>
          )}
        </Col>
      </Row>
    </Layout>
  );
}

export default Home;