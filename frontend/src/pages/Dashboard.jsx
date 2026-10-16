
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { uploadImage } from "../api/uploadImage.js";

export default function Dashboard() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [profilePreview, setProfilePreview] = useState("");

  const handleProfileImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setImageUploading(true);
    setProfilePreview(URL.createObjectURL(file));
    try {
      await uploadImage(file, "profile");
      await refreshUser();
      setProfilePreview("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not upload profile image.");
      setProfilePreview("");
    } finally {
      setImageUploading(false);
      event.target.value = "";
    }
  };

  const handleLogout = async () => {
    setError("");
    setSubmitting(true);

    try {
      await logout();
      navigate("/login", { replace: true });
    } catch {
      setError(
        "Logout could not be confirmed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="dashboard-page">
      <section className="dashboard-card">
        <div className="brand-mark">FD</div>
        <div className="profile-image-control">
          {profilePreview || user?.profileImage ? (
            <img src={profilePreview || user.profileImage} alt="Profile" className="mx-auto mb-3 h-24 w-24 rounded-full object-cover" />
          ) : (
            <div className="mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded-full bg-orange-100 text-2xl font-bold text-orange-700">
              {(user?.name || "U").charAt(0).toUpperCase()}
            </div>
          )}
          <label className="inline-block cursor-pointer rounded-lg border px-4 py-2 text-sm">
            {imageUploading ? "Uploading..." : "Upload profile photo"}
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleProfileImage} disabled={imageUploading} className="hidden" />
          </label>
          <p className="mt-1 text-xs text-gray-500">JPG, PNG or WebP, up to 5 MB</p>
        </div>
        <h1>Welcome, {user?.name}!</h1>
        <p>You are successfully logged in.</p>

        <div className="user-details">
          <p>
            <strong>Email:</strong> {user?.email}
          </p>
          <p>
            <strong>Role:</strong> {user?.role}
          </p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button onClick={handleLogout} disabled={submitting}>
          {submitting ? "Logging out..." : "Log out"}
        </button>
      </section>
    </main>
  );
}
