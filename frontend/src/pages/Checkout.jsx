import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, ShoppingBag, UtensilsCrossed } from "lucide-react";
import api from "../api/axios";
import { useCart } from "../context/CartContext";

const initialAddress = {
  recipientName: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  postalCode: "",
  deliveryInstructions: "",
};

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100";

export default function Checkout() {
  const navigate = useNavigate();
  const { restaurant, items, subtotal, clearCart } = useCart();
  const [address, setAddress] = useState(initialAddress);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const updateAddress = (event) => {
    setAddress((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const submitOrder = async (event) => {
    event.preventDefault();
    setError("");

    if (!items.length || !restaurant?._id) {
      setError("Your cart is empty. Add items before checking out.");
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post("/orders", {
        restaurantId: restaurant._id,
        items: items.map((item) => ({
          menuItemId: item._id,
          quantity: item.quantity,
        })),
        deliveryAddress: address,
        paymentMethod,
      });

      clearCart();
      navigate(`/orders/${data.order._id}`, {
        replace: true,
        state: { justPlaced: true },
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "We couldn't place your order. Please check your details and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!items.length || !restaurant) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <ShoppingBag className="mx-auto text-orange-500" size={40} />
          <h1 className="mt-4 text-2xl font-extrabold text-slate-900">Your cart is empty</h1>
          <p className="mt-2 text-slate-500">Choose a restaurant and add some dishes first.</p>
          <Link to="/restaurants" className="mt-6 inline-block rounded-xl bg-orange-500 px-5 py-3 font-bold text-white">
            Explore restaurants
          </Link>
        </div>
      </main>
    );
  }

  const deliveryFee = subtotal >= 499 ? 0 : 40;
  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  const total = subtotal + deliveryFee + tax;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link to={`/restaurants/${restaurant._id}`} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-orange-600">
            <ArrowLeft size={18} /> Back to menu
          </Link>
          <Link to="/" className="flex items-center gap-2 font-extrabold text-slate-900">
            <UtensilsCrossed className="text-orange-500" /> FoodieExpress
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Checkout</h1>
        <p className="mt-2 text-slate-500">Delivery details and final order summary.</p>

        {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}

        <form onSubmit={submitOrder} className="mt-7 grid items-start gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
              <div className="flex items-center gap-3">
                <MapPin className="text-orange-500" />
                <h2 className="text-xl font-extrabold">Delivery address</h2>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-700">Recipient name
                  <input className={`${fieldClass} mt-2`} name="recipientName" value={address.recipientName} onChange={updateAddress} required maxLength={100} />
                </label>
                <label className="text-sm font-semibold text-slate-700">Phone number
                  <input className={`${fieldClass} mt-2`} name="phone" value={address.phone} onChange={updateAddress} required minLength={7} maxLength={20} />
                </label>
                <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Street / house / building
                  <input className={`${fieldClass} mt-2`} name="street" value={address.street} onChange={updateAddress} required maxLength={200} />
                </label>
                <label className="text-sm font-semibold text-slate-700">City
                  <input className={`${fieldClass} mt-2`} name="city" value={address.city} onChange={updateAddress} required maxLength={100} />
                </label>
                <label className="text-sm font-semibold text-slate-700">State
                  <input className={`${fieldClass} mt-2`} name="state" value={address.state} onChange={updateAddress} required maxLength={100} />
                </label>
                <label className="text-sm font-semibold text-slate-700">Postal code
                  <input className={`${fieldClass} mt-2`} name="postalCode" value={address.postalCode} onChange={updateAddress} required minLength={4} maxLength={12} />
                </label>
                <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Delivery instructions (optional)
                  <textarea className={`${fieldClass} mt-2`} name="deliveryInstructions" value={address.deliveryInstructions} onChange={updateAddress} rows={3} maxLength={500} placeholder="Landmark, gate code, or other details" />
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
              <h2 className="text-xl font-extrabold">Payment method</h2>
              <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4">
                <input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === "cod"} onChange={(e) => setPaymentMethod(e.target.value)} className="mt-1 accent-orange-500" />
                <span><span className="block font-bold text-slate-900">Cash on delivery</span><span className="mt-1 block text-sm text-slate-600">Pay when your order arrives.</span></span>
              </label>
              <p className="mt-3 text-xs leading-5 text-slate-500">Online Razorpay payment will be enabled after its order creation and signature-verification flow is configured.</p>
            </section>
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-5">
            <h2 className="text-xl font-extrabold">Order summary</h2>
            <p className="mt-1 text-sm text-slate-500">{restaurant.name}</p>
            <div className="mt-5 space-y-4">
              {items.map((item) => (
                <div key={item._id} className="flex justify-between gap-3 text-sm">
                  <div><p className="font-semibold text-slate-800">{item.name}</p><p className="mt-1 text-slate-500">Qty {item.quantity}</p></div>
                  <span className="font-semibold">₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 space-y-3 border-t pt-4 text-sm">
              <div className="flex justify-between"><span className="text-slate-600">Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Delivery fee</span><span>{deliveryFee ? `₹${deliveryFee.toFixed(2)}` : "Free"}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Estimated tax (5%)</span><span>₹{tax.toFixed(2)}</span></div>
              <div className="flex justify-between border-t pt-3 text-lg font-extrabold"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
            </div>
            <p className="mt-3 text-xs text-slate-500">Final prices are recalculated by the server when you place the order.</p>
            <button type="submit" disabled={submitting} className="mt-5 w-full rounded-xl bg-orange-500 px-4 py-3.5 font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? "Placing order..." : "Place order"}
            </button>
          </aside>
        </form>
      </section>
    </main>
  );
}
