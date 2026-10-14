
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  MapPin,
  Plus,
  Search,
  ShoppingBag,
  UtensilsCrossed,
} from "lucide-react";
import api from "../api/axios";
import { useCart } from "../context/CartContext";

export default function RestaurantMenu() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const { items: cart, count: cartCount, subtotal, addItem, updateQuantity } = useCart();

  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [cartMessage, setCartMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadMenu = async () => {
      setLoading(true);
      setError("");

      try {
        const { data } = await api.get(
          `/restaurants/${restaurantId}/menu`
        );

        if (!active) return;

        setRestaurant(data.restaurant);
        setMenuItems(data.menuItems);
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Unable to load this restaurant's menu."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadMenu();

    return () => {
      active = false;
    };
  }, [restaurantId]);

  const categories = useMemo(
    () => ["All", ...new Set(menuItems.map((item) => item.category))],
    [menuItems]
  );

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory =
        category === "All" || item.category === category;

      const matchesSearch = item.name
        .toLowerCase()
        .includes(search.trim().toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [menuItems, category, search]);

  const addToCart = (menuItem) => {
    const added = addItem(menuItem, restaurant);
    if (!added) {
      setCartMessage("Your cart already contains items from another restaurant. Complete or clear that cart first.");
      return;
    }
    setCartMessage("");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-semibold text-orange-600">Loading menu...</p>
      </main>
    );
  }

  if (error || !restaurant) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow">
          <p role="alert" className="text-slate-700">
            {error || "Restaurant not found."}
          </p>
          <Link
            to="/restaurants"
            className="mt-5 inline-block rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white"
          >
            Back to restaurants
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-12">
      <header className="border-b bg-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link
            to="/restaurants"
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-orange-600"
          >
            <ArrowLeft size={18} />
            All restaurants
          </Link>

          <Link
            to="/"
            className="flex items-center gap-2 font-extrabold text-slate-900"
          >
            <UtensilsCrossed className="text-orange-500" />
            FoodieExpress
          </Link>

          <div className="flex items-center gap-2 rounded-xl bg-orange-50 px-3 py-2 text-sm font-bold text-orange-600">
            <ShoppingBag size={18} />
            {cartCount}
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 to-red-500 p-7 text-white sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-wider text-orange-100">
            Explore the menu
          </p>

          <h1 className="mt-2 text-3xl font-extrabold sm:text-5xl">
            {restaurant.name}
          </h1>

          <p className="mt-3 max-w-2xl text-orange-50">
            {restaurant.description || "Discover your next favourite meal."}
          </p>

          <div className="mt-5 flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-2">
              <MapPin size={16} />
              {restaurant.address?.city}, {restaurant.address?.state}
            </span>
            <span className="flex items-center gap-2">
              <Clock size={16} />
              Preparation times shown per dish
            </span>
          </div>
        </div>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_320px]">
          <section>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4">
              <Search size={18} className="text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search dishes..."
                aria-label="Search dishes"
                className="w-full py-3.5 outline-none"
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {categories.map((itemCategory) => (
                <button
                  key={itemCategory}
                  onClick={() => setCategory(itemCategory)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    category === itemCategory
                      ? "bg-orange-500 text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-orange-300"
                  }`}
                >
                  {itemCategory}
                </button>
              ))}
            </div>

            <h2 className="mt-7 text-2xl font-extrabold text-slate-900">
              Our menu
            </h2>

            {filteredItems.length === 0 ? (
              <p className="mt-5 rounded-xl bg-white p-8 text-center text-slate-500">
                No dishes found in this category.
              </p>
            ) : (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {filteredItems.map((item) => (
                  <article
                    key={item._id}
                    className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                        className="h-44 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-44 items-center justify-center bg-orange-50">
                        <UtensilsCrossed
                          size={36}
                          className="text-orange-400"
                        />
                      </div>
                    )}

                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-bold text-slate-900">
                          {item.name}
                        </h3>

                        <span
                          className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${
                            item.foodType === "non-vegetarian"
                              ? "bg-red-50 text-red-700"
                              : item.foodType === "vegan"
                              ? "bg-green-50 text-green-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {item.foodType}
                        </span>
                      </div>

                      <p className="mt-2 flex-1 text-sm leading-6 text-slate-500">
                        {item.description || "Prepared fresh to order."}
                      </p>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-lg font-extrabold text-slate-900">
                            ₹{Number(item.price).toFixed(2)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {item.preparationTime} min
                          </p>
                        </div>

                        <button
                          onClick={() => addToCart(item)}
                          className="flex items-center gap-1 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600"
                        >
                          <Plus size={16} />
                          Add
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-5">
            <div className="flex items-center gap-2">
              <ShoppingBag className="text-orange-500" />
              <h2 className="text-xl font-extrabold text-slate-900">
                Your cart
              </h2>
              <span className="ml-auto rounded-full bg-orange-100 px-2.5 py-1 text-xs font-bold text-orange-700">
                {cartCount} items
              </span>
            </div>

            {cart.length === 0 ? (
              <div className="py-10 text-center">
                <ShoppingBag className="mx-auto text-slate-300" size={36} />
                <p className="mt-3 font-semibold text-slate-700">
                  Your cart is empty
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Add a dish to get started.
                </p>
              </div>
            ) : (
              <>
                <div className="mt-5 space-y-4">
                  {cart.map((item) => (
                    <div key={item._id} className="flex justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {item.name}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>

                      <div className="flex h-8 shrink-0 items-center gap-3 rounded-lg border border-slate-200 px-2">
                        <button
                          aria-label={`Remove one ${item.name}`}
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                          className="font-bold text-slate-600"
                        >
                          −
                        </button>
                        <span className="text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          aria-label={`Add one ${item.name}`}
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          className="font-bold text-orange-600"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 border-t border-slate-200 pt-4">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Delivery fees and taxes will be calculated at checkout.
                  </p>
                  <button
                    onClick={() => navigate("/checkout")}
                    className="mt-5 w-full rounded-xl bg-orange-500 px-4 py-3 font-bold text-white transition hover:bg-orange-600"
                  >
                    Proceed to checkout
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}
