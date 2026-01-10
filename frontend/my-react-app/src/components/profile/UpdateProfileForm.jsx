import React, { useState, useContext } from "react";
import { Form, Button, Image, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import useUserActions from "../../hooks/user.actions";
import { Context } from "../Layout";

function UpdateProfileForm({ profile }) {
  const navigate = useNavigate();
  const userActions = useUserActions();
  const { setToaster } = useContext(Context);

  // ✅ Logged-in user (SOURCE OF TRUTH)
  const currentUser = userActions.getUser();

  const [validated, setValidated] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    first_name: profile.first_name || "",
    last_name: profile.last_name || "",
    bio: profile.bio || "",
  });

  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const updateForm = event.currentTarget;

    if (updateForm.checkValidity() === false) {
      event.stopPropagation();
      setValidated(true);
      return;
    }

    setValidated(true);

    const formData = new FormData();
    formData.append("first_name", form.first_name);
    formData.append("last_name", form.last_name);
    formData.append("bio", form.bio);

    if (avatar) {
      formData.append("avatar", avatar);
    }

    try {
      // ✅ UPDATE ONLY AUTHENTICATED USER
      await userActions.updateUser(currentUser.id, formData);

      setToaster({
        type: "success",
        title: "Profile updated",
        message: "Profile updated successfully 🚀",
        show: true,
      });

      navigate(-1);
    } catch (err) {
      console.error(err);
      setError("Failed to update profile");
    }
  };

  return (
    <Form
      className="border p-4 rounded"
      noValidate
      validated={validated}
      onSubmit={handleSubmit}
    >
      {/* Avatar */}
      <Form.Group className="mb-3 d-flex flex-column">
        <Form.Label className="text-center">Avatar</Form.Label>

        <Image
          src={avatarPreview}
          roundedCircle
          width={120}
          height={120}
          className="m-2 border border-primary border-2 align-self-center"
        />

        <Form.Control
          type="file"
          size="sm"
          className="w-50 align-self-center"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              setAvatar(file);
              setAvatarPreview(URL.createObjectURL(file));
            }
          }}
        />
      </Form.Group>

      {/* First name */}
      <Form.Group className="mb-3">
        <Form.Label>First name</Form.Label>
        <Form.Control
          required
          type="text"
          value={form.first_name}
          onChange={(e) =>
            setForm({ ...form, first_name: e.target.value })
          }
        />
        <Form.Control.Feedback type="invalid">
          First name is required
        </Form.Control.Feedback>
      </Form.Group>

      {/* Last name */}
      <Form.Group className="mb-3">
        <Form.Label>Last name</Form.Label>
        <Form.Control
          required
          type="text"
          value={form.last_name}
          onChange={(e) =>
            setForm({ ...form, last_name: e.target.value })
          }
        />
        <Form.Control.Feedback type="invalid">
          Last name is required
        </Form.Control.Feedback>
      </Form.Group>

      {/* Bio */}
      <Form.Group className="mb-3">
        <Form.Label>Bio</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          value={form.bio}
          onChange={(e) =>
            setForm({ ...form, bio: e.target.value })
          }
        />
      </Form.Group>

      {error && <Alert variant="danger">{error}</Alert>}

      <Button variant="primary" type="submit">
        Save changes
      </Button>
    </Form>
  );
}

export default UpdateProfileForm;
