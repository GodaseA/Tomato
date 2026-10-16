import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  MapPin,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import api from "../api/axios";
import { useCart } from "../context/CartContext";

/* ---------- helpers ---------- */

// Picks the first photo field that exists on the restaurant document.
const getRestaurantPhoto = (r) =>
  r?.image || r?.photo || r?.logo || r?.coverImage || r?.imageUrl || "";

const formatPrice = (value) => `₹${Number(value).toFixed(2)}`;

/* Image that falls back to an icon when the src is missing or fails to load */
function Photo({ src, alt, className = "", icon: Icon = UtensilsCrossed, iconSize = 28 }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-stone-100 text-stone-400 ${className}`}
        role="img"
        aria-label={alt}
      >
        <Icon size={iconSize} strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}

/* Veg / non-veg mark, the same square-with-dot used on packaged food in India */
function FoodMark({ foodType }) {
  const nonVeg = foodType === "non-vegetarian";
  const tone = nonVeg ? "border-red-700" : "border-green-700";
  const dot = nonVeg ? "bg-red-700" : "bg-green-700";

  return (
    <span
      title={foodType}
      aria-label={foodType}
      className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border-2 ${tone}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
    </span>
  );
}

/* Stepper shown once an item is already in the cart */
function Stepper({ quantity, name, onChange }) {
  return (
    <div className="flex h-9 items-center rounded-lg border border-orange-600 bg-white text-orange-700 shadow-sm">
      <button
        aria-label={`Remove one ${name}`}
        onClick={() => onChange(quantity - 1)}
        className="flex h-full w-8 items-center justify-center rounded-l-lg hover:bg-orange-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-600"
      >
        <Minus size={14} />
      </button>
      <span className="w-6 text-center text-sm font-semibold tabular-nums">
        {quantity}
      </span>
      <button
        aria-label={`Add one ${name}`}
        onClick={() => onChange(quantity + 1)}
        className="flex h-full w-8 items-center justify-center rounded-r-lg hover:bg-orange-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-600"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

/* ---------- page ---------- */

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
        const { data } = await api.get(`/restaurants/${restaurantId}/menu`);
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
    () => [...new Set(menuItems.map((item) => item.category))],
    [menuItems]
  );

  // Menu grouped by category, so every dish is visible under a clear heading.
  const sections = useMemo(() => {
    const term = search.trim().toLowerCase();

    return categories
      .filter((cat) => category === "All" || cat === category)
      .map((cat) => ({
        name: cat,
        items: menuItems.filter(
          (item) =>
            item.category === cat && item.name.toLowerCase().includes(term)
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [menuItems, categories, category, search]);

  const visibleCount = sections.reduce((n, s) => n + s.items.length, 0);

  const quantityById = useMemo(() => {
    const map = new Map();
    cart.forEach((c) => map.set(c._id, c.quantity));
    return map;
  }, [cart]);

  const addToCart = (menuItem) => {
    const added = addItem(menuItem, restaurant);
    if (!added) {
      setCartMessage(
        "Your cart already has items from another restaurant. Complete or clear that cart first."
      );
      return;
    }
    setCartMessage("");
  };

  /* ----- loading / error ----- */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50">
        <p className="text-sm font-medium text-stone-500">Loading menu…</p>
      </main>
    );
  }

  if (error || !restaurant) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50 p-5">
        <div className="max-w-md rounded-xl border border-stone-200 bg-white p-8 text-center">
          <p role="alert" className="text-stone-700">
            {error || "Restaurant not found."}
          </p>
          <Link
            to="/restaurants"
            className="mt-5 inline-block rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-700"
          >
            Back to restaurants
          </Link>
        </div>
      </main>
    );
  }

  const location = [restaurant.address?.city, restaurant.address?.state]
    .filter(Boolean)
    .join(", ");

  /* ----- page ----- */

  return (
    <main className="min-h-screen bg-stone-50 pb-28 text-stone-800 lg:pb-12">
      {/* top bar */}
      <nav className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <Link
            to="/restaurants"
            className="flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900"
          >
            <ArrowLeft size={18} />
            All restaurants
          </Link>

          <Link to="/" className="flex items-center gap-2 font-bold text-stone-900">
            <UtensilsCrossed size={20} className="text-orange-600" />
            FoodieExpress
          </Link>

          <div
            className="flex items-center gap-2 text-sm font-semibold text-stone-700"
            aria-label={`${cartCount} items in cart`}
          >
            <ShoppingBag size={18} />
            {cartCount}
          </div>
        </div>
      </nav>

      {/* restaurant header: photo + name together */}
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8 sm:flex-row sm:items-center sm:py-10">
          <Photo
            src={getRestaurantPhoto(restaurant)}
            alt={restaurant.name}
            icon={Store}
            iconSize={44}
            className="h-28 w-28 shrink-0 rounded-2xl border border-stone-200 sm:h-36 sm:w-36"
          />

          <div className="min-w-0">
            <h1 className="font-serif text-3xl font-bold leading-tight text-stone-900 sm:text-4xl">
              {restaurant.name}
            </h1>

            <p className="mt-2 max-w-xl leading-7 text-stone-600">
              {restaurant.description || "Discover your next favourite meal."}
            </p>

            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-stone-500">
              {location && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={16} />
                  {location}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock size={16} />
                Preparation time shown on each dish
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl items-start gap-10 px-5 lg:grid-cols-[1fr_320px]">
        {/* menu column */}
        <section className="min-w-0">
          {/* search + category filter */}
          <div className="sticky top-0 z-10 -mx-5 border-b border-stone-200 bg-stone-50/95 px-5 py-4 backdrop-blur">
            <div className="flex items-center gap-3 rounded-lg border border-stone-300 bg-white px-3.5 focus-within:border-orange-600 focus-within:ring-1 focus-within:ring-orange-600">
              <Search size={18} className="text-stone-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search dishes"
                aria-label="Search dishes"
                className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-stone-400"
              />
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {["All", ...categories].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  aria-pressed={category === cat}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    category === cat
                      ? "bg-stone-900 text-white"
                      : "border border-stone-300 bg-white text-stone-600 hover:border-stone-500"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {cartMessage && (
            <p
              role="alert"
              className="mt-5 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            >
              {cartMessage}
            </p>
          )}

          {visibleCount === 0 ? (
            <div className="mt-8 rounded-xl border border-dashed border-stone-300 bg-white p-10 text-center">
              <p className="font-semibold text-stone-700">No dishes found</p>
              <p className="mt-1 text-sm text-stone-500">
                Try a different name or choose another category.
              </p>
            </div>
          ) : (
            sections.map((section) => (
              <div key={section.name} className="mt-9">
                <div className="flex items-baseline gap-3 border-b border-stone-200 pb-3">
                  <h2 className="font-serif text-2xl font-bold text-stone-900">
                    {section.name}
                  </h2>
                  <span className="text-sm text-stone-500">
                    {section.items.length}{" "}
                    {section.items.length === 1 ? "dish" : "dishes"}
                  </span>
                </div>

                <div className="mt-2 grid gap-x-8 md:grid-cols-2">
                  {section.items.map((item) => {
                    const qty = quantityById.get(item._id) || 0;

                    return (
                      <article
                        key={item._id}
                        className="flex gap-4 border-b border-stone-200 py-5"
                      >
                        <div className="flex min-w-0 flex-1 gap-3">
                          <FoodMark foodType={item.foodType} />

                          <div className="min-w-0">
                            <h3 className="font-semibold leading-snug text-stone-900">
                              {item.name}
                            </h3>
                            <p className="mt-1 font-semibold text-stone-800">
                              {formatPrice(item.price)}
                            </p>
                            <p className="mt-2 line-clamp-3 text-sm leading-6 text-stone-500">
                              {item.description || "Prepared fresh to order."}
                            </p>
                            <p className="mt-2 flex items-center gap-1 text-xs text-stone-400">
                              <Clock size={12} />
                              {item.preparationTime} min
                            </p>
                          </div>
                        </div>

                        {/* photo with Add button resting on its bottom edge */}
                        <div className="relative h-28 w-28 shrink-0">
                          <Photo
                            src={item.image}
                            alt={item.name}
                            className="h-28 w-28 rounded-xl"
                          />
                          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                            {qty > 0 ? (
                              <Stepper
                                quantity={qty}
                                name={item.name}
                                onChange={(q) => updateQuantity(item._id, q)}
                              />
                            ) : (
                              <button
                                onClick={() => addToCart(item)}
                                className="flex h-9 items-center gap-1 rounded-lg border border-stone-300 bg-white px-5 text-sm font-bold text-orange-700 shadow-sm hover:border-orange-600 hover:bg-orange-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-600"
                              >
                                Add
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </section>

        {/* cart (desktop) */}
        <aside className="hidden rounded-xl border border-stone-200 bg-white p-5 lg:sticky lg:top-5 lg:mt-6 lg:block">
          <div className="flex items-center justify-between border-b border-stone-200 pb-4">
            <h2 className="font-serif text-xl font-bold text-stone-900">
              Your cart
            </h2>
            <span className="text-sm text-stone-500">
              {cartCount} {cartCount === 1 ? "item" : "items"}
            </span>
          </div>

          {cart.length === 0 ? (
            <div className="py-10 text-center">
              <ShoppingBag className="mx-auto text-stone-300" size={32} strokeWidth={1.5} />
              <p className="mt-3 font-semibold text-stone-700">Your cart is empty</p>
              <p className="mt-1 text-sm text-stone-500">
                Add a dish to get started.
              </p>
            </div>
          ) : (
            <>
              <ul className="divide-y divide-stone-100">
                {cart.map((item) => (
                  <li key={item._id} className="flex items-center justify-between gap-3 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-stone-800">
                        {item.name}
                      </p>
                      <p className="mt-0.5 text-sm text-stone-500">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                    <Stepper
                      quantity={item.quantity}
                      name={item.name}
                      onChange={(q) => updateQuantity(item._id, q)}
                    />
                  </li>
                ))}
              </ul>

              <div className="border-t border-stone-200 pt-4">
                <div className="flex justify-between font-semibold text-stone-900">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <p className="mt-2 text-xs text-stone-500">
                  Delivery fee and taxes are added at checkout.
                </p>
                <button
                  onClick={() => navigate("/checkout")}
                  className="mt-5 w-full rounded-lg bg-orange-600 px-4 py-3 text-sm font-bold text-white hover:bg-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
                >
                  Go to checkout
                </button>
              </div>
            </>
          )}
        </aside>
      </div>

      {/* cart bar (mobile / tablet) */}
      {cartCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white p-3 lg:hidden">
          <button
            onClick={() => navigate("/checkout")}
            className="flex w-full items-center justify-between rounded-lg bg-orange-600 px-5 py-3.5 text-sm font-bold text-white hover:bg-orange-700"
          >
            <span>
              {cartCount} {cartCount === 1 ? "item" : "items"} · {formatPrice(subtotal)}
            </span>
            <span>Go to checkout</span>
          </button>
        </div>
      )}
    </main>
  );
}