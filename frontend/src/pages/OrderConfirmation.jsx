import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, Clock, MapPin, UtensilsCrossed } from "lucide-react";
import api from "../api/axios";

const statusLabel = {
  pending: "Waiting for restaurant confirmation",
  confirmed: "Order confirmed",
  preparing: "Being prepared",
  ready_for_pickup: "Ready for pickup",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  rejected: "Rejected by restaurant",
};

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.get(`/orders/${orderId}`)
      .then(({ data }) => { if (active) setOrder(data.order); })
      .catch((err) => { if (active) setError(err.response?.data?.message || "Unable to load this order."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [orderId]);

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-slate-50"><p className="font-semibold text-orange-600">Loading your order...</p></main>;

  if (error || !order) return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <p role="alert" className="text-slate-700">{error || "Order not found."}</p>
        <Link to="/restaurants" className="mt-5 inline-block rounded-xl bg-orange-500 px-5 py-3 font-bold text-white">Explore restaurants</Link>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10">
      <div className="mx-auto max-w-2xl">
        <Link to="/" className="flex items-center justify-center gap-2 font-extrabold text-slate-900"><UtensilsCrossed className="text-orange-500" />FoodieExpress</Link>
        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-10">
          <CheckCircle2 className="mx-auto text-green-500" size={56} />
          <h1 className="mt-4 text-3xl font-extrabold text-slate-900">Order placed!</h1>
          <p className="mt-2 text-slate-500">Your order has been sent to {order.restaurantId?.name || "the restaurant"}.</p>
          <p className="mt-3 text-xs text-slate-400">Order ID: {order._id}</p>
          <div className="mt-6 rounded-xl bg-orange-50 p-4">
            <div className="flex items-center justify-center gap-2 font-bold text-orange-800"><Clock size={18} />{statusLabel[order.status] || order.status}</div>
            <p className="mt-2 text-sm text-orange-700">Payment: {order.payment?.status || "pending"} ({order.paymentMethod === "cod" ? "Cash on delivery" : order.paymentMethod})</p>
          </div>
          <div className="mt-6 space-y-3 text-left">
            {order.items.map((item, index) => (
              <div key={`${item.menuItemId}-${index}`} className="flex justify-between gap-4 text-sm">
                <span className="text-slate-700">{item.name} × {item.quantity}</span>
                <span className="font-semibold">₹{(item.unitPrice * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-2 border-t pt-4 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>₹{order.subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Delivery fee</span><span>₹{order.deliveryFee.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Tax</span><span>₹{order.tax.toFixed(2)}</span></div>
            <div className="flex justify-between border-t pt-3 text-lg font-extrabold"><span>Total</span><span>₹{order.total.toFixed(2)}</span></div>
          </div>
          <div className="mt-6 rounded-xl bg-slate-50 p-4 text-left">
            <p className="flex items-center gap-2 font-bold"><MapPin size={17} className="text-orange-500" />Delivery address</p>
            <p className="mt-2 text-sm text-slate-600">{order.deliveryAddress.recipientName} · {order.deliveryAddress.phone}</p>
            <p className="mt-1 text-sm text-slate-600">{order.deliveryAddress.street}, {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.postalCode}</p>
          </div>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/orders" className="rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-700 hover:bg-slate-50">My orders</Link>
            <Link to="/restaurants" className="rounded-xl bg-orange-500 px-5 py-3 font-bold text-white hover:bg-orange-600">Order more food</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
