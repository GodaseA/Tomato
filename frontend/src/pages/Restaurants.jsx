
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, MapPin, UtensilsCrossed } from "lucide-react";
import api from "../api/axios";

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const { data } = await api.get("/restaurants", {
          params: { search, city },
        });

        if (active) setRestaurants(data.restaurants);
      } catch {
        if (active) setError("Could not load restaurants. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search, city]);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2 text-xl font-extrabold">
            <UtensilsCrossed className="text-orange-500" />
            Foodie<span className="text-orange-500">Express</span>
          </Link>

          <Link to="/" className="text-sm font-semibold text-slate-600 hover:text-orange-600">
            Home
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-10">
        <p className="font-semibold text-orange-600">EXPLORE FOOD</p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
          Discover restaurants
        </h1>
        <p className="mt-3 text-slate-500">
          Find a restaurant and explore its menu.
        </p>

        <div className="mt-7 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_220px]">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4">
            <Search size={19} className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search restaurants..."
              aria-label="Search restaurants"
              className="w-full py-3 outline-none"
            />
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4">
            <MapPin size={19} className="text-orange-500" />
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Filter by city"
              aria-label="Filter by city"
              className="w-full py-3 outline-none"
            />
          </div>
        </div>

        {loading && (
          <p className="py-12 text-center text-slate-500">
            Finding restaurants...
          </p>
        )}

        {error && (
          <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">
            {error}
          </p>
        )}

        {!loading && !error && restaurants.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <UtensilsCrossed className="mx-auto text-orange-400" size={36} />
            <h2 className="mt-4 text-xl font-bold text-slate-800">
              No restaurants found
            </h2>
            <p className="mt-2 text-slate-500">
              Try another name or city, or check back later.
            </p>
          </div>
        )}

        {!loading && restaurants.length > 0 && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((restaurant) => (
              <article
                key={restaurant._id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                {restaurant.image ? (
                  <img
                    src={restaurant.image}
                    alt={restaurant.name}
                    loading="lazy"
                    className="h-48 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-48 items-center justify-center bg-orange-50">
                    <UtensilsCrossed size={42} className="text-orange-400" />
                  </div>
                )}

                <div className="p-5">
                  <h2 className="text-xl font-bold text-slate-900">
                    {restaurant.name}
                  </h2>

                  <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                    {restaurant.description || "Explore our delicious menu."}
                  </p>

                  <p className="mt-3 flex items-center gap-1 text-sm text-slate-500">
                    <MapPin size={15} />
                    {restaurant.address?.city}, {restaurant.address?.state}
                  </p>

                  <Link
                    to={`/restaurants/${restaurant._id}`}
                    className="mt-5 block rounded-xl bg-orange-500 px-4 py-3 text-center font-bold text-white transition hover:bg-orange-600"
                  >
                    View menu
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
