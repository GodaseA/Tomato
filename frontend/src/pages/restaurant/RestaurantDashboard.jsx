import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Utensils,
  ClipboardList,
  Settings,
  Store,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  LogOut,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  IndianRupee,
  Menu as MenuIcon,
  X,
} from "lucide-react";
import api from "../../api/axios";
import { uploadImage } from "../../api/uploadImage";

const emptyMenuForm = {
  name: "",
  description: "",
  price: "",
  image: "",
  imagePublicId: "",
  category: "",
  foodType: "vegetarian",
  available: true,
  preparationTime: 20,
};

const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "menu", label: "Menu Management", icon: Utensils },
  { id: "orders", label: "Orders", icon: ClipboardList },
  { id: "settings", label: "Restaurant Settings", icon: Settings },
];

const formatPrice = (price) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(price || 0);

const getError = (err, fallback) =>
  err.response?.data?.message || fallback;

export default function RestaurantDashboard() {
  const navigate = useNavigate();

  const [restaurant, setRestaurant] = useState(null);
  const [menuImageFile, setMenuImageFile] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [menuLoading, setMenuLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  const [error, setError] = useState("");
  const [menuError, setMenuError] = useState("");
  const [notice, setNotice] = useState("");

  const [showMenuForm, setShowMenuForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [menuForm, setMenuForm] = useState(emptyMenuForm);

  const loadRestaurant = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/owner/restaurant/me");
      setRestaurant(response.data.restaurant);
    } catch (err) {
      setRestaurant(null);
      setError(
        err.response?.status === 404
          ? "No restaurant application was found for your account."
          : getError(err, "Unable to load restaurant details.")
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMenu = useCallback(async () => {
    setMenuLoading(true);
    setMenuError("");

    try {
      const response = await api.get("/owner/menu");
      setMenuItems(response.data.menuItems || []);
    } catch (err) {
      setMenuError(
        getError(
          err,
          "Unable to load menu. Check your owner permissions and backend."
        )
      );
    } finally {
      setMenuLoading(false);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    setOrdersError("");
    try {
      const response = await api.get("/owner/orders");
      setOrders(response.data.orders || []);
    } catch (err) {
      setOrdersError(getError(err, "Unable to load orders."));
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const updateOrderStatus = async (orderId, status) => {
    setUpdatingOrderId(orderId);
    setOrdersError("");
    try {
      await api.patch(`/owner/orders/${orderId}/status`, { status });
      await loadOrders();
    } catch (err) {
      setOrdersError(getError(err, "Unable to update order status."));
    } finally {
      setUpdatingOrderId("");
    }
  };

  useEffect(() => {
    loadRestaurant();
  }, [loadRestaurant]);

  useEffect(() => {
    if (restaurant?.status === "approved") {
      loadMenu();
    }
  }, [restaurant?.status, loadMenu]);

  const showMessage = (message) => {
    setNotice(message);
    setError("");
    setMenuError("");
  };

  const openCreateForm = () => {
    setEditingItem(null);
    setMenuImageFile(null);
    setMenuForm(emptyMenuForm);
    setShowMenuForm(true);
    setMenuError("");
  };

  const openEditForm = (item) => {
    setEditingItem(item);
    setMenuImageFile(null);
    setMenuForm({
      name: item.name || "",
      description: item.description || "",
      price: String(item.price ?? ""),
      image: item.image || "",
      imagePublicId: item.imagePublicId || "",
      category: item.category || "",
      foodType: item.foodType || "vegetarian",
      available: item.available ?? true,
      preparationTime: item.preparationTime ?? 20,
    });
    setMenuImageFile(null);
    setShowMenuForm(true);
    setMenuError("");
  };

  const updateMenuField = (event) => {
    const { name, value, type, checked } = event.target;

    setMenuForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const saveMenuItem = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMenuError("");
    setNotice("");

    const payload = {
      name: menuForm.name.trim(),
      description: menuForm.description.trim(),
      price: Number(menuForm.price),
      image: menuForm.image.trim(),
      imagePublicId: menuForm.imagePublicId || "",
      category: menuForm.category.trim(),
      foodType: menuForm.foodType,
      available: menuForm.available,
      preparationTime: Number(menuForm.preparationTime),
    };

    try {
      if (menuImageFile) {
        setImageUploading(true);
        const uploaded = await uploadImage(menuImageFile, "menu");
        payload.image = uploaded.image;
        payload.imagePublicId = uploaded.imagePublicId;
      }
      if (editingItem) {
        await api.patch(`/owner/menu/${editingItem._id}`, payload);
        showMessage("Menu item updated successfully.");
      } else {
        await api.post("/owner/menu", payload);
        showMessage("Menu item added successfully.");
      }

      setShowMenuForm(false);
      setEditingItem(null);
      setMenuForm(emptyMenuForm);
      await loadMenu();
    } catch (err) {
      setMenuError(getError(err, "Unable to save menu item."));
    } finally {
      setSaving(false);
      setImageUploading(false);
    }
  };

  const deleteMenuItem = async (item) => {
    const confirmed = window.confirm(
      `Delete "${item.name}" from your menu?`
    );

    if (!confirmed) return;

    setMenuError("");
    setNotice("");

    try {
      await api.delete(`/owner/menu/${item._id}`);
      setMenuItems((previous) =>
        previous.filter((entry) => entry._id !== item._id)
      );
      showMessage("Menu item deleted successfully.");
    } catch (err) {
      setMenuError(getError(err, "Unable to delete menu item."));
    }
  };

  const toggleAvailability = async () => {
    if (!restaurant || restaurant.status !== "approved") return;

    setToggling(true);
    setError("");
    setNotice("");

    try {
      const response = await api.patch("/owner/restaurant/availability", {
        isAcceptingOrders: !restaurant.isAcceptingOrders,
      });

      setRestaurant(response.data.restaurant);
      showMessage("Restaurant availability updated.");
    } catch (err) {
      setError(getError(err, "Unable to update restaurant availability."));
    } finally {
      setToggling(false);
    }
  };

  const changeTab = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    setShowMenuForm(false);
    setNotice("");
    setMenuError("");
    setError("");

    if (tab === "menu" && restaurant?.status === "approved") {
      loadMenu();
    }
    if (tab === "orders" && restaurant?.status === "approved") {
      loadOrders();
    }
  };

  const statusClasses = {
    pending: "bg-amber-50 text-amber-700 ring-amber-200",
    approved: "bg-green-50 text-green-700 ring-green-200",
    rejected: "bg-red-50 text-red-700 ring-red-200",
    suspended: "bg-gray-100 text-gray-700 ring-gray-200",
  };

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm text-gray-800 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100";

  const renderStatus = (status) => (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold capitalize ring-1 ring-inset ${statusClasses[status] || statusClasses.pending
        }`}
    >
      {status === "approved" ? (
        <CheckCircle2 size={14} />
      ) : status === "rejected" || status === "suspended" ? (
        <XCircle size={14} />
      ) : (
        <Clock size={14} />
      )}
      {status}
    </span>
  );

  const approved = restaurant?.status === "approved";
  const availableItems = menuItems.filter((item) => item.available).length;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="mx-auto animate-spin text-orange-500" size={30} />
          <p className="mt-3 text-sm text-gray-500">
            Loading your restaurant dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-5">
        <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <Store className="mx-auto text-orange-500" size={42} />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Restaurant not found
          </h1>
          <p className="mt-3 text-sm leading-6 text-gray-500">
            {error || "Register your restaurant before opening this dashboard."}
          </p>
          <button
            onClick={() => navigate("/restaurant/register")}
            className="mt-6 rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white hover:bg-orange-600"
          >
            Register restaurant
          </button>
          <button
            onClick={loadRestaurant}
            className="ml-2 rounded-xl border border-gray-200 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {mobileMenuOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-gray-200 bg-white transition-transform duration-200 lg:translate-x-0 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-gray-100 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white">
              <Utensils size={22} />
            </div>
            <div>
              <p className="text-lg font-extrabold tracking-tight">
                Food<span className="text-orange-500">Hub</span>
              </p>
              <p className="text-xs text-gray-500">Restaurant partner</p>
            </div>
          </div>
          <button
            className="rounded-lg p-2 hover:bg-gray-100 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="border-b border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <Store size={23} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{restaurant.name}</p>
              <p className="mt-1 text-xs text-gray-500">Restaurant owner</p>
            </div>
          </div>
          <div className="mt-4">{renderStatus(restaurant.status)}</div>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          <p className="mb-3 px-3 text-xs font-bold uppercase tracking-widest text-gray-400">
            Workspace
          </p>

          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => changeTab(id)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${activeTab === id
                  ? "bg-orange-50 text-orange-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
            >
              <Icon size={19} />
              {label}
            </button>
          ))}

          <button
            onClick={() => navigate("/")}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            <LogOut size={19} />
            Back to website
          </button>
        </nav>

        <div className="m-4 rounded-2xl bg-gray-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertCircle size={17} className="text-orange-500" />
            Need help?
          </div>
          <p className="mt-2 text-xs leading-5 text-gray-500">
            Contact your administrator if your application status or access
            needs attention.
          </p>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-gray-200 bg-white/95 px-4 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button
              aria-label="Open navigation"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-2 hover:bg-gray-100 lg:hidden"
            >
              <MenuIcon size={22} />
            </button>
            <div>
              <h1 className="text-lg font-bold sm:text-xl">
                {navItems.find((item) => item.id === activeTab)?.label}
              </h1>
              <p className="hidden text-xs text-gray-500 sm:block">
                Manage your restaurant in one place
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              loadRestaurant();
              if (approved) loadMenu();
            }}
            className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw size={16} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </header>

        <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-8">
          {notice && (
            <div
              role="status"
              className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
            >
              <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
              <p className="flex-1">{notice}</p>
              <button onClick={() => setNotice("")} aria-label="Dismiss">
                <X size={16} />
              </button>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {!approved && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <Clock className="mt-1 shrink-0 text-amber-600" size={23} />
                <div>
                  <h2 className="font-bold text-amber-900">
                    Application {restaurant.status}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-amber-800">
                    {restaurant.status === "pending"
                      ? "Your application is awaiting admin approval. Menu management and restaurant availability are unavailable until approval."
                      : restaurant.status === "rejected"
                        ? `Your application was rejected. ${restaurant.rejectionReason || "Contact the administrator for details."
                        }`
                        : "Your restaurant is suspended. Contact the administrator for assistance."}
                  </p>
                  <button
                    onClick={() => navigate("/restaurant/register")}
                    className="mt-3 text-sm font-bold text-amber-900 underline"
                  >
                    View application details
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "overview" && (
            <>
              <div className="rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-white sm:p-8">
                <p className="text-sm font-medium text-orange-50">
                  Restaurant owner dashboard
                </p>
                <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">
                  Welcome, {restaurant.name}!
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-orange-50">
                  Manage your menu and restaurant availability from here.
                  Your dashboard data comes from your restaurant APIs.
                </p>
                <div className="mt-5">{renderStatus(restaurant.status)}</div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <StatCard
                  title="Total menu items"
                  value={approved ? menuItems.length : "—"}
                  subtitle={approved ? "Items in your menu" : "Available after approval"}
                  icon={Utensils}
                />
                <StatCard
                  title="Available items"
                  value={approved ? availableItems : "—"}
                  subtitle="Items marked as available"
                  icon={CheckCircle2}
                />
                <StatCard
                  title="Restaurant status"
                  value={restaurant.status}
                  subtitle={
                    restaurant.isAcceptingOrders
                      ? "Accepting orders"
                      : "Not accepting orders"
                  }
                  icon={Store}
                  capitalize
                />
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <section className="rounded-2xl border border-gray-200 bg-white p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold">Restaurant information</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Your registered details
                      </p>
                    </div>
                    <Store className="text-orange-500" size={23} />
                  </div>

                  <div className="mt-6 space-y-4">
                    <InfoRow label="Name" value={restaurant.name} />
                    <InfoRow
                      label="Email"
                      value={restaurant.email || "Not provided"}
                    />
                    <InfoRow
                      label="Phone"
                      value={restaurant.phone || "Not provided"}
                    />
                    <InfoRow
                      label="Address"
                      value={[
                        restaurant.address?.street,
                        restaurant.address?.city,
                        restaurant.address?.state,
                        restaurant.address?.postalCode,
                      ]
                        .filter(Boolean)
                        .join(", ") || "Not provided"}
                    />
                  </div>
                </section>

                <section className="rounded-2xl border border-gray-200 bg-white p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold">Quick actions</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Common restaurant tasks
                      </p>
                    </div>
                    <LayoutDashboard className="text-orange-500" size={23} />
                  </div>

                  <div className="mt-6 space-y-3">
                    <button
                      disabled={!approved}
                      onClick={() => {
                        changeTab("menu");
                        openCreateForm();
                      }}
                      className="flex w-full items-center justify-between rounded-xl border border-gray-200 p-4 text-left transition hover:border-orange-300 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span>
                        <span className="block font-semibold">Add menu item</span>
                        <span className="mt-1 block text-xs text-gray-500">
                          Add a dish, price and category
                        </span>
                      </span>
                      <Plus size={20} className="text-orange-500" />
                    </button>

                    <button
                      disabled={!approved}
                      onClick={() => changeTab("settings")}
                      className="flex w-full items-center justify-between rounded-xl border border-gray-200 p-4 text-left transition hover:border-orange-300 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span>
                        <span className="block font-semibold">
                          Restaurant availability
                        </span>
                        <span className="mt-1 block text-xs text-gray-500">
                          Choose whether to accept orders
                        </span>
                      </span>
                      <Settings size={20} className="text-orange-500" />
                    </button>
                  </div>
                </section>
              </div>

              <section className="rounded-2xl border border-gray-200 bg-white p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold">Recent menu items</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Your latest menu entries
                    </p>
                  </div>
                  {approved && (
                    <button
                      onClick={() => changeTab("menu")}
                      className="text-sm font-bold text-orange-600 hover:text-orange-700"
                    >
                      View all
                    </button>
                  )}
                </div>

                {!approved ? (
                  <p className="mt-5 text-sm text-gray-500">
                    Menu management becomes available after approval.
                  </p>
                ) : menuLoading ? (
                  <p className="mt-5 text-sm text-gray-500">Loading menu...</p>
                ) : menuError ? (
                  <p className="mt-5 text-sm text-red-600">{menuError}</p>
                ) : menuItems.length === 0 ? (
                  <div className="py-8 text-center">
                    <Utensils className="mx-auto text-gray-300" size={34} />
                    <p className="mt-3 font-semibold">Your menu is empty</p>
                    <p className="mt-1 text-sm text-gray-500">
                      Add your first dish to get started.
                    </p>
                    <button
                      onClick={() => {
                        changeTab("menu");
                        openCreateForm();
                      }}
                      className="mt-4 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
                    >
                      Add first item
                    </button>
                  </div>
                ) : (
                  <div className="mt-5 divide-y divide-gray-100">
                    {menuItems.slice(0, 5).map((item) => (
                      <div
                        key={item._id}
                        className="flex items-center gap-3 py-4"
                      >
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-12 w-12 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                            <Utensils size={20} />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">{item.name}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            {item.category}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatPrice(item.price)}</p>
                          <p
                            className={`mt-1 text-xs ${item.available ? "text-green-600" : "text-gray-500"
                              }`}
                          >
                            {item.available ? "Available" : "Unavailable"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <p className="text-xs leading-5 text-gray-400">
                Order totals, revenue, customer counts, and order history are
                not displayed because the required owner order APIs are not
                present in the supplied backend.
              </p>
            </>
          )}

          {activeTab === "orders" && (
            <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-7">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-xl font-bold">Restaurant orders</h2>
                  <p className="mt-1 text-sm text-gray-500">Review incoming orders and update their progress.</p>
                </div>
                <button onClick={loadOrders} disabled={ordersLoading} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50">
                  {ordersLoading ? "Refreshing..." : "Refresh orders"}
                </button>
              </div>
              {ordersError && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{ordersError}</p>}
              {ordersLoading ? (
                <div className="py-12 text-center text-sm text-gray-500"><RefreshCw className="mx-auto mb-3 animate-spin text-orange-500" size={22} />Loading orders...</div>
              ) : orders.length === 0 ? (
                <div className="py-12 text-center"><ClipboardList className="mx-auto text-gray-300" size={38} /><h3 className="mt-3 font-bold">No orders yet</h3><p className="mt-1 text-sm text-gray-500">New customer orders will appear here.</p></div>
              ) : (
                <div className="mt-6 space-y-4">
                  {orders.map((order) => {
                    const nextStatus = { pending: ["confirmed", "rejected"], confirmed: ["preparing"], preparing: ["ready_for_pickup"], ready_for_pickup: ["out_for_delivery"], out_for_delivery: ["delivered"] }[order.status] || [];
                    return (
                      <article key={order._id} className="rounded-xl border border-gray-200 p-4 sm:p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div><p className="font-bold">Order #{String(order._id).slice(-8).toUpperCase()}</p><p className="mt-1 text-xs text-gray-500">{order.createdAt ? new Date(order.createdAt).toLocaleString() : ""}</p><p className="mt-2 text-sm text-gray-700">Customer: {order.customerId?.name || "Customer"}</p></div>
                          <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold capitalize text-orange-700">{order.status.replaceAll("_", " ")}</span>
                        </div>
                        <div className="mt-4 space-y-2">{order.items.map((item, index) => <div key={`${item.menuItemId || item.name}-${index}`} className="flex justify-between gap-4 text-sm"><span>{item.name} × {item.quantity}</span><span>{formatPrice(item.unitPrice * item.quantity)}</span></div>)}</div>
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4"><div><p className="font-bold">Total: {formatPrice(order.total)}</p><p className="mt-1 text-xs capitalize text-gray-500">Payment: {order.paymentMethod}{order.payment?.status ? ` · ${order.payment.status}` : ""}</p></div>{nextStatus.length > 0 && <div className="flex flex-wrap gap-2">{nextStatus.map((status) => <button key={status} disabled={updatingOrderId === order._id} onClick={() => updateOrderStatus(order._id, status)} className={`rounded-lg px-3 py-2 text-xs font-bold capitalize disabled:opacity-50 ${status === "rejected" ? "border border-red-200 text-red-600" : "bg-orange-500 text-white hover:bg-orange-600"}`}>{updatingOrderId === order._id ? "Updating..." : status.replaceAll("_", " ")}</button>)}</div>}</div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {activeTab === "menu" && (
            <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-7">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-xl font-bold">Menu management</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Create and manage the dishes your restaurant offers.
                  </p>
                </div>
                <button
                  disabled={!approved}
                  onClick={openCreateForm}
                  className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus size={18} />
                  Add menu item
                </button>
              </div>

              {menuError && (
                <div
                  role="alert"
                  className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                  {menuError}
                </div>
              )}

              {showMenuForm && approved && (
                <form
                  onSubmit={saveMenuItem}
                  className="mt-6 rounded-2xl border border-orange-200 bg-orange-50/40 p-5"
                >
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <h3 className="font-bold">
                      {editingItem ? "Edit menu item" : "Add a new menu item"}
                    </h3>
                    <button
                      type="button"
                      aria-label="Close form"
                      onClick={() => setShowMenuForm(false)}
                      className="rounded-lg p-2 hover:bg-gray-100"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Dish name *">
                      <input
                        name="name"
                        value={menuForm.name}
                        onChange={updateMenuField}
                        className={inputClass}
                        minLength={2}
                        maxLength={150}
                        required
                      />
                    </FormField>

                    <FormField label="Price (₹) *">
                      <input
                        name="price"
                        type="number"
                        value={menuForm.price}
                        onChange={updateMenuField}
                        className={inputClass}
                        min="0.01"
                        max="100000"
                        step="0.01"
                        required
                      />
                    </FormField>

                    <FormField label="Category *">
                      <input
                        name="category"
                        value={menuForm.category}
                        onChange={updateMenuField}
                        className={inputClass}
                        placeholder="e.g. Main Course"
                        minLength={1}
                        maxLength={80}
                        required
                      />
                    </FormField>

                    <FormField label="Food type *">
                      <select
                        name="foodType"
                        value={menuForm.foodType}
                        onChange={updateMenuField}
                        className={inputClass}
                      >
                        <option value="vegetarian">Vegetarian</option>
                        <option value="non-vegetarian">Non-vegetarian</option>
                        <option value="vegan">Vegan</option>
                      </select>
                    </FormField>

                    <FormField label="Preparation time (minutes) *">
                      <input
                        name="preparationTime"
                        type="number"
                        value={menuForm.preparationTime}
                        onChange={updateMenuField}
                        className={inputClass}
                        min="1"
                        max="240"
                        required
                      />
                    </FormField>

                    <FormField label="Food image (optional)">
                      <input
                        name="imageFile"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(event) => setMenuImageFile(event.target.files?.[0] || null)}
                        className={inputClass}
                      />
                      <p className="mt-1 text-xs text-gray-500">JPG, PNG or WebP; maximum 5 MB.</p>
                      {(menuImageFile || menuForm.image) && (
                        <img src={menuImageFile ? URL.createObjectURL(menuImageFile) : menuForm.image} alt="Food preview" className="mt-2 h-24 w-24 rounded-lg object-cover" />
                      )}
                    </FormField>

                    <div className="sm:col-span-2">
                      <FormField label="Description">
                        <textarea
                          name="description"
                          value={menuForm.description}
                          onChange={updateMenuField}
                          className={inputClass}
                          rows={3}
                          maxLength={1000}
                        />
                      </FormField>
                    </div>

                    <label className="flex items-center gap-3 text-sm font-medium text-gray-700 sm:col-span-2">
                      <input
                        type="checkbox"
                        name="available"
                        checked={menuForm.available}
                        onChange={updateMenuField}
                        className="h-4 w-4 accent-orange-500"
                      />
                      This item is currently available
                    </label>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                    >
                      {saving
                        ? "Saving..."
                        : editingItem
                          ? "Save changes"
                          : "Add item"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowMenuForm(false)}
                      className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {approved && menuLoading ? (
                <div className="py-12 text-center text-sm text-gray-500">
                  <RefreshCw
                    size={22}
                    className="mx-auto mb-3 animate-spin text-orange-500"
                  />
                  Loading your menu...
                </div>
              ) : !approved ? (
                <p className="mt-6 rounded-xl bg-gray-50 p-5 text-sm text-gray-600">
                  Menu management is locked until your restaurant is approved.
                </p>
              ) : menuItems.length === 0 ? (
                <div className="py-12 text-center">
                  <Utensils className="mx-auto text-gray-300" size={38} />
                  <h3 className="mt-3 font-bold">No menu items yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Add a dish to build your restaurant menu.
                  </p>
                </div>
              ) : (
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full min-w-[650px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                        <th className="px-3 py-4 font-semibold">Item</th>
                        <th className="px-3 py-4 font-semibold">Category</th>
                        <th className="px-3 py-4 font-semibold">Price</th>
                        <th className="px-3 py-4 font-semibold">Availability</th>
                        <th className="px-3 py-4 text-right font-semibold">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {menuItems.map((item) => (
                        <tr key={item._id} className="hover:bg-gray-50/70">
                          <td className="px-3 py-4">
                            <div className="flex items-center gap-3">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="h-11 w-11 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
                                  <Utensils size={19} />
                                </div>
                              )}
                              <div>
                                <p className="font-semibold">{item.name}</p>
                                <p className="mt-1 text-xs capitalize text-gray-500">
                                  {(item.foodType || "").replace("-", " ")}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-4 text-gray-600">
                            {item.category}
                          </td>
                          <td className="px-3 py-4 font-semibold">
                            {formatPrice(item.price)}
                          </td>
                          <td className="px-3 py-4">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.available
                                  ? "bg-green-50 text-green-700"
                                  : "bg-gray-100 text-gray-600"
                                }`}
                            >
                              {item.available ? "Available" : "Unavailable"}
                            </span>
                          </td>
                          <td className="px-3 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                title="Edit item"
                                onClick={() => openEditForm(item)}
                                className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:border-orange-300 hover:text-orange-600"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                title="Delete item"
                                onClick={() => deleteMenuItem(item)}
                                className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:border-red-200 hover:text-red-600"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {activeTab === "settings" && (
            <section className="max-w-3xl rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-orange-50 p-3 text-orange-500">
                  <Store size={25} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Restaurant settings</h2>
                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    Manage whether customers can place orders at your
                    restaurant.
                  </p>
                </div>
              </div>

              <div className="mt-7 rounded-2xl border border-gray-100 p-5">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-bold">Accepting orders</p>
                    <p className="mt-1 text-sm leading-6 text-gray-500">
                      {restaurant.isAcceptingOrders
                        ? "Your restaurant is currently accepting orders."
                        : "Your restaurant is currently not accepting orders."}
                    </p>
                  </div>

                  <button
                    disabled={!approved || toggling}
                    onClick={toggleAvailability}
                    className={`rounded-xl px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${restaurant.isAcceptingOrders
                        ? "bg-gray-700 hover:bg-gray-800"
                        : "bg-green-600 hover:bg-green-700"
                      }`}
                  >
                    {toggling
                      ? "Updating..."
                      : restaurant.isAcceptingOrders
                        ? "Stop accepting orders"
                        : "Start accepting orders"}
                  </button>
                </div>

                {!approved && (
                  <p className="mt-4 text-sm text-amber-700">
                    This setting is available only after admin approval.
                  </p>
                )}
              </div>

              <div className="mt-6 rounded-2xl border border-gray-100 p-5">

                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <h3 className="font-bold">Registration details</h3>

                  <Link to="/restaurant/update" className="rounded-xl border border-slate-300 bg-white px-6 py-3.5 font-bold text-slate-700 hover:bg-slate-100">
                    update restaurant details
                  </Link>
                </div>

                <div className="mt-4 space-y-4">
                  <InfoRow label="Restaurant" value={restaurant.name} />
                  <InfoRow
                    label="Application status"
                    value={restaurant.status}
                  />
                  <InfoRow
                    label="Description"
                    value={restaurant.description || "Not provided"}
                  />
                  <InfoRow
                    label="Contact email"
                    value={restaurant.email || "Not provided"}
                  />
                  <InfoRow
                    label="Contact phone"
                    value={restaurant.phone || "Not provided"}
                  />
                </div>
                <p className="mt-5 border-t border-gray-100 pt-4 text-xs leading-5 text-gray-400">
                  Editing restaurant details is not included because the
                  supplied backend does not currently provide an owner update
                  endpoint for those fields.
                </p>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, capitalize = false }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p
            className={`mt-3 text-2xl font-extrabold ${capitalize ? "capitalize" : ""
              }`}
          >
            {value}
          </p>
          <p className="mt-2 text-xs text-gray-500">{subtitle}</p>
        </div>
        <div className="rounded-xl bg-orange-50 p-3 text-orange-500">
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-6">
      <span className="shrink-0 text-sm text-gray-500">{label}</span>
      <span className="break-words text-sm font-medium text-gray-900 sm:text-right">
        {value}
      </span>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-gray-700">
        {label}
      </span>
      {children}
    </label>
  );
}
