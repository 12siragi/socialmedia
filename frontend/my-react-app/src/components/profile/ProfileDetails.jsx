import React from "react";
import { Button, Image, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import useUserActions from "../../hooks/user.actions";

function ProfileDetails({ user }) {
  const navigate = useNavigate();
  const { getUser } = useUserActions();

  // Loading state
  if (!user) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  // Safe avatar with default
  const avatarUrl = user.avatar || "/default-avatar.png";

  // Safe values with fallback
  const fullName = user.full_name || "(No name)";
  const bio = user.bio || "(No bio yet)";
  const postsCount = user.posts_count ?? 0;

  return (
    <div>
      <div className="d-flex flex-row border-bottom p-5">
        <Image
          src={avatarUrl}
          alt={fullName}
          roundedCircle
          width={120}
          height={120}
          className="me-5 border border-primary border-2"
        />
        <div className="d-flex flex-column justify-content-start align-self-center mt-2">
          <p className="fs-4 m-0">{fullName}</p>
          <p className="fs-5">{bio}</p>
          <p className="fs-6">
            <small>{postsCount} posts</small>
          </p>
          <Button
            variant="primary"
            size="sm"
            className="w-auto"
            onClick={() => navigate(`/profile/${user.id}/edit/`)}
          >
            Edit
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ProfileDetails;
