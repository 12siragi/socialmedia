import React from "react";
import { useParams } from "react-router-dom";
import useSWR from "swr";
import { Row, Col, Spinner, Alert } from "react-bootstrap";

import Layout from "../components/Layout";
import UpdateProfileForm from "../components/profile/UpdateProfileForm";
import axiosService from "../components/helpers/axios";

// SWR fetcher
const fetcher = (url) => axiosService.get(url).then((res) => res.data);

function EditProfile() {
  const { profileId } = useParams();

  const { data, error, isLoading } = useSWR(
    `/api/auth/user/${profileId}/`,
    fetcher
  );

  if (isLoading) {
    return (
      <Layout hasNavigationBack>
        <div className="text-center mt-5">
          <Spinner animation="border" />
          <p>Loading profile...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout hasNavigationBack>
        <Alert variant="danger">
          Failed to load profile
        </Alert>
      </Layout>
    );
  }

  return (
    <Layout hasNavigationBack>
      <Row className="justify-content-center">
        <Col lg={8}>
          <UpdateProfileForm profile={data} />
        </Col>
      </Row>
    </Layout>
  );
}

export default EditProfile;
