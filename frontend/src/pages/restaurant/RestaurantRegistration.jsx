import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ImagePlus, RefreshCw, Store, Trash2 } from "lucide-react";
import api from "../../api/axios";
import { uploadImage } from "../../api/uploadImage";

const initialForm = {
  name: "",
  description: "",
  email: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  postalCode: "",
};

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const statusStyles = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  suspended: "bg-stone-200 text-stone-800",
};

/* Returns an error message, or "" when the file is acceptable. */
const validateImage = (file) => {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Please choose a JPG, PNG or WebP image.";
  }
  if (file.size > MAX_SIZE) {
    return "This image is larger than 5 MB. Please choose a smaller one.";
  }
  return "";
};

/* ---------- square drag-and-drop image box ---------- */

function ImageDropzone({ file, onSelect, onRemove, error }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  // Build a preview URL for the chosen file and release it when it changes.
  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const openPicker = () => inputRef.current?.click();

  const handleFiles = (files) => {
    const picked = files?.[0];
    if (picked) onSelect(picked);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPicker();
    }
  };

  const borderTone = error
    ? "border-red-400 bg-red-50"
    : dragging
    ? "border-orange-600 bg-orange-50"
    : "border-stone-300 bg-stone-50 hover:border-stone-400";

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload restaurant image"
        aria-describedby="image-help"
        onClick={openPicker}
        onKeyDown={handleKeyDown}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative flex aspect-square w-full max-w-[260px] cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 ${borderTone}`}
      >
        {previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt="Selected restaurant"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-stone-900/75 px-3 py-2 text-xs text-white">
              <span className="truncate">{file.name}</span>
              <span className="flex shrink-0 items-center gap-1 font-semibold">
                <RefreshCw size={12} />
                Replace
              </span>
            </div>
          </>
        ) : (
          <div className="px-5 text-center">
            <ImagePlus
              size={34}
              strokeWidth={1.5}
              className={dragging ? "mx-auto text-orange-600" : "mx-auto text-stone-400"}
            />
            <p className="mt-3 text-sm font-semibold text-stone-700">
              {dragging ? "Drop the image here" : "Drag and drop your photo"}
            </p>
            <p className="mt-1 text-xs text-stone-500">
              or <span className="font-semibold text-orange-700 underline">browse files</span>
            </p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = ""; // lets the same file be chosen again
          }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 max-w-[260px]">
        <p id="image-help" className="text-xs text-stone-500">
          JPG, PNG or WebP, up to 5 MB.
        </p>
        {file && (
          <button
            type="button"
            onClick={onRemove}
            className="flex items-center gap-1 text-xs font-semibold text-red-700 hover:underline"
          >
            <Trash2 size={13} />
            Remove
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

/* ---------- page ---------- */

export default function RestaurantRegistration() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [imageFile, setImageFile] = useState(null);
  const [imageError, setImageError] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = (file) => {
    const problem = validateImage(file);
    if (problem) {
      setImageError(problem);
      return;
    }
    setImageError("");
    setImageFile(file);
  };

  const handleImageRemove = () => {
    setImageFile(null);
    setImageError("");
  };

  const loadMyApplication = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/owner/restaurant/me");
      setRestaurant(response.data.restaurant);
    } catch (err) {
      if (err.response?.status === 404) {
        setRestaurant(null);
      } else {
        setError(
          err.response?.data?.message ||
            "Unable to load your restaurant application."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyApplication();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    // The restaurant image is mandatory.
    if (!imageFile) {
      setImageError("Add a photo of your restaurant to continue.");
      document
        .getElementById("image-section")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSubmitting(true);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      image: "",
      imagePublicId: "",
      address: {
        street: form.street.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        postalCode: form.postalCode.trim(),
      },
    };

    try {
      setImageUploading(true);
      const uploaded = await uploadImage(imageFile, "restaurant");
      payload.image = uploaded.image;
      payload.imagePublicId = uploaded.imagePublicId;
      setImageUploading(false);

      const response = await api.post("/owner/restaurant", payload);

      setRestaurant(response.data.restaurant);
      setSuccess(
        response.data.message ||
          "Your application has been submitted successfully."
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not submit your application. Please try again."
      );

      if (err.response?.data?.restaurant) {
        setRestaurant(err.response.data.restaurant);
      }
    } finally {
      setSubmitting(false);
      setImageUploading(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-orange-600 focus:ring-1 focus:ring-orange-600";

  const labelClass = "mb-1.5 block text-sm font-medium text-stone-700";

  /* ----- loading ----- */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <p className="text-sm font-medium text-stone-500">
          Loading your application…
        </p>
      </div>
    );
  }

  /* ----- existing application ----- */

  if (restaurant) {
    const status = restaurant.status;
    const statusMessage = {
      pending:
        "Your application is waiting for admin review. You can access restaurant management after approval.",
      approved: "Congratulations! Your restaurant has been approved.",
      rejected: "Your restaurant application was rejected.",
      suspended:
        "Your restaurant is currently suspended. Please contact the administrator.",
    };

    return (
      <div className="min-h-screen bg-stone-50 px-4 py-12 text-stone-800">
        <div className="mx-auto max-w-3xl">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 text-sm font-medium text-stone-600 hover:text-stone-900"
          >
            ← Back to home
          </button>

          <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-10">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              {restaurant.image ? (
                <img
                  src={restaurant.image}
                  alt={restaurant.name}
                  className="h-24 w-24 shrink-0 rounded-2xl border border-stone-200 object-cover"
                />
              ) : (
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-stone-200 bg-stone-100 text-stone-400">
                  <Store size={36} strokeWidth={1.5} />
                </div>
              )}

              <div className="min-w-0">
                <h1 className="font-serif text-3xl font-bold text-stone-900">
                  {restaurant.name}
                </h1>
                <span
                  className={`mt-3 inline-flex rounded-full px-3.5 py-1 text-sm font-semibold capitalize ${
                    statusStyles[status] || "bg-stone-100 text-stone-700"
                  }`}
                >
                  {status}
                </span>
              </div>
            </div>

            <p className="mt-6 leading-7 text-stone-600">
              {statusMessage[status] ||
                "Please contact the administrator for an update."}
            </p>

            {status === "rejected" && restaurant.rejectionReason && (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="font-semibold text-red-800">
                  Reason for rejection
                </p>
                <p className="mt-1 text-sm text-red-700">
                  {restaurant.rejectionReason}
                </p>
              </div>
            )}

            <dl className="mt-8 grid gap-5 border-t border-stone-200 pt-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-stone-500">Contact number</dt>
                <dd className="mt-1 font-medium text-stone-900">
                  {restaurant.phone}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-stone-500">Email</dt>
                <dd className="mt-1 break-words font-medium text-stone-900">
                  {restaurant.email || "Not provided"}
                </dd>
              </div>

              <div className="sm:col-span-2">
                <dt className="text-sm text-stone-500">Address</dt>
                <dd className="mt-1 font-medium text-stone-900">
                  {[
                    restaurant.address?.street,
                    restaurant.address?.city,
                    restaurant.address?.state,
                    restaurant.address?.postalCode,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </dd>
              </div>
            </dl>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {status === "approved" && (
                <button
                  onClick={() => navigate("/restaurant/dashboard")}
                  className="rounded-lg bg-orange-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-700"
                >
                  Open restaurant dashboard
                </button>
              )}

              <button
                onClick={loadMyApplication}
                className="rounded-lg border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
              >
                Refresh status
              </button>
            </div>

            {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  /* ----- registration form ----- */

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-10 text-stone-800 sm:py-14">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => navigate("/")}
          className="mb-6 text-sm font-medium text-stone-600 hover:text-stone-900"
        >
          ← Back to home
        </button>

        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <div className="border-b border-stone-200 px-6 py-8 sm:px-10">
            <h1 className="font-serif text-3xl font-bold text-stone-900 sm:text-4xl">
              Register your restaurant
            </h1>
            <p className="mt-3 max-w-xl leading-7 text-stone-600">
              Submit your restaurant details to get started. An admin reviews
              every application before you can manage your store.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-9 p-6 sm:p-10" noValidate={false}>
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700"
              >
                {success}
              </div>
            )}

            {/* restaurant image */}
            <section id="image-section">
              <h2 className="font-serif text-xl font-bold text-stone-900">
                Restaurant photo
              </h2>
              <p className="mb-4 mt-1 text-sm text-stone-500">
                Required. Customers see this photo next to your restaurant name.
              </p>

              <ImageDropzone
                file={imageFile}
                onSelect={handleImageSelect}
                onRemove={handleImageRemove}
                error={imageError}
              />
            </section>

            <div className="border-t border-stone-200" />

            {/* details */}
            <section>
              <h2 className="font-serif text-xl font-bold text-stone-900">
                Restaurant details
              </h2>
              <p className="mb-5 mt-1 text-sm text-stone-500">
                Tell us about your restaurant.
              </p>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="name">
                    Restaurant name *
                  </label>
                  <input
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={updateField}
                    className={inputClass}
                    placeholder="e.g. Mauli Food Corner"
                    minLength={2}
                    maxLength={150}
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="description">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={form.description}
                    onChange={updateField}
                    className={inputClass}
                    placeholder="Describe your food and specialties"
                    rows={3}
                    maxLength={1000}
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="email">
                    Restaurant email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={updateField}
                    className={inputClass}
                    placeholder="restaurant@example.com"
                    maxLength={254}
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="phone">
                    Contact number *
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={updateField}
                    className={inputClass}
                    placeholder="Enter contact number"
                    minLength={7}
                    maxLength={20}
                    required
                  />
                </div>
              </div>
            </section>

            <div className="border-t border-stone-200" />

            {/* address */}
            <section>
              <h2 className="font-serif text-xl font-bold text-stone-900">
                Restaurant address
              </h2>
              <p className="mb-5 mt-1 text-sm text-stone-500">
                Provide the location of your restaurant.
              </p>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="street">
                    Street address *
                  </label>
                  <input
                    id="street"
                    name="street"
                    value={form.street}
                    onChange={updateField}
                    className={inputClass}
                    placeholder="Building, road, area"
                    minLength={2}
                    maxLength={200}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="city">
                    City *
                  </label>
                  <input
                    id="city"
                    name="city"
                    value={form.city}
                    onChange={updateField}
                    className={inputClass}
                    placeholder="City"
                    minLength={2}
                    maxLength={100}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="state">
                    State *
                  </label>
                  <input
                    id="state"
                    name="state"
                    value={form.state}
                    onChange={updateField}
                    className={inputClass}
                    placeholder="State"
                    minLength={2}
                    maxLength={100}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="postalCode">
                    Postal code *
                  </label>
                  <input
                    id="postalCode"
                    name="postalCode"
                    value={form.postalCode}
                    onChange={updateField}
                    className={inputClass}
                    placeholder="Postal code"
                    minLength={4}
                    maxLength={12}
                    required
                  />
                </div>
              </div>
            </section>

            <div className="rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-700">
              <p className="font-semibold text-stone-900">What happens next?</p>
              <p className="mt-1">
                Your application is marked as Pending. You can manage your
                restaurant once an administrator approves it.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-orange-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {imageUploading
                ? "Uploading image…"
                : submitting
                ? "Submitting application…"
                : "Submit application"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}