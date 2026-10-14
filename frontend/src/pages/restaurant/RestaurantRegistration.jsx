import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

const initialForm = {
  name: "",
  description: "",
  email: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  postalCode: "",
  image: "",
};

const statusStyles = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  suspended: "bg-gray-200 text-gray-800",
};

export default function RestaurantRegistration() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
    setSubmitting(true);
    setError("");
    setSuccess("");

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      image: form.image.trim(),
      address: {
        street: form.street.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        postalCode: form.postalCode.trim(),
      },
    };

    try {
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
    }
  };

  const inputClass =
    "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100";

  const labelClass = "mb-2 block text-sm font-semibold text-gray-700";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading your application...</p>
      </div>
    );
  }

  if (restaurant) {
    const status = restaurant.status;
    const statusMessage = {
      pending:
        "Your application is waiting for admin review. You can access restaurant management after approval.",
      approved:
        "Congratulations! Your restaurant has been approved.",
      rejected:
        "Your restaurant application was rejected.",
      suspended:
        "Your restaurant is currently suspended. Please contact the administrator.",
    };

    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <button
            onClick={() => navigate("/")}
            className="mb-6 text-sm font-medium text-gray-600 hover:text-orange-600"
          >
            ← Back to home
          </button>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-10">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-2xl">
              🏪
            </div>

            <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">
              Restaurant registration
            </p>

            <h1 className="mt-2 text-3xl font-bold text-gray-900">
              {restaurant.name}
            </h1>

            <div className="mt-5">
              <span
                className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold capitalize ${
                  statusStyles[status] || "bg-gray-100 text-gray-700"
                }`}
              >
                {status}
              </span>
            </div>

            <p className="mt-5 leading-7 text-gray-600">
              {statusMessage[status] ||
                "Please contact the administrator for an update."}
            </p>

            {status === "rejected" && restaurant.rejectionReason && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="font-semibold text-red-800">
                  Reason for rejection
                </p>
                <p className="mt-1 text-sm text-red-700">
                  {restaurant.rejectionReason}
                </p>
              </div>
            )}

            <div className="mt-8 grid gap-4 border-t border-gray-100 pt-6 sm:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500">Contact number</p>
                <p className="mt-1 font-medium text-gray-900">
                  {restaurant.phone}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="mt-1 break-words font-medium text-gray-900">
                  {restaurant.email || "Not provided"}
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-sm text-gray-500">Address</p>
                <p className="mt-1 font-medium text-gray-900">
                  {[
                    restaurant.address?.street,
                    restaurant.address?.city,
                    restaurant.address?.state,
                    restaurant.address?.postalCode,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            </div>

            {status === "approved" && (
              <button
                onClick={() => navigate("/restaurant/dashboard")}
                className="mt-8 w-full rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white transition hover:bg-orange-600 sm:w-auto"
              >
                Open restaurant dashboard →
              </button>
            )}

            <button
              onClick={loadMyApplication}
              className="mt-4 w-full rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 sm:ml-3 sm:w-auto"
            >
              Refresh status
            </button>

            {error && (
              <p className="mt-4 text-sm text-red-600">{error}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => navigate("/")}
          className="mb-6 text-sm font-medium text-gray-600 hover:text-orange-600"
        >
          ← Back to home
        </button>

        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-8 text-white sm:px-10 sm:py-10">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-3xl">
              🏪
            </div>
            <p className="text-sm font-semibold uppercase tracking-widest text-orange-50">
              Partner with us
            </p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              Register your restaurant
            </h1>
            <p className="mt-3 max-w-xl leading-6 text-orange-50">
              Submit your restaurant details to get started. Your application
              will be reviewed by our admin before you can manage your store.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 p-6 sm:p-10">
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700"
              >
                {success}
              </div>
            )}

            <section>
              <h2 className="text-lg font-bold text-gray-900">
                Restaurant details
              </h2>
              <p className="mb-5 mt-1 text-sm text-gray-500">
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

                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="image">
                    Restaurant image URL
                  </label>
                  <input
                    id="image"
                    name="image"
                    type="url"
                    value={form.image}
                    onChange={updateField}
                    className={inputClass}
                    placeholder="https://example.com/restaurant.jpg"
                    maxLength={2000}
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Enter a publicly accessible image URL. File uploads are not
                    configured in this form.
                  </p>
                </div>
              </div>
            </section>

            <div className="border-t border-gray-100" />

            <section>
              <h2 className="text-lg font-bold text-gray-900">
                Restaurant address
              </h2>
              <p className="mb-5 mt-1 text-sm text-gray-500">
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

            <div className="rounded-xl bg-orange-50 p-4 text-sm leading-6 text-orange-900">
              <strong>What happens next?</strong>
              <p className="mt-1">
                Your application will be marked as Pending. You can manage your
                restaurant only after an administrator approves it.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-orange-500 px-5 py-3.5 font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Submitting application..." : "Submit application"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
 