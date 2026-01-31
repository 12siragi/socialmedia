// src/components/profile/ProfileCard.jsx
import React, { useState } from "react";
import { Image } from "react-bootstrap";
import { Link } from "react-router-dom";

function ProfileCard({ user }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleFollow = (e) => {
    e.preventDefault();
    // TODO: Implement follow/unfollow API call
    setIsFollowing(!isFollowing);
  };

  return (
    <div 
      className="d-flex align-items-center justify-content-between"
      style={{
        padding: '0.75rem',
        borderRadius: '8px',
        backgroundColor: isHovered ? '#2d3348' : 'transparent',
        transition: 'background-color 0.2s ease'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Left side - Avatar and Info */}
      <Link 
        to={`/profile/${user.id}/`} 
        className="d-flex align-items-center gap-2 text-decoration-none flex-grow-1"
        style={{ minWidth: 0 }}
      >
        <Image
          src={user.avatar || `https://ui-avatars.com/api/?name=${user.first_name}+${user.last_name}&background=8b5cf6&color=fff`}
          roundedCircle
          width={44}
          height={44}
          style={{
            border: '2px solid #8b5cf6',
            objectFit: 'cover',
            flexShrink: 0
          }}
        />
        <div style={{ minWidth: 0, flex: 1 }}>
          <p 
            className="mb-0 text-white fw-semibold text-truncate"
            style={{ fontSize: '0.9rem' }}
          >
            {user.first_name} {user.last_name}
          </p>
          <small 
            className="text-truncate d-block"
            style={{ color: '#8e8e93', fontSize: '0.8rem' }}
          >
            @{user.username || user.email?.split('@')[0]}
          </small>
        </div>
      </Link>

      {/* Right side - Follow Button */}
      <button
        onClick={handleFollow}
        className="btn btn-sm px-3 fw-semibold"
        style={{
          backgroundColor: isFollowing ? 'transparent' : '#8b5cf6',
          border: isFollowing ? '1px solid #8b5cf6' : 'none',
          color: isFollowing ? '#8b5cf6' : '#fff',
          borderRadius: '6px',
          fontSize: '0.85rem',
          padding: '0.4rem 0.75rem',
          transition: 'all 0.2s ease',
          flexShrink: 0,
          marginLeft: '0.5rem'
        }}
        onMouseEnter={(e) => {
          if (isFollowing) {
            e.target.style.backgroundColor = '#8b5cf6';
            e.target.style.color = '#fff';
          } else {
            e.target.style.backgroundColor = '#7c3aed';
          }
        }}
        onMouseLeave={(e) => {
          if (isFollowing) {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.color = '#8b5cf6';
          } else {
            e.target.style.backgroundColor = '#8b5cf6';
          }
        }}
      >
        {isFollowing ? 'Following' : 'Follow'}
      </button>
    </div>
  );
}

export default ProfileCard;