import React from "react";
import { Card, Button, Image } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

function ProfileCard(props) {
  const navigate = useNavigate();

  // 1️⃣ Get the user object from props
  const { user } = props;

  // 2️⃣ Function to navigate to the user's profile page
  const handleNavigateToProfile = () => {
    navigate(`/profile/${user.id}/`);
  };

  return (
    <Card className="border-0 p-2">
      <div className="d-flex align-items-center">
        
        {/* User avatar */}
        <Image
          src={user.avatar}
          roundedCircle
          width={48}
          height={48}
          className="my-3 border border-primary border-2"
        />

        {/* User info */}
        <Card.Body>
          <Card.Title className="fs-6">
            {user.name}
          </Card.Title>

          <Button
            variant="primary"
            onClick={handleNavigateToProfile}
          >
            See profile
          </Button>
        </Card.Body>

      </div>
    </Card>
  );
}

export default ProfileCard;
