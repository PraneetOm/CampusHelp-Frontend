
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Clock3,
  CheckCircle2,
  ArrowUpRight,
  Plus,
  Building2,
  ClipboardList,
  Users,
} from "lucide-react";

import useAuth from "../hooks/useAuth";
import { getMyBookings, getAllBookings } from "../features/bookings/services/bookingService";
import { getResources } from "../features/bookings/services/resourceService";

function Dashboard() {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const normalizedRole = role?.toUpperCase();
  const isAdmin = normalizedRole === "ADMIN";

  const [bookings, setBookings] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        if (isAdmin) {
          const [bookingData, resourceData] = await Promise.all([
            getAllBookings(),
            getResources(),
          ]);

          if (active) {
            setBookings(bookingData);
            setResources(resourceData);
          }
        } else {
          const bookingData = await getMyBookings();

          if (active) {
            setBookings(bookingData);
          }
        }
      } catch (err) {
        console.error("Dashboard loading failed:", err);

        if (active) {
          setError(
            err.response?.data?.message ||
            err.message ||
            "Unable to load dashboard data."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [isAdmin]);

  const pendingBookings = bookings.filter(
    (booking) => booking.status?.toUpperCase() === "PENDING"
  );

  const confirmedBookings = bookings.filter(
    (booking) => booking.status?.toUpperCase() === "CONFIRMED"
  );

  const now = new Date();

  const upcomingBookings = bookings.filter((booking) => {
    const start = new Date(
      `${booking.bookingDate}T${booking.startTime}`
    );

    return (
      start > now &&
      ["PENDING", "CONFIRMED"].includes(booking.status?.toUpperCase())
    );
  });

  const completedBookings = bookings.filter((booking) => {
    const end = new Date(
      `${booking.bookingDate}T${booking.endTime}`
    );

    return end < now && booking.status?.toUpperCase() === "CONFIRMED";
  });

  const recentBookings = [...bookings]
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    )
    .slice(0, 5);

  function formatDate(dateString) {
    if (!dateString) return "—";

    return new Date(`${dateString}T00:00:00`).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  function formatTime(timeString) {
    if (!timeString) return "—";

    const [hours, minutes] = timeString.split(":");
    const date = new Date();
    date.setHours(Number(hours), Number(minutes), 0, 0);

    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  function formatStatus(status) {
    if (!status) return "Unknown";
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  const displayName = user?.name || user?.email?.split("@")[0] || "there";

  const stats = isAdmin
    ? [
        {
          label: "Pending Requests",
          value: pendingBookings.length,
          note: "Awaiting admin approval",
          icon: ClipboardList,
          color: "gold",
        },
        {
          label: "Total Bookings",
          value: bookings.length,
          note: "All campus requests",
          icon: CalendarDays,
          color: "blue",
        },
        {
          label: "Confirmed",
          value: confirmedBookings.length,
          note: "Approved reservations",
          icon: CheckCircle2,
          color: "green",
        },
        {
          label: "Resources",
          value: resources.length,
          note: "Registered campus resources",
          icon: Building2,
          color: "red",
        },
      ]
    : [
        {
          label: "Total Bookings",
          value: bookings.length,
          note: "Your resource requests",
          icon: CalendarDays,
          color: "blue",
        },
        {
          label: "Upcoming Bookings",
          value: upcomingBookings.length,
          note: "Scheduled ahead",
          icon: Clock3,
          color: "gold",
        },
        {
          label: "Completed",
          value: completedBookings.length,
          note: "Successfully completed",
          icon: CheckCircle2,
          color: "green",
        },
        {
          label: "Open Tickets",
          value: "—",
          note: "Ticket integration pending",
          icon: Users,
          color: "red",
        },
      ];

  return (
    <div className="dashboard">
      <section className="page-heading">
        <div>
          <p className="page-eyebrow">
            {isAdmin ? "ADMINISTRATION" : "CAMPUS OVERVIEW"}
          </p>

          <h1>
            {isAdmin ? "Admin Dashboard" : "Welcome back, " + displayName}
          </h1>

          <p className="page-description">
            {isAdmin
              ? "Monitor campus resources and manage incoming booking requests."
              : normalizedRole === "STAFF"
                ? "Manage your campus resource bookings and activities."
                : "Manage your campus activities and resource bookings."}
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() =>
            navigate(isAdmin ? "/admin/bookings" : "/resources")
          }
        >
          {isAdmin ? <ClipboardList size={18} /> : <Plus size={18} />}
          {isAdmin ? "Review requests" : "Book a resource"}
        </button>
      </section>

      <section className="stats-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article className="stat-card" key={stat.label}>
              <div className="stat-card-top">
                <span>{stat.label}</span>
                <div className={`stat-icon ${stat.color}`}>
                  <Icon size={19} />
                </div>
              </div>

              <h2>{loading ? "..." : error ? "—" : stat.value}</h2>
              <p>{stat.note}</p>
            </article>
          );
        })}
      </section>

      {error && <p className="admin-form-error">{error}</p>}

      {isAdmin ? (
        <>
          <section className="dashboard-grid">
            <div className="content-panel bookings-panel">
              <div className="panel-heading">
                <div>
                  <h2>Pending Resource Requests</h2>
                  <p>
                    {pendingBookings.length} requests awaiting your decision
                  </p>
                </div>

                <button
                  className="text-button"
                  onClick={() => navigate("/admin/bookings")}
                >
                  View all <ArrowUpRight size={15} />
                </button>
              </div>

              <div className="booking-list">
                {loading ? (
                  <p className="empty-state">Loading requests...</p>
                ) : pendingBookings.length === 0 ? (
                  <p className="empty-state">
                    No pending resource requests.
                  </p>
                ) : (
                  pendingBookings.slice(0, 5).map((booking) => (
                    <div className="booking-row" key={booking.id}>
                      <div className="booking-resource-icon">
                        <CalendarDays size={19} />
                      </div>

                      <div className="booking-details">
                        <strong>{booking.resourceName || "Resource"}</strong>
                        <span>{booking.requesterName || "Campus user"}</span>
                      </div>

                      <div className="booking-schedule">
                        <strong>{formatDate(booking.bookingDate)}</strong>
                        <span>
                          {formatTime(booking.startTime)} –{" "}
                          {formatTime(booking.endTime)}
                        </span>
                      </div>

                      <span className="admin-status status-pending">
                        PENDING
                      </span>
                    </div>
                  ))
                )}
              </div>

              <button
                className="panel-footer-button"
                onClick={() => navigate("/admin/bookings")}
              >
                Manage resource requests <ArrowUpRight size={15} />
              </button>
            </div>

            <div className="content-panel quick-panel">
              <div className="panel-heading">
                <div>
                  <h2>Administration</h2>
                  <p>Manage campus operations</p>
                </div>
              </div>

              <button
                className="quick-action"
                onClick={() => navigate("/admin/bookings")}
              >
                <div className="quick-action-icon">
                  <ClipboardList size={19} />
                </div>
                <div>
                  <strong>Resource Requests</strong>
                  <span>Approve or reject booking requests</span>
                </div>
                <ArrowUpRight size={16} />
              </button>

              <button
                className="quick-action"
                onClick={() => navigate("/admin/resources")}
              >
                <div className="quick-action-icon">
                  <Building2 size={19} />
                </div>
                <div>
                  <strong>Resource Management</strong>
                  <span>Add, edit and manage resources</span>
                </div>
                <ArrowUpRight size={16} />
              </button>

              <button
                className="quick-action"
                onClick={() => navigate("/availability")}
              >
                <div className="quick-action-icon">
                  <Clock3 size={19} />
                </div>
                <div>
                  <strong>Resource Availability</strong>
                  <span>View the weekly campus schedule</span>
                </div>
                <ArrowUpRight size={16} />
              </button>
            </div>
          </section>
        </>
      ) : (
        <section className="dashboard-grid">
          <div className="content-panel bookings-panel">
            <div className="panel-heading">
              <div>
                <h2>Recent Bookings</h2>
                <p>Your latest resource reservations</p>
              </div>

              <button
                className="text-button"
                onClick={() => navigate("/bookings")}
              >
                View all <ArrowUpRight size={15} />
              </button>
            </div>

            <div className="booking-list">
              {loading ? (
                <p className="empty-state">Loading your bookings...</p>
              ) : recentBookings.length === 0 ? (
                <p className="empty-state">
                  No bookings found. Book a resource to get started.
                </p>
              ) : (
                recentBookings.map((booking) => (
                  <div className="booking-row" key={booking.id}>
                    <div className="booking-resource-icon">
                      <CalendarDays size={19} />
                    </div>

                    <div className="booking-details">
                      <strong>{booking.resourceName || "Resource"}</strong>
                      <span>Campus Resource</span>
                    </div>

                    <div className="booking-schedule">
                      <strong>{formatDate(booking.bookingDate)}</strong>
                      <span>
                        {formatTime(booking.startTime)} –{" "}
                        {formatTime(booking.endTime)}
                      </span>
                    </div>

                    <span
                      className={`status-badge ${
                        booking.status?.toLowerCase() || "pending"
                      }`}
                    >
                      <span />
                      {formatStatus(booking.status)}
                    </span>
                  </div>
                ))
              )}
            </div>

            <button
              className="panel-footer-button"
              onClick={() => navigate("/bookings")}
            >
              View all bookings <ArrowUpRight size={15} />
            </button>
          </div>

          <div className="content-panel quick-panel">
            <div className="panel-heading">
              <div>
                <h2>Quick Actions</h2>
                <p>Common campus activities</p>
              </div>
            </div>

            <button
              className="quick-action"
              onClick={() => navigate("/resources")}
            >
              <div className="quick-action-icon">
                <CalendarDays size={19} />
              </div>
              <div>
                <strong>Book a resource</strong>
                <span>Find and reserve campus facilities</span>
              </div>
              <ArrowUpRight size={16} />
            </button>

            <button
              className="quick-action"
              onClick={() => navigate("/availability")}
            >
              <div className="quick-action-icon">
                <Clock3 size={19} />
              </div>
              <div>
                <strong>Check availability</strong>
                <span>View the weekly resource schedule</span>
              </div>
              <ArrowUpRight size={16} />
            </button>

            <button
              className="quick-action"
              onClick={() => navigate("/bookings")}
            >
              <div className="quick-action-icon">
                <Building2 size={19} />
              </div>
              <div>
                <strong>My bookings</strong>
                <span>Track and manage your reservations</span>
              </div>
              <ArrowUpRight size={16} />
            </button>
          </div>
        </section>
      )}

      <section className="dashboard-bottom">
        <div className="content-panel welcome-panel">
          <div className="welcome-icon">
            <Users size={22} />
          </div>

          <div>
            <h2>
              {isAdmin
                ? "Your campus, under control."
                : "Your campus, better connected."}
            </h2>
            <p>
              {isAdmin
                ? "Review requests and keep campus resources organized."
                : "Access facilities, manage reservations and stay updated with campus services."}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;