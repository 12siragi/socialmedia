import React from "react";
import { Row, Col, Image } from "react-bootstrap";
import Layout from "../components/Layout";
import { randomAvatar } from "../components/utils";
import useUserActions from "../hooks/user.actions";
import CreatePost from "../components/posts/CreatePost";
import usePosts from "../hooks/usePosts";
import Post from "../components/posts/Post";
import ProfileCard from "../components/profile/ProfileCard";
import useSWR from "swr";
import axiosService from "../components/helpers/axios";

const fetcher = (url) =>
  axiosService.get(url).then((res) => res.data);

function Home() {
  const { posts, refresh, isLoading } = usePosts();
  const { getUser } = useUserActions();
  const user = getUser();

  const profiles = useSWR("/api/auth/user/?page=1", fetcher);


  if (!user) {
    return (
      <Layout>
        <div className="text-center mt-5">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Row className="justify-content-evenly">

        <Col sm={7}>
          <Row className="border rounded align-items-center p-3">
            <Col xs="auto">
              <Image src={randomAvatar()} roundedCircle width={64} />
            </Col>
            <Col>
              <CreatePost refresh={refresh} />
            </Col>
          </Row>

          {isLoading && (
            <p className="text-center mt-3">Loading posts...</p>
          )}

          {posts.map((post) => (
            <Post key={post.id} post={post} refresh={refresh} />
          ))}
        </Col>

        <Col sm={3} className="border rounded py-4 h-50">
          <h4 className="fw-bold text-center">
            Suggested people
          </h4>

          <div className="d-flex flex-column">
            {profiles.data &&
              profiles.data.results.map((profile) => (
                <ProfileCard
                  key={profile.id}
                  user={profile}
                />
              ))}
          </div>
        </Col>

      </Row>
    </Layout>
  );
}

export default Home;
