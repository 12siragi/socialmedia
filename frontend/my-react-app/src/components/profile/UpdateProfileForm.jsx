// src/components/profile/UpdateProfileForm.jsx
import React, { useState, useContext } from "react";
import { Form, Button, Image, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import useUserActions from "../../hooks/user.actions";
import { Context } from "../Layout";

function UpdateProfileForm({ profile }) {
  const navigate = useNavigate();
  const userActions = useUserActions();
  const { setToaster } = useContext(Context);

  const currentUser = userActions.getUser();

  const [validated, setValidated] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    first_name: profile.first_name || "",
    last_name: profile.last_name || "",
    bio: profile.bio || "",
    location: profile.location || "",
    website: profile.website || "",
  });

  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(
    profile.avatar || `https://ui-avatars.com/api/?name=${profile.first_name}+${profile.last_name}&background=8b5cf6&color=fff&size=200`
  );

  const [coverPhoto, setCoverPhoto] = useState(null);
  const [coverPhotoPreview, setCoverPhotoPreview] = useState(profile.cover_photo);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const updateForm = event.currentTarget;

    if (updateForm.checkValidity() === false) {
      event.stopPropagation();
      setValidated(true);
      return;
    }

    setValidated(true);
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append("first_name", form.first_name);
    formData.append("last_name", form.last_name);
    formData.append("bio", form.bio);
    formData.append("location", form.location);
    formData.append("website", form.website);

    if (avatar) {
      formData.append("avatar", avatar);
    }

    if (coverPhoto) {
      formData.append("cover_photo", coverPhoto);
    }

    try {
      await userActions.updateUser(currentUser.id, formData);

      setToaster({
        type: "success",
        title: "Profile updated",
        message: "Your profile has been updated successfully! 🚀",
        show: true,
      });

      navigate(`/profile/${currentUser.id}/`);
    } catch (err) {
      console.error("Failed to update profile:", err);
      setError(
        err.response?.data?.detail || 
        "Failed to update profile. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const bioCharacterLimit = 160;
  const bioCharactersRemaining = bioCharacterLimit - form.bio.length;

  return (
    <div
      className="rounded-3 p-4"
      style={{
        backgroundColor: '#1a1d2e',
        border: '1px solid #2d3348'
      }}
    >
      <h4 className="text-white mb-4 pb-3" style={{ borderBottom: '1px solid #2d3348' }}>
        Edit Profile
      </h4>

      <Form
        noValidate
        validated={validated}
        onSubmit={handleSubmit}
      >
        {/* Cover Photo Section */}
        <Form.Group className="mb-4">
          <Form.Label className="text-white mb-2">Cover Photo</Form.Label>
          <div
            className="position-relative rounded-3 overflow-hidden"
            style={{
              height: '200px',
              background: coverPhotoPreview 
                ? `url(${coverPhotoPreview})` 
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              border: '1px solid #2d3348'
            }}
          >
            <div 
              className="position-absolute bottom-0 end-0 m-3"
            >
              <label
                className="btn btn-sm px-3"
                style={{
                  backgroundColor: 'rgba(26, 29, 46, 0.9)',
                  border: '1px solid #8b5cf6',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                <svg 
                  width="16" 
                  height="16" 
                  fill="currentColor" 
                  viewBox="0 0 16 16"
                  style={{ marginRight: '0.5rem' }}
                >
                  <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                  <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z"/>
                </svg>
                Change Cover
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setCoverPhoto(file);
                      setCoverPhotoPreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </label>
            </div>
          </div>
        </Form.Group>

        {/* Avatar Section */}
        <Form.Group className="mb-4">
          <Form.Label className="text-white mb-3">Profile Picture</Form.Label>
          <div className="d-flex align-items-center gap-4">
            <div className="position-relative">
              <Image
                src={avatarPreview}
                roundedCircle
                width={120}
                height={120}
                style={{
                  border: '4px solid #8b5cf6',
                  objectFit: 'cover'
                }}
              />
              <label
                className="position-absolute bottom-0 end-0 btn btn-sm rounded-circle p-2"
                style={{
                  backgroundColor: '#8b5cf6',
                  border: '2px solid #1a1d2e',
                  cursor: 'pointer'
                }}
              >
                <svg width="16" height="16" fill="white" viewBox="0 0 16 16">
                  <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/>
                </svg>
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setAvatar(file);
                      setAvatarPreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </label>
            </div>
            <div>
              <p className="text-white mb-1 fw-semibold">Profile Photo</p>
              <small style={{ color: '#8e8e93' }}>
                JPG, PNG or GIF. Max size 2MB.
              </small>
            </div>
          </div>
        </Form.Group>

        <hr style={{ borderColor: '#2d3348', margin: '2rem 0' }} />

        {/* Name Fields */}
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label className="text-white">First Name</Form.Label>
              <Form.Control
                required
                type="text"
                placeholder="Enter first name"
                value={form.first_name}
                onChange={(e) =>
                  setForm({ ...form, first_name: e.target.value })
                }
                style={{
                  backgroundColor: '#2d3348',
                  border: '1px solid #3d4358',
                  color: '#fff',
                  borderRadius: '8px'
                }}
              />
              <Form.Control.Feedback type="invalid">
                First name is required
              </Form.Control.Feedback>
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label className="text-white">Last Name</Form.Label>
              <Form.Control
                required
                type="text"
                placeholder="Enter last name"
                value={form.last_name}
                onChange={(e) =>
                  setForm({ ...form, last_name: e.target.value })
                }
                style={{
                  backgroundColor: '#2d3348',
                  border: '1px solid #3d4358',
                  color: '#fff',
                  borderRadius: '8px'
                }}
              />
              <Form.Control.Feedback type="invalid">
                Last name is required
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
        </Row>

        {/* Bio */}
        <Form.Group className="mb-3">
          <Form.Label className="text-white">Bio</Form.Label>
          <Form.Control
            as="textarea"
            rows={4}
            placeholder="Tell us about yourself..."
            value={form.bio}
            maxLength={bioCharacterLimit}
            onChange={(e) =>
              setForm({ ...form, bio: e.target.value })
            }
            style={{
              backgroundColor: '#2d3348',
              border: '1px solid #3d4358',
              color: '#fff',
              borderRadius: '8px',
              resize: 'none'
            }}
          />
          <div className="d-flex justify-content-between mt-1">
            <Form.Text style={{ color: '#8e8e93', fontSize: '0.85rem' }}>
              Brief description for your profile
            </Form.Text>
            <small 
              style={{ 
                color: bioCharactersRemaining < 20 ? '#ef4444' : '#6b7280',
                fontSize: '0.85rem'
              }}
            >
              {bioCharactersRemaining} / {bioCharacterLimit}
            </small>
          </div>
        </Form.Group>

        {/* Location */}
        <Form.Group className="mb-3">
          <Form.Label className="text-white">
            <svg 
              width="16" 
              height="16" 
              fill="currentColor" 
              viewBox="0 0 16 16"
              style={{ marginRight: '0.5rem' }}
            >
              <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
            </svg>
            Location
          </Form.Label>
          <Form.Control
            type="text"
            placeholder="City, Country"
            value={form.location}
            onChange={(e) =>
              setForm({ ...form, location: e.target.value })
            }
            style={{
              backgroundColor: '#2d3348',
              border: '1px solid #3d4358',
              color: '#fff',
              borderRadius: '8px'
            }}
          />
        </Form.Group>

        {/* Website */}
        <Form.Group className="mb-4">
          <Form.Label className="text-white">
            <svg 
              width="16" 
              height="16" 
              fill="currentColor" 
              viewBox="0 0 16 16"
              style={{ marginRight: '0.5rem' }}
            >
              <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm7.5-6.923c-.67.204-1.335.82-1.887 1.855-.173.324-.33.682-.468 1.068C5.145 5.26 5 6.62 5 8a12.5 12.5 0 0 0 .145 2H7.5V1.077zM4.09 4a9.267 9.267 0 0 1 .64-1.539 6.7 6.7 0 0 1 .597-.933A7.025 7.025 0 0 0 2.255 4H4.09zm-.582 3.5c.03-.877.138-1.718.312-2.5H1.674a6.958 6.958 0 0 0-.656 2.5h2.49zM4.847 5a12.5 12.5 0 0 0-.338 2.5H7.5V5H4.847zM8.5 5v2.5h2.99a12.495 12.495 0 0 0-.337-2.5H8.5zM4.51 8.5a12.5 12.5 0 0 0 .337 2.5H7.5V8.5H4.51zm3.99 0V11h2.653c.187-.765.306-1.608.338-2.5H8.5zM5.145 12c.138.386.295.744.468 1.068.552 1.035 1.218 1.65 1.887 1.855V12H5.145zm.182 2.472a6.696 6.696 0 0 1-.597-.933A9.268 9.268 0 0 1 4.09 12H2.255a7.024 7.024 0 0 0 3.072 2.472zM3.82 11a13.652 13.652 0 0 1-.312-2.5h-2.49c.062.89.291 1.733.656 2.5H3.82zm6.853 3.472A7.024 7.024 0 0 0 13.745 12H11.91a9.27 9.27 0 0 1-.64 1.539 6.688 6.688 0 0 1-.597.933zM8.5 12v2.923c.67-.204 1.335-.82 1.887-1.855.173-.324.33-.682.468-1.068H8.5zm3.68-1h2.146c.365-.767.594-1.61.656-2.5h-2.49a13.65 13.65 0 0 1-.312 2.5zm2.802-3.5a6.959 6.959 0 0 0-.656-2.5H12.18c.174.782.282 1.623.312 2.5h2.49zM11.27 2.461c.247.464.462.98.64 1.539h1.835a7.024 7.024 0 0 0-3.072-2.472c.218.284.418.598.597.933zM10.855 4a7.966 7.966 0 0 0-.468-1.068C9.835 1.897 9.17 1.282 8.5 1.077V4h2.355z"/>
            </svg>
            Website
          </Form.Label>
          <Form.Control
            type="url"
            placeholder="https://yourwebsite.com"
            value={form.website}
            onChange={(e) =>
              setForm({ ...form, website: e.target.value })
            }
            style={{
              backgroundColor: '#2d3348',
              border: '1px solid #3d4358',
              color: '#fff',
              borderRadius: '8px'
            }}
          />
        </Form.Group>

        {/* Error Message */}
        {error && (
          <div 
            className="alert py-2 px-3 mb-3 rounded"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid #ef4444',
              color: '#ef4444',
              fontSize: '0.9rem'
            }}
          >
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="d-flex gap-2 pt-3" style={{ borderTop: '1px solid #2d3348' }}>
          <Button
            variant="secondary"
            onClick={handleCancel}
            className="px-4 py-2"
            style={{
              backgroundColor: '#2d3348',
              border: '1px solid #3d4358',
              color: '#e5e7eb',
              borderRadius: '8px'
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            className="px-4 py-2 flex-grow-1"
            style={{
              backgroundColor: '#8b5cf6',
              border: 'none',
              borderRadius: '8px'
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </Form>

      <style>{`
        input:focus,
        textarea:focus {
          background-color: #2d3348 !important;
          border-color: #8b5cf6 !important;
          color: #fff !important;
          box-shadow: 0 0 0 0.2rem rgba(139, 92, 246, 0.25) !important;
        }

        input::placeholder,
        textarea::placeholder {
          color: #6b7280 !important;
        }

        textarea::-webkit-scrollbar {
          width: 8px;
        }

        textarea::-webkit-scrollbar-track {
          background: transparent;
        }

        textarea::-webkit-scrollbar-thumb {
          background: #3d4358;
          border-radius: 4px;
        }

        textarea::-webkit-scrollbar-thumb:hover {
          background: #4d5368;
        }
      `}</style>
    </div>
  );
}

export default UpdateProfileForm;