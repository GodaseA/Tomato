import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  ImagePlus,
  Loader2,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import api from "../../api/axios";
import { uploadImage } from "../../api/uploadImage";

/* ---------- constants ---------- */

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const EMPTY_FORM = {
  name: "",
  description: "",
  email: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  postalCode: "",
};

const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-orange-600 focus:ring-1 focus:ring-orange-600 disabled:bg-stone-100 disabled:text-stone-500";

/* ---------- helpers ---------- */

const validateImage = (file) => {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Please choose a JPG, PNG or WebP image.";
  }
  if (file.size > MAX_SIZE) {
    return "This image is larger than 5 MB. Please choose a smaller one.";
  }
  return "";
};

// Works whether the API returns the address nested or flat.
const toFormState = (restaurant) => {
  const address = restaurant.address || {};
  return {
    name: restaurant.name ?? "",
    description: restaurant.description ?? "",
    email: restaurant.email ?? "",
    phone: restaurant.phone ?? "",
    street: address.street ?? restaurant.street ?? "",
    city: address.city ?? restaurant.city ?? "",
    state: address.state ?? restaurant.state ?? "",
    postalCode: address.postalCode ?? restaurant.postalCode ?? "",
  };
};

const toPayload = (form) => ({
  name: form.name.trim(),
  description: form.description.trim(),
  email: form.email.trim(),
  phone: form.phone.trim(),
  address: {
    street: form.street.trim(),
    city: form.city.trim(),
    state: form.state.trim(),
    postalCode: form.postalCode.trim(),
  },
});

const getErrorMessage = (err, fallback) => {
  if (err.response?.data?.message) return err.response.data.message;
  if (!err.response && err.request) {
    return "We couldn't reach the server. Check your internet connection and try again.";
  }
  return fallback;
};

/* ---------- small components ---------- */

function Spinner({ size = 18, className = "" }) {
  return (
    <Loader2
      size={size}
      aria-hidden="true"
      className={`animate-spin motion-reduce:animate-pulse ${className}`}
    />
  );
}

/* Success / error message with an icon and a dismiss button */
function Notice({ type, title, children, onDismiss }) {
  const isSuccess = type === "success";
  const Icon = isSuccess ? CheckCircle2 : AlertCircle;
  const tone = isSuccess
    ? "border-green-200 bg-green-50 text-green-900"
    : "border-red-200 bg-red-50 text-red-900";
  const iconTone = isSuccess ? "text-green-600" : "text-red-600";

  return (
    <div
      role={isSuccess ? "status" : "alert"}
      className={`flex items-start gap-3 rounded-lg border p-4 ${tone}`}
    >
      <Icon size={20} className={`mt-0.5 shrink-0 ${iconTone}`} />
      <div className="min-w-0 flex-1 text-sm leading-6">
        <p className="font-semibold">{title}</p>
        {children && <div className="mt-0.5">{children}</div>}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss message"
        className="shrink-0 rounded p-1 opacity-60 hover:opacity-100"
      >
        <X size={16} />
      </button>
    </div>
  );
}

/* Label + input/textarea pair */
function Field({ label, id, as: Tag = "input", className = "", required, ...props }) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-stone-700"
      >
        {label}
        {required && " *"}
      </label>
      <Tag id={id} name={id} required={required} className={inputClass} {...props} />
    </div>
  );
}

function Section({ id, title, hint, children }) {
  return (
    <section id={id}>
      <h2 className="font-serif text-xl font-bold text-stone-900">{title}</h2>
      <p className="mb-5 mt-1 text-sm text-stone-500">{hint}</p>
      {children}
    </section>
  );
}

/* Square drag-and-drop image box. Shows the current photo until a new one is chosen. */
function ImageDropzone({ file, currentUrl, onSelect, onRemove, error, disabled }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const shownUrl = previewUrl || currentUrl;

  const openPicker = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleFiles = (files) => {
    const picked = files?.[0];
    if (picked) onSelect(picked);
  };

  const borderTone = error
    ? "border-red-400 bg-red-50"
    : dragging
      ? "border-orange-600 bg-orange-50"
      : "border-stone-300 bg-stone-50 hover:border-stone-400";

  return (
    <div className="max-w-[260px]">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload restaurant image"
        aria-describedby="image-help"
        aria-disabled={disabled}
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPicker();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled) handleFiles(e.dataTransfer.files);
        }}
        className={`relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 ${borderTone} ${
          disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"
        }`}
      >
        {shownUrl ? (
          <>
            <img
              src={shownUrl}
              alt="Restaurant"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-stone-900/75 px-3 py-2 text-xs text-white">
              <span className="truncate">{file ? file.name : "Current photo"}</span>
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
              className={`mx-auto ${dragging ? "text-orange-600" : "text-stone-400"}`}
            />
            <p className="mt-3 text-sm font-semibold text-stone-700">
              {dragging ? "Drop the image here" : "Drag and drop your photo"}
            </p>
            <p className="mt-1 text-xs text-stone-500">
              or{" "}
              <span className="font-semibold text-orange-700 underline">
                browse files
              </span>
            </p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = ""; // lets the same file be chosen again
          }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        <p id="image-help" className="text-xs text-stone-500">
          JPG, PNG or WebP, up to 5 MB.
        </p>
        {file && !disabled && (
          <button
            type="button"
            onClick={onRemove}
            className="flex items-center gap-1 text-xs font-semibold text-red-700 hover:underline"
          >
            <Trash2 size={13} />
            Undo
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

export default function RestaurantDetailUpdate() {
  const navigate = useNavigate();
  const noticeRef = useRef(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [currentImage, setCurrentImage] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imageError, setImageError] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [stage, setStage] = useState("idle"); // idle | uploading | saving
  const [notice, setNotice] = useState(null); // { type, title, message }

  const submitting = stage !== "idle";

  const loadRestaurant = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const { data } = await api.get("/owner/restaurant/me");
      setForm(toFormState(data.restaurant));
      setCurrentImage(data.restaurant.image || "");
    } catch (err) {
      setLoadError(
        getErrorMessage(err, "Unable to load your restaurant details.")
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRestaurant();
  }, [loadRestaurant]);

  // Bring the result message into view after submitting.
  useEffect(() => {
    if (notice) {
      noticeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [notice]);

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setNotice(null);

    // A photo is required, but an existing one counts.
    if (!imageFile && !currentImage) {
      setImageError("Add a photo of your restaurant to continue.");
      document
        .getElementById("image-section")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const payload = toPayload(form);

    try {
      if (imageFile) {
        setStage("uploading");
        const uploaded = await uploadImage(imageFile, "restaurant");
        payload.image = uploaded.image;
        payload.imagePublicId = uploaded.imagePublicId;
      }

      setStage("saving");
      const { data } = await api.patch("/owner/restaurant/updateDetails", payload);

      setCurrentImage(data.restaurant?.image || payload.image || currentImage);
      setImageFile(null);
      setNotice({
        type: "success",
        title: "Details updated",
        message: data.message || "Your restaurant details have been saved.",
      });
    } catch (err) {
      setNotice({
        type: "error",
        title: "We couldn't save your changes",
        message: getErrorMessage(err, "Something went wrong. Please try again."),
      });
    } finally {
      setStage("idle");
    }
  };

  /* ----- loading / load error ----- */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 bg-stone-50 text-stone-500">
        <Spinner size={22} className="text-orange-600" />
        <p className="text-sm font-medium">Loading your restaurant…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 p-5">
        <div className="max-w-md rounded-xl border border-stone-200 bg-white p-8 text-center">
          <p role="alert" className="text-stone-700">
            {loadError}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <button
              onClick={loadRestaurant}
              className="rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-700"
            >
              Try again
            </button>
            <button
              onClick={() => navigate(-1)}
              className="rounded-lg border border-stone-300 px-5 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ----- form ----- */

  const buttonLabel = {
    idle: "Save changes",
    uploading: "Uploading photo…",
    saving: "Saving details…",
  }[stage];

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-10 text-stone-800 sm:py-14">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 text-sm font-medium text-stone-600 hover:text-stone-900"
        >
          ← Go back
        </button>

        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <div className="border-b border-stone-200 px-6 py-8 sm:px-10">
            <h1 className="font-serif text-3xl font-bold text-stone-900 sm:text-4xl">
              Update your restaurant
            </h1>
            <p className="mt-3 max-w-xl leading-7 text-stone-600">
              Change your photo, contact details or address. Updates show to
              customers as soon as they are saved.
            </p>
          </div>

          <form onSubmit={handleSubmit} aria-busy={submitting}>
            {/* fieldset locks every input while the request is running */}
            <fieldset
              disabled={submitting}
              className="m-0 min-w-0 space-y-9 border-0 p-6 sm:p-10"
            >
              <Section
                id="image-section"
                title="Restaurant photo"
                hint={
                  currentImage
                    ? "Add a new photo to replace the current one, or leave it as is."
                    : "Required. Customers see this photo next to your restaurant name."
                }
              >
                <ImageDropzone
                  file={imageFile}
                  currentUrl={currentImage}
                  onSelect={handleImageSelect}
                  onRemove={handleImageRemove}
                  error={imageError}
                  disabled={submitting}
                />
              </Section>

              <div className="border-t border-stone-200" />

              <Section
                title="Restaurant details"
                hint="How customers can learn about and reach you."
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    className="sm:col-span-2"
                    label="Restaurant name"
                    id="name"
                    value={form.name}
                    onChange={updateField}
                    placeholder="e.g. Mauli Food Corner"
                    minLength={2}
                    maxLength={150}
                    required
                  />
                  <Field
                    className="sm:col-span-2"
                    as="textarea"
                    label="Description"
                    id="description"
                    value={form.description}
                    onChange={updateField}
                    placeholder="Describe your food and specialties"
                    rows={3}
                    maxLength={1000}
                  />
                  <Field
                    label="Restaurant email"
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={updateField}
                    placeholder="restaurant@example.com"
                    maxLength={254}
                  />
                  <Field
                    label="Contact number"
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={updateField}
                    placeholder="Enter contact number"
                    minLength={7}
                    maxLength={20}
                    required
                  />
                </div>
              </Section>

              <div className="border-t border-stone-200" />

              <Section
                title="Restaurant address"
                hint="Where customers can find your restaurant."
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    className="sm:col-span-2"
                    label="Street address"
                    id="street"
                    value={form.street}
                    onChange={updateField}
                    placeholder="Building, road, area"
                    minLength={2}
                    maxLength={200}
                    required
                  />
                  <Field
                    label="City"
                    id="city"
                    value={form.city}
                    onChange={updateField}
                    placeholder="City"
                    minLength={2}
                    maxLength={100}
                    required
                  />
                  <Field
                    label="State"
                    id="state"
                    value={form.state}
                    onChange={updateField}
                    placeholder="State"
                    minLength={2}
                    maxLength={100}
                    required
                  />
                  <Field
                    label="Postal code"
                    id="postalCode"
                    value={form.postalCode}
                    onChange={updateField}
                    placeholder="Postal code"
                    minLength={4}
                    maxLength={12}
                    required
                  />
                </div>
              </Section>

              {/* result message, right above the button so it can't be missed */}
              <div ref={noticeRef} className="scroll-mt-6 space-y-4">
                {notice && (
                  <Notice
                    type={notice.type}
                    title={notice.title}
                    onDismiss={() => setNotice(null)}
                  >
                    {notice.message}
                  </Notice>
                )}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="submit"
                    className="flex flex-1 items-center justify-center gap-2.5 rounded-lg bg-orange-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:cursor-not-allowed disabled:opacity-80"
                  >
                    {submitting && <Spinner />}
                    {buttonLabel}
                  </button>

                  {notice?.type === "success" && (
                    <button
                      type="button"
                      onClick={() => navigate(-1)}
                      className="rounded-lg border border-stone-300 px-5 py-3.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                    >
                      Done
                    </button>
                  )}
                </div>
              </div>
            </fieldset>
          </form>
        </div>
      </div>
    </div>
  );
}