 import { useCallback, useEffect, useState } from "react";
import api from "../../api/axios";
import {
  LayoutDashboard,
  Store,
  ShoppingBag,
  Users,
  CreditCard,
  Menu,
  X,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  IndianRupee,
  ChevronRight,
  UtensilsCrossed,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

const STATUS_TABS = ["pending", "approved", "rejected", "suspended"];

const NAVIGATION = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "restaurants", label: "Restaurants", icon: Store },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "customers", label: "Customers", icon: Users },
  { id: "payments", label: "Payments", icon: CreditCard },
];

const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rejected: "bg-rose-50 text-rose-700 ring-rose-200",
  suspended: "bg-slate-100 text-slate-600 ring-slate-200",
};

const STATUS_ICONS = {
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle,
  suspended: Ban,
};

const EMPTY_COUNTS = {
  pending: 0,
  approved: 0,
  rejected: 0,
  suspended: 0,
};

function formatDate(date) {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }) {
  const styles = STATUS_STYLES[status] || STATUS_STYLES.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${styles}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status || "unknown"}
    </span>
  );
}

function StatCard({ title, value, description, icon: Icon, color }) {
  const colorStyles = {
    violet: "bg-violet-50 text-violet-600",
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>

        <div className={`rounded-xl p-3 ${colorStyles[color]}`}>
          <Icon size={22} />
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500">{description}</p>
    </div>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="rounded-2xl bg-violet-50 p-4 text-violet-600">
        <Store size={28} />
      </div>

      <h3 className="mt-4 text-base font-semibold text-slate-900">
        {title}
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

export default function AdminDashboard() {
  const [activePage, setActivePage] = useState("overview");
  const [activeStatus, setActiveStatus] = useState("pending");
  const [restaurants, setRestaurants] = useState([]);
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load all restaurant statuses using the existing Axios instance.
  const loadRestaurants = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const responses = await Promise.all(
        STATUS_TABS.map((status) =>
          api.get("/admin/restaurants", {
            params: { status },
          })
        )
      );

      const nextCounts = { ...EMPTY_COUNTS };
      const resultsByStatus = {};

      responses.forEach((response, index) => {
        const status = STATUS_TABS[index];
        const data = response.data || {};
        const list = Array.isArray(data.restaurants)
          ? data.restaurants
          : [];

        resultsByStatus[status] = list;
        nextCounts[status] = data.count ?? list.length;
      });

      setCounts(nextCounts);
      setRestaurants(resultsByStatus[activeStatus] || []);
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Please log in to your admin account.");
      } else if (err.response?.status === 403) {
        setError("You do not have admin access.");
      } else {
        setError(
          err.response?.data?.message ||
            "Could not load restaurant applications. Check your backend connection."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [activeStatus]);

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  function handleStatusChange(status) {
    setActiveStatus(status);
    setSearch("");
  }

  function handlePageChange(page) {
    setActivePage(page);
    setSidebarOpen(false);
    setError("");
    setSuccess("");
  }

  // Approve or reject a pending restaurant application.
  async function reviewRestaurant(id, decision) {
    let rejectionReason = "";

    if (decision === "reject") {
      const reason = window.prompt(
        "Enter a reason for rejecting this application:"
      );

      if (reason === null) return;

      rejectionReason = reason.trim();

      if (!rejectionReason) {
        setError("Please provide a rejection reason.");
        return;
      }
    }

    setActionId(id);
    setError("");
    setSuccess("");

    try {
      const { data } = await api.patch(
        `/admin/restaurants/${id}/review`,
        { decision, rejectionReason }
      );

      setSuccess(
        data.message || "Restaurant application updated successfully."
      );

      await loadRestaurants();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update the restaurant application."
      );
    } finally {
      setActionId(null);
    }
  }

  // Suspend an approved restaurant or reapprove a suspended restaurant.
  async function updateRestaurantStatus(id, status) {
    const confirmed = window.confirm(
      `Are you sure you want to ${status} this restaurant?`
    );

    if (!confirmed) return;

    setActionId(id);
    setError("");
    setSuccess("");

    try {
      const { data } = await api.patch(
        `/admin/restaurants/${id}/status`,
        { status }
      );

      setSuccess(data.message || "Restaurant status updated successfully.");

      await loadRestaurants();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update the restaurant status."
      );
    } finally {
      setActionId(null);
    }
  }

  const visibleRestaurants = restaurants.filter((restaurant) => {
    const term = search.trim().toLowerCase();

    if (!term) return true;

    const owner = restaurant.ownerId || {};
    const address = restaurant.address || {};

    return [
      restaurant.name,
      restaurant.email,
      restaurant.phone,
      owner.name,
      owner.email,
      address.city,
      address.state,
    ].some((value) => String(value || "").toLowerCase().includes(term));
  });

  const totalRestaurants = Object.values(counts).reduce(
    (total, count) => total + Number(count || 0),
    0
  );

  function renderRestaurantTable() {
    if (loading) {
      return (
        <div className="flex justify-center py-16">
          <RefreshCw
            className="animate-spin text-violet-600"
            size={28}
          />
        </div>
      );
    }

    if (visibleRestaurants.length === 0) {
      return (
        <EmptyState
          title={`No ${activeStatus} restaurants found`}
          description="Try another status or search term. New applications will appear here."
        />
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-left">
          <thead className="border-y border-slate-100 bg-slate-50/80">
            <tr>
              {[
                "Restaurant",
                "Owner",
                "Location",
                "Applied",
                "Status",
                "Actions",
              ].map((heading) => (
                <th
                  key={heading}
                  className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {visibleRestaurants.map((restaurant) => {
              const owner = restaurant.ownerId || {};
              const address = restaurant.address || {};
              const busy = actionId === restaurant._id;

              return (
                <tr
                  key={restaurant._id}
                  className="transition hover:bg-slate-50/70"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {restaurant.image ? (
                        <img
                          src={restaurant.image}
                          alt={restaurant.name || "Restaurant"}
                          className="h-10 w-10 shrink-0 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 font-bold text-violet-700">
                          {(restaurant.name || "R")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}

                      <div>
                        <p className="font-semibold text-slate-800">
                          {restaurant.name || "Unnamed restaurant"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {restaurant.email || "No email"}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-700">
                      {owner.name || "Unknown"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {owner.email || "—"}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600">
                    {[address.city, address.state]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600">
                    {formatDate(restaurant.createdAt)}
                  </td>

                  <td className="px-5 py-4">
                    <StatusBadge status={restaurant.status} />
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {restaurant.status === "pending" && (
                        <>
                          <button
                            disabled={busy}
                            onClick={() =>
                              reviewRestaurant(restaurant._id, "approve")
                            }
                            className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Approve
                          </button>

                          <button
                            disabled={busy}
                            onClick={() =>
                              reviewRestaurant(restaurant._id, "reject")
                            }
                            className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {restaurant.status === "approved" && (
                        <button
                          disabled={busy}
                          onClick={() =>
                            updateRestaurantStatus(
                              restaurant._id,
                              "suspended"
                            )
                          }
                          className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                        >
                          Suspend
                        </button>
                      )}

                      {restaurant.status === "suspended" && (
                        <button
                          disabled={busy}
                          onClick={() =>
                            updateRestaurantStatus(
                              restaurant._id,
                              "approved"
                            )
                          }
                          className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                        >
                          Reapprove
                        </button>
                      )}

                      {restaurant.status === "rejected" && (
                        <span className="text-xs text-slate-400">
                          Reviewed
                        </span>
                      )}
                    </div>

                    {busy && (
                      <p className="mt-2 text-xs text-slate-400">
                        Updating…
                      </p>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  function renderOverview() {
    return (
      <>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Customers"
            value="—"
            description="Requires a customer statistics API"
            icon={Users}
            color="violet"
          />

          <StatCard
            title="Restaurants"
            value={totalRestaurants}
            description="Across all restaurant statuses"
            icon={Store}
            color="blue"
          />

          <StatCard
            title="Total orders"
            value="—"
            description="Requires an order statistics API"
            icon={ShoppingBag}
            color="orange"
          />

          <StatCard
            title="Revenue"
            value="—"
            description="Requires verified payment statistics"
            icon={IndianRupee}
            color="emerald"
          />
        </div>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
            <div>
              <h2 className="font-bold text-slate-900">
                Restaurant applications
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Review applications and manage restaurant access.
              </p>
            </div>

            <button
              onClick={() => handlePageChange("restaurants")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              View applications <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-slate-100 p-5 sm:grid-cols-4 sm:p-6">
            {STATUS_TABS.map((status) => {
              const Icon = STATUS_ICONS[status];

              return (
                <button
                  key={status}
                  onClick={() => {
                    handleStatusChange(status);
                    handlePageChange("restaurants");
                  }}
                  className="rounded-xl border border-slate-200 p-4 text-left transition hover:border-violet-300 hover:bg-violet-50/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium capitalize text-slate-500">
                      {status}
                    </span>
                    <Icon size={17} className="text-slate-400" />
                  </div>

                  <p className="mt-3 text-2xl font-bold text-slate-900">
                    {counts[status]}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-bold text-slate-900">Quick actions</h2>
          <p className="mt-1 text-sm text-slate-500">
            Shortcuts to common administrative tasks.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              {
                title: "Review applications",
                detail: `${counts.pending} pending applications`,
                icon: CheckCircle,
                action: () => {
                  handleStatusChange("pending");
                  handlePageChange("restaurants");
                },
              },
              {
                title: "Manage orders",
                detail: "Order API required",
                icon: ShoppingBag,
                action: () => handlePageChange("orders"),
              },
              {
                title: "Manage customers",
                detail: "Customer API required",
                icon: Users,
                action: () => handlePageChange("customers"),
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.title}
                  onClick={item.action}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:border-violet-300 hover:bg-violet-50/40"
                >
                  <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
                    <Icon size={20} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.detail}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </>
    );
  }

  function renderRestaurantsPage() {
    return (
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="font-bold text-slate-900">
              Restaurant management
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Approve, reject, and manage restaurant applications.
            </p>
          </div>

          <button
            onClick={loadRestaurants}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto border-y border-slate-100 px-5 py-3 sm:px-6">
          {STATUS_TABS.map((status) => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold capitalize transition ${
                activeStatus === status
                  ? "bg-violet-100 text-violet-700"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              {status}
              <span className="rounded-md bg-white/80 px-1.5 py-0.5">
                {counts[status]}
              </span>
            </button>
          ))}
        </div>

        <div className="border-b border-slate-100 p-5 sm:px-6">
          <div className="relative max-w-sm">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search restaurants or owners..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
            />
          </div>
        </div>

        {renderRestaurantTable()}
      </section>
    );
  }

  function renderPlaceholderPage() {
    const pages = {
      orders: {
        title: "Order management",
        description:
          "Monitor orders, fulfilment, and delivery status. Connect your order API to display live data.",
        icon: ShoppingBag,
      },
      customers: {
        title: "Customer management",
        description:
          "View customer accounts and manage account status after adding protected customer admin endpoints.",
        icon: Users,
      },
      payments: {
        title: "Payments and revenue",
        description:
          "Monitor verified payments, failed transactions, and refunds after connecting payment reporting endpoints.",
        icon: CreditCard,
      },
    };

    const page = pages[activePage];
    const Icon = page.icon;

    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
          <Icon size={30} />
        </div>

        <h2 className="mt-5 text-xl font-bold text-slate-900">
          {page.title}
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          {page.description}
        </p>

        <div className="mx-auto mt-5 max-w-lg rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
          <AlertCircle size={18} className="mr-2 inline" />
          This section is a placeholder. It does not display live data or
          perform management actions yet.
        </div>

        <button
          onClick={() => handlePageChange("overview")}
          className="mt-6 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
        >
          Back to overview
        </button>
      </div>
    );
  }

  function renderContent() {
    if (activePage === "overview") return renderOverview();
    if (activePage === "restaurants") return renderRestaurantsPage();

    return renderPlaceholderPage();
  }

  const activeNavigation = NAVIGATION.find(
    (item) => item.id === activePage
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-200">
            <UtensilsCrossed size={22} />
          </div>

          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900">
              FoodDash
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-600">
              Admin console
            </p>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            className="ml-auto rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-4 pt-7">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Workspace
          </p>

          <nav className="space-y-1">
            {NAVIGATION.map((item) => {
              const Icon = item.icon;
              const active = activePage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handlePageChange(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                    active
                      ? "bg-violet-50 text-violet-700"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon size={19} />
                  <span>{item.label}</span>

                  {item.id === "restaurants" && counts.pending > 0 && (
                    <span className="ml-auto rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                      {counts.pending}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto border-t border-slate-100 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
              A
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">
                Administrator
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Platform manager
              </p>
            </div>

            <ShieldCheck
              size={18}
              className="shrink-0 text-emerald-600"
            />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <Menu size={20} />
            </button>

            <div className="text-sm text-slate-400">
              Admin <span className="mx-2">/</span>
              <span className="font-semibold capitalize text-slate-800">
                {activeNavigation?.label || "Dashboard"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:inline-flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Admin workspace
            </span>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 font-bold text-violet-700">
              A
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
          <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-600">
                Management console
              </p>

              <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                {activeNavigation?.label || "Dashboard"}
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Manage your food delivery platform from one place.
              </p>
            </div>

            <button
              onClick={() => {
                handleStatusChange("pending");
                handlePageChange("restaurants");
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700"
            >
              <CheckCircle size={17} />
              Review applications
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
            >
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p className="flex-1">{error}</p>
              <button
                onClick={() => setError("")}
                aria-label="Dismiss error"
              >
                <X size={17} />
              </button>
            </div>
          )}

          {success && (
            <div
              role="status"
              className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
            >
              <CheckCircle size={18} className="mt-0.5 shrink-0" />
              <p className="flex-1">{success}</p>
              <button
                onClick={() => setSuccess("")}
                aria-label="Dismiss success message"
              >
                <X size={17} />
              </button>
            </div>
          )}

          {renderContent()}

          <footer className="mt-8 flex flex-col justify-between gap-2 border-t border-slate-200 py-5 text-xs text-slate-400 sm:flex-row">
            <span>FoodDash Admin Console</span>

            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} />
              Protected administrative workspace
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
 