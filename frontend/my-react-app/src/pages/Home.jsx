import React from "react";
import { Row, Col, Image } from "react-bootstrap";
import Layout from "../components/Layout";
import { randomAvatar } from "../components/utils";
import useUserActions from "../hooks/user.actions";
import CreatePost from "../components/posts/CreatePost";
import usePosts from "../hooks/usePosts";
import Post from "../components/posts/Post";

function Home() {
  const { posts, refresh, isLoading } = usePosts();
  const { getUser } = useUserActions();
  const user = getUser();

  if (!user) {
    return (
      <Layout>
        <div className="text-center mt-5">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Row className="justify-content-center">
        <Col sm={7}>
          <Row className="border rounded align-items-center p-3">
            <Col xs="auto">
              <Image src={randomAvatar()} roundedCircle width={64} />
            </Col>
            <Col>
              <CreatePost refresh={refresh} />
            </Col>
          </Row>

          {isLoading && <p className="text-center mt-3">Loading posts...</p>}

          {posts.map((post) => (
            <Post key={post.id} post={post} refresh={refresh} />
          ))}
        </Col>
      </Row>
    </Layout>
  );
}

export default Home;
