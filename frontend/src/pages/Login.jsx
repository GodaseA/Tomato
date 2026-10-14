
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, LockKeyhole, Eye, EyeOff, UtensilsCrossed } from "lucide-react";
import api from "../api/axios";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await api.post("/auth/login", form);
      const role = data.user.role;

      if (role === "admin") navigate("/admin");
      else if (role === "restaurant") navigate("/restaurant/dashboard");
      else navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to log in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-orange-50/60 flex items-center justify-center p-4">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl md:grid-cols-2">
        <section className="hidden flex-col justify-between bg-gradient-to-br from-orange-500 to-red-600 p-10 text-white md:flex">
          <Link to="/" className="flex items-center gap-2 text-2xl font-extrabold">
            <UtensilsCrossed size={28} />
            FoodieExpress
          </Link>

          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em]">
              Good food, good mood
            </p>
            <h1 className="text-4xl font-extrabold leading-tight">
              Your next favourite meal is just a few clicks away.
            </h1>
            <p className="mt-4 max-w-sm text-orange-50">
              Discover restaurants, order delicious food, and follow your
              delivery from kitchen to doorstep.
            </p>
          </div>

          <p className="text-sm text-orange-100">
            Fresh meals. Easy ordering. Happy eating.
          </p>
        </section>

        <section className="p-7 sm:p-10 lg:p-14">
          <Link to="/" className="flex items-center gap-2 text-xl font-extrabold text-slate-900 md:hidden">
            <UtensilsCrossed className="text-orange-500" />
            Foodie<span className="text-orange-500">Express</span>
          </Link>

          <div className="mt-8 md:mt-4">
            <p className="text-sm font-semibold text-orange-600">WELCOME BACK</p>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900">
              Login to your account
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Enter your details to continue ordering.
            </p>
          </div>

          {error && (
            <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
                Email address
              </label>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 transition focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-100">
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
                  className="w-full py-3.5 text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
                Password
              </label>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 transition focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-100">
                <LockKeyhole size={18} className="text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  maxLength={128}
                  className="w-full py-3.5 text-sm outline-none"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-orange-500 py-3.5 font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-500">
            Don't have an account?{" "}
            <Link to="/register" className="font-bold text-orange-600 hover:text-orange-700">
              Register
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
