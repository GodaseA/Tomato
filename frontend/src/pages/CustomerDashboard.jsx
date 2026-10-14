import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Clock3, CreditCard, LogOut,
  MapPin, Package, RefreshCw, Save, ShoppingBag, UserRound, UtensilsCrossed,
} from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const money = (value) => `₹${Number(value || 0).toFixed(2)}`;
const readable = (value = "") => value.replaceAll("_", " ").replace(/^\w/, (c) => c.toUpperCase());
const dateText = (value) => value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";

const statusStyle = (status) => {
  if (["delivered", "paid"].includes(status)) return "bg-emerald-50 text-emerald-700";
  if (["cancelled", "rejected", "failed"].includes(status)) return "bg-red-50 text-red-700";
  return "bg-orange-50 text-orange-700";
};

export default function CustomerDashboard() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [profile, setProfile] = useState({ name: user?.name || "", phone: user?.phone || "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [filter, setFilter] = useState("all");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    setProfile({ name: user?.name || "", phone: user?.phone || "" });
  }, [user]);

  const loadOrders = useCallback(async () => {
    setLoadingOrders(true);
    setOrdersError("");
    try {
      const { data } = await api.get("/orders/my");
      setOrders(data.orders || []);
    } catch (error) {
      setOrdersError(error.response?.data?.message || "Couldn't load your orders. Please try again.");
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const stats = useMemo(() => ({
    total: orders.length,
    active: orders.filter((order) => ["pending", "confirmed", "preparing", "ready_for_pickup", "out_for_delivery"].includes(order.status)).length,
    delivered: orders.filter((order) => order.status === "delivered").length,
    spent: orders.filter((order) => order.status !== "cancelled" && order.status !== "rejected").reduce((sum, order) => sum + Number(order.total || 0), 0),
  }), [orders]);

  const latestOrders = orders.slice(0, 3);
  const pastOrders = orders.filter((order) => {
    if (filter === "all") return true;
    if (filter === "active") return ["pending", "confirmed", "preparing", "ready_for_pickup", "out_for_delivery"].includes(order.status);
    if (filter === "completed") return order.status === "delivered";
    return ["cancelled", "rejected"].includes(order.status);
  });

  const saveProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    setProfileMessage("");
    setProfileError("");
    try {
      await api.patch("/auth/profile", { name: profile.name.trim(), phone: profile.phone.trim() });
      await refreshUser();
      setProfileMessage("Your profile has been updated.");
    } catch (error) {
      setProfileError(error.response?.data?.message || "Unable to update your profile. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await logout(); } finally { navigate("/login", { replace: true }); }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 text-lg font-black"><UtensilsCrossed className="text-orange-500" size={23} />Foodie<span className="text-orange-500">Express</span></Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/restaurants" className="hidden text-sm font-semibold text-slate-600 hover:text-orange-600 sm:inline">Browse restaurants</Link>
            <button onClick={handleLogout} disabled={loggingOut} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold hover:bg-slate-50 disabled:opacity-60"><LogOut size={16} /> <span className="hidden sm:inline">{loggingOut ? "Logging out…" : "Log out"}</span></button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-orange-600"><ArrowLeft size={16} /> Back to home</Link>
        <section className="mt-5 overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 via-orange-500 to-rose-500 p-6 text-white shadow-lg shadow-orange-500/10 sm:p-9">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div><p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-100">Customer dashboard</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Hello, {user?.name?.split(" ")[0] || "there"}! 👋</h1><p className="mt-2 max-w-xl text-sm leading-6 text-orange-50 sm:text-base">Track your orders, revisit past meals, and manage your account in one place.</p></div>
            <Link to="/restaurants" className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-5 py-3 font-extrabold text-orange-600 shadow-sm hover:bg-orange-50">Order food <ArrowRight size={17} /></Link>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
          {[{ label: "Total orders", value: stats.total, icon: ShoppingBag, note: "All-time orders" }, { label: "In progress", value: stats.active, icon: Clock3, note: "Currently active" }, { label: "Delivered", value: stats.delivered, icon: CheckCircle2, note: "Successfully completed" }, { label: "Order spend", value: money(stats.spent), icon: CreditCard, note: "Excludes cancelled orders" }].map((item) => {
            const Icon = item.icon;
            return <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="flex items-center justify-between gap-2"><span className="text-xs font-bold text-slate-500 sm:text-sm">{item.label}</span><span className="rounded-xl bg-orange-50 p-2 text-orange-600"><Icon size={18} /></span></div><p className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{item.value}</p><p className="mt-1 text-xs text-slate-400">{item.note}</p></article>;
          })}
        </section>

        <div className="mt-7 grid items-start gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.9fr)]">
          <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-black">Latest orders</h2><p className="mt-1 text-sm text-slate-500">Your three most recent orders</p></div><button onClick={loadOrders} disabled={loadingOrders} aria-label="Refresh orders" className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={17} className={loadingOrders ? "animate-spin" : ""} /></button></div>
            {loadingOrders ? <div className="py-12 text-center text-sm text-slate-500">Loading your orders…</div> : ordersError ? <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700" role="alert">{ordersError}<button onClick={loadOrders} className="ml-2 font-bold underline">Retry</button></div> : latestOrders.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed border-slate-200 px-5 py-10 text-center"><Package size={34} className="mx-auto text-slate-300" /><p className="mt-3 font-bold">No orders yet</p><p className="mt-1 text-sm text-slate-500">Your next favourite meal is waiting.</p><Link to="/restaurants" className="mt-4 inline-flex rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600">Explore restaurants</Link></div> : <div className="mt-5 space-y-3">{latestOrders.map((order) => <OrderCard key={order._id} order={order} />)}<Link to="#past-orders" onClick={() => document.getElementById("past-orders")?.scrollIntoView({ behavior: "smooth" })} className="inline-flex items-center gap-2 pt-2 text-sm font-extrabold text-orange-600 hover:text-orange-700">View all orders <ArrowRight size={16} /></Link></div>}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3"><span className="rounded-xl bg-orange-50 p-3 text-orange-600"><UserRound size={22} /></span><div><h2 className="text-xl font-black">My profile</h2><p className="text-sm text-slate-500">Manage your account details</p></div></div>
            <form onSubmit={saveProfile} className="mt-5 space-y-4">
              <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">Full name</span><input required minLength={2} maxLength={100} value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3.5 py-3 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100" /></label>
              <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">Email address</span><input value={user?.email || ""} readOnly className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-slate-500 outline-none" /><span className="mt-1 block text-xs text-slate-400">Email changes are not available here.</span></label>
              <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">Phone number</span><input type="tel" maxLength={20} value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} placeholder="Add your phone number" className="w-full rounded-xl border border-slate-200 px-3.5 py-3 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100" /></label>
              {profileMessage && <p className="rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-700">{profileMessage}</p>}
              {profileError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{profileError}</p>}
              <button type="submit" disabled={savingProfile || !profile.name.trim()} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-extrabold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"><Save size={17} />{savingProfile ? "Saving profile…" : "Save profile"}</button>
            </form>
            <div className="mt-5 flex items-start gap-3 rounded-xl bg-slate-50 p-3.5"><MapPin size={17} className="mt-0.5 shrink-0 text-orange-500" /><p className="text-xs leading-5 text-slate-500">Your delivery address is collected securely during checkout for each order.</p></div>
          </section>
        </div>

        <section id="past-orders" className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-xl font-black">Past orders</h2><p className="mt-1 text-sm text-slate-500">Your order history and payment details</p></div><div className="flex flex-wrap gap-2">{[{ value: "all", label: "All" }, { value: "active", label: "In progress" }, { value: "completed", label: "Delivered" }, { value: "cancelled", label: "Cancelled" }].map((option) => <button key={option.value} onClick={() => setFilter(option.value)} className={`rounded-full px-3.5 py-2 text-xs font-extrabold transition ${filter === option.value ? "bg-orange-500 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{option.label}</button>)}</div></div>
          {loadingOrders ? <p className="py-8 text-center text-sm text-slate-500">Loading order history…</p> : ordersError ? <p className="py-8 text-center text-sm text-red-600">Order history is temporarily unavailable.</p> : pastOrders.length === 0 ? <p className="py-10 text-center text-sm text-slate-500">No orders in this category.</p> : <div className="mt-5 grid gap-3 md:grid-cols-2">{pastOrders.map((order) => <OrderCard key={order._id} order={order} compact />)}</div>}
        </section>
        <footer className="py-8 text-center text-xs text-slate-400">FoodieExpress · Good food, great mood.</footer>
      </div>
    </main>
  );
}

function OrderCard({ order, compact = false }) {
  const itemSummary = (order.items || []).map((item) => `${item.name} × ${item.quantity}`).join(", ");
  return <article className={`rounded-xl border border-slate-200 p-4 transition hover:border-orange-200 ${compact ? "bg-white" : "bg-slate-50/70"}`}>
    <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-3"><span className="rounded-xl bg-white p-2.5 text-orange-500 shadow-sm"><ShoppingBag size={19} /></span><div className="min-w-0"><h3 className="truncate font-extrabold">{order.restaurantId?.name || "Restaurant"}</h3><p className="mt-1 text-xs text-slate-400">{dateText(order.createdAt)}</p></div></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-extrabold ${statusStyle(order.status)}`}>{readable(order.status)}</span></div>
    <p className="mt-3 line-clamp-2 text-sm leading-5 text-slate-600">{itemSummary || "Order items"}</p>
    <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-slate-100 pt-3"><div><p className="text-lg font-black">{money(order.total)}</p><p className="mt-0.5 text-xs text-slate-500">{String(order.paymentMethod || "").toUpperCase()} · Payment {readable(order.payment?.status || "pending")}</p></div><Link to={`/orders/${order._id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-700 hover:border-orange-200 hover:text-orange-600">Details <ArrowRight size={14} /></Link></div>
  </article>;
}
