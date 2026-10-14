
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { UtensilsCrossed } from "lucide-react";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import ProtectedRoute from "./components/ProtectedRoute";
import Restaurants from "./pages/Restaurants";
import RestaurantMenu from "./pages/RestaurantMenu";
import AdminDashboard from "./pages/admin/AdminDashboard";
import RestaurantRegistration from "./pages/restaurant/RestaurantRegistration";
import RestaurantDashboard from "./pages/restaurant/RestaurantDashboard";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import MyOrders from "./pages/MyOrders";
import CustomerDashboard from "./pages/CustomerDashboard";
import { CartProvider } from "./context/CartContext";

function ComingSoon({ title }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-orange-50 p-5">
      <div className="w-full max-w-lg rounded-3xl bg-white p-10 text-center shadow-xl">
        <UtensilsCrossed className="mx-auto text-orange-500" size={40} />
        <h1 className="mt-5 text-3xl font-extrabold text-slate-900">
          {title}
        </h1>
        <p className="mt-3 text-slate-600">
          Authentication is connected. We'll build this section next.
        </p>
        <Link to="/" className="mt-6 inline-block rounded-xl bg-orange-500 px-5 py-3 font-bold text-white hover:bg-orange-600">
          Back to home
        </Link>
      </div>
    </main>
  );
}

function App() {
  return (
    <CartProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/restaurants" element={<Restaurants />} />

        <Route path="/restaurants/:restaurantId" element={<RestaurantMenu />} />

        <Route element={<ProtectedRoute allowedRoles={["restaurant"]} />}>
          <Route
            path="/restaurant/dashboard"
            element={<RestaurantDashboard />}
          />
        </Route>


        <Route
          element={<ProtectedRoute allowedRoles={["user"]} />}
        >
          <Route
            path="/restaurant/register"
            element={<RestaurantRegistration />}
          />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders/:orderId" element={<OrderConfirmation />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/dashboard" element={<CustomerDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        <Route path="*" element={<ComingSoon title="Page not found" />} />
      </Routes>
    </BrowserRouter>
    </CartProvider>
  );
}

export default App;
