
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  UserRound,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  UtensilsCrossed,
} from "lucide-react";
import api from "../api/axios";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (form.password.length < 12) {
      setError("Password must contain at least 12 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...payload } = form;
      const { data } = await api.post("/auth/register", payload);

      const role = data.user.role;

      if (role === "admin") navigate("/admin");
      else if (role === "restaurant") navigate("/restaurant");
      else navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to create your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-orange-50/60 p-4">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl md:grid-cols-2">
        <section className="hidden flex-col justify-between bg-gradient-to-br from-orange-500 to-red-600 p-10 text-white md:flex">
          <Link to="/" className="flex items-center gap-2 text-2xl font-extrabold">
            <UtensilsCrossed size={28} />
            FoodieExpress
          </Link>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em]">
              Join our food community
            </p>
            <h1 className="mt-3 text-4xl font-extrabold leading-tight">
              Great meals make great moments.
            </h1>
            <p className="mt-4 leading-7 text-orange-50">
              Create your account to explore restaurants, discover new dishes,
              and enjoy convenient delivery.
            </p>
            <div className="mt-8 space-y-3 text-sm">
              <p>✓ Discover restaurants near you</p>
              <p>✓ Track your orders</p>
              <p>✓ Save your favourite meals</p>
            </div>
          </div>

          <p className="text-sm text-orange-100">
            Your next meal starts here.
          </p>
        </section>

        <section className="p-7 sm:p-10 lg:p-12">
          <Link to="/" className="flex items-center gap-2 text-xl font-extrabold text-slate-900 md:hidden">
            <UtensilsCrossed className="text-orange-500" />
            Foodie<span className="text-orange-500">Express</span>
          </Link>

          <div className="mt-7 md:mt-2">
            <p className="text-sm font-semibold text-orange-600">GET STARTED</p>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900">
              Create your account
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Fill in your details to join FoodieExpress.
            </p>
          </div>

          {error && (
            <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-semibold text-slate-700">
                Full name
              </label>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-100">
                <UserRound size={18} className="text-slate-400" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  minLength={2}
                  maxLength={100}
                  className="w-full py-3 text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
                Email address
              </label>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-100">
                <Mail size={18} className="text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  maxLength={254}
                  className="w-full py-3 text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
                Password
              </label>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-100">
                <LockKeyhole size={18} className="text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 12 characters"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={12}
                  maxLength={128}
                  className="w-full py-3 text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold text-slate-700">
                Confirm password
              </label>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-100">
                <LockKeyhole size={18} className="text-slate-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  maxLength={128}
                  className="w-full py-3 text-sm outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-orange-500 py-3.5 font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="font-bold text-orange-600 hover:text-orange-700">
              Login
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
