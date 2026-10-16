
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UtensilsCrossed, LogOut, MapPin, Search, LayoutDashboard, LucideIceCreamBowl,   } from "lucide-react";
import api from "../api/axios";

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    api.get("/auth/me")
      .then(({ data }) => setUser(data.user))
      .catch(() => setUser(null));
  }, []);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setUser(null);
      navigate("/login");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2 text-xl font-extrabold text-slate-900">
            <UtensilsCrossed className="text-orange-500" />
            Foodie<span className="text-orange-500">Express</span>
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                {user.role === "user" ?
                <Link to="/restaurants" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  <LucideIceCreamBowl size={16} /> <span className="hidden sm:inline">Restaurants near you</span>
                </Link>:<></>}

                <Link to={user.role === "user" ? "/dashboard" : user.role === "restaurant" ? "/restaurant/dashboard" : "/admin"} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  <LayoutDashboard size={16} /> <span className="hidden sm:inline">Dashboard</span>
                </Link>
                {/* <span className="hidden text-sm text-slate-600 sm:block">
                  Hi, {user.name}
                </span> */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-3 py-2 text-sm font-semibold text-slate-700">
                  Login
                </Link>
                <Link to="/register" className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600">
                  Register
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:py-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-700">
            <MapPin size={16} />
            Your food journey starts here
          </span>

          <h1 className="mt-6 text-4xl font-extrabold leading-tight text-slate-900 sm:text-6xl">
            Delicious food,
            <span className="block text-orange-500">delivered to you.</span>
          </h1>

          <p className="mt-5 max-w-lg leading-7 text-slate-600">
            Discover great restaurants, explore your favourite meals, and enjoy
            convenient food delivery.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/restaurants" className="flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3.5 font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600">
              <Search size={18} />
              Explore restaurants
            </Link>

            {
              !user ?
                <Link to="/register" className="rounded-xl border border-slate-300 bg-white px-6 py-3.5 font-bold text-slate-700 hover:bg-slate-100">
                  Create account
                </Link>
                :
               <>{user.role =="user" && (
               <Link to="/restaurant/register" className="rounded-xl border border-slate-300 bg-white px-6 py-3.5 font-bold text-slate-700 hover:bg-slate-100">
                  register your restaurant
                </Link>
            )}</>
            }

            {/* {!user && (
              
            )} */}
          </div>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-orange-100 to-red-100 p-8 sm:p-12">
          <div className="rounded-2xl bg-white p-6 shadow-xl">
            <p className="text-sm font-semibold text-orange-600">FOODIE FAVOURITE</p>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900">
              Good food. Great mood.
            </h2>
            <p className="mt-3 leading-6 text-slate-600">
              Sign in to your account to get started with your food delivery
              experience.
            </p>
            <div className="mt-6 flex gap-3">
              <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">Fresh</span>
              <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700">Tasty</span>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">Easy</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
