import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api.get("/orders/my")
      .then(({ data }) => { if (active) setOrders(data.orders || []); })
      .catch((err) => { if (active) setError(err.response?.data?.message || "Unable to load your orders."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10">
      <div className="mx-auto max-w-4xl">
        <Link to="/" className="text-sm font-semibold text-orange-600">← Home</Link>
        <h1 className="mt-4 text-3xl font-extrabold text-slate-900">My orders</h1>
        {loading && <p className="py-10 text-center text-slate-500">Loading orders...</p>}
        {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
        {!loading && !error && orders.length === 0 && (
          <div className="mt-6 rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="font-semibold text-slate-700">You haven't placed any orders yet.</p>
            <Link to="/restaurants" className="mt-5 inline-block rounded-xl bg-orange-500 px-5 py-3 font-bold text-white">Explore restaurants</Link>
          </div>
        )}
        <div className="mt-6 space-y-4">
          {orders.map((order) => (
            <article key={order._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-extrabold text-slate-900">{order.restaurantId?.name || "Restaurant"}</h2>
                  <p className="mt-1 text-xs text-slate-400">Order #{order._id}</p>
                </div>
                <span className="rounded-full bg-orange-50 px-3 py-1 text-sm font-bold capitalize text-orange-700">{order.status.replaceAll("_", " ")}</span>
              </div>
              <p className="mt-3 text-sm text-slate-600">{order.items.map((item) => `${item.name} × ${item.quantity}`).join(", ")}</p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                <div><p className="font-extrabold text-slate-900">₹{order.total.toFixed(2)}</p><p className="mt-1 text-xs text-slate-500">Payment: {order.payment?.status || "pending"}</p></div>
                <Link to={`/orders/${order._id}`} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">View details</Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
