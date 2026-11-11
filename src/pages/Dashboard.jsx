import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  CalendarDays,
  Clock3,
  CheckCircle2,
  Ticket,
  ArrowUpRight,
  Plus,
  MapPin,
  Users,
} from 'lucide-react';

import { getMyBookings } from '../features/bookings/services/bookingService';

function Dashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError('');

        const data = await getMyBookings();
        setBookings(data);
      } catch (err) {
        console.error('Dashboard loading failed:', err);
        setError(
          err.response?.data?.message ||
          'Unable to load dashboard data. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const now = new Date();

  const totalBookings = bookings.length;

  const upcomingBookings = bookings.filter((booking) => {
    const start = new Date(
      `${booking.bookingDate}T${booking.startTime}`
    );

    return (
      start > now &&
      ['PENDING', 'CONFIRMED'].includes(
        booking.status?.toUpperCase()
      )
    );
  }).length;

  const completedBookings = bookings.filter((booking) => {
    const end = new Date(
      `${booking.bookingDate}T${booking.endTime}`
    );

    return (
      end < now &&
      booking.status?.toUpperCase() === 'CONFIRMED'
    );
  }).length;

  const recentBookings = [...bookings]
    .sort((a, b) => {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    })
    .slice(0, 3);

  const stats = [
    {
      label: 'Total Bookings',
      value: totalBookings,
      note: 'Across all resources',
      icon: CalendarDays,
      color: 'blue',
    },
    {
      label: 'Upcoming Bookings',
      value: upcomingBookings,
      note: 'Scheduled ahead',
      icon: Clock3,
      color: 'gold',
    },
    {
      label: 'Completed',
      value: completedBookings,
      note: 'Successfully completed',
      icon: CheckCircle2,
      color: 'green',
    },
    {
      label: 'Open Tickets',
      value: '—',
      note: 'Ticket integration pending',
      icon: Ticket,
      color: 'red',
    },
  ];

  function formatDate(dateString) {
    if (!dateString) return '—';

    return new Date(`${dateString}T00:00:00`).toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    );
  }

  function formatTime(timeString) {
    if (!timeString) return '—';

    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(Number(hours), Number(minutes), 0, 0);

    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  function formatStatus(status) {
    if (!status) return 'Unknown';

    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  return (
    <div className="dashboard">
      <section className="page-heading">
        <div>
          <p className="page-eyebrow">CAMPUS OVERVIEW</p>
          <h1>Dashboard</h1>
          <p className="page-description">
            Manage your campus activities and resource bookings.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => navigate('/resources')}
        >
          <Plus size={18} />
          Book a resource
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

              <h2>
                {loading ? '...' : error && stat.label !== 'Open Tickets'
                  ? '—'
                  : stat.value}
              </h2>

              <p>{stat.note}</p>
            </article>
          );
        })}
      </section>

      <section className="dashboard-grid">
        <div className="content-panel bookings-panel">
          <div className="panel-heading">
            <div>
              <h2>Recent Bookings</h2>
              <p>Your latest resource reservations</p>
            </div>

            <button className="text-button">
              View all <ArrowUpRight size={15} />
            </button>
          </div>

          <div className="booking-list">
            {loading && (
              <p className="empty-state">
                Loading your bookings...
              </p>
            )}

            {!loading && error && (
              <p className="empty-state">{error}</p>
            )}

            {!loading && !error && recentBookings.length === 0 && (
              <p className="empty-state">
                No bookings found. Book a resource to get started.
              </p>
            )}

            {!loading && !error && recentBookings.map((booking) => (
              <div className="booking-row" key={booking.id}>
                <div className="booking-resource-icon">
                  <CalendarDays size={19} />
                </div>

                <div className="booking-details">
                  <strong>{booking.resourceName || 'Resource'}</strong>
                  <span>{booking.resourceType || 'Campus Resource'}</span>
                </div>

                <div className="booking-schedule">
                  <strong>{formatDate(booking.bookingDate)}</strong>
                  <span>
                    {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
                  </span>
                </div>

                <span
                  className={`status-badge ${booking.status?.toLowerCase() || 'pending'
                    }`}
                >
                  <span />
                  {formatStatus(booking.status)}
                </span>
              </div>
            ))}
          </div>

          <button className="panel-footer-button">
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

          <button className="quick-action">
            <div className="quick-action-icon">
              <CalendarDays size={19} />
            </div>
            <div>
              <strong>Book a resource</strong>
              <span>Find and reserve campus facilities</span>
            </div>
            <ArrowUpRight size={16} />
          </button>

          <button className="quick-action">
            <div className="quick-action-icon">
              <Ticket size={19} />
            </div>
            <div>
              <strong>Raise a ticket</strong>
              <span>Report an issue or request assistance</span>
            </div>
            <ArrowUpRight size={16} />
          </button>

          <button className="quick-action">
            <div className="quick-action-icon">
              <MapPin size={19} />
            </div>
            <div>
              <strong>Explore resources</strong>
              <span>Browse available campus facilities</span>
            </div>
            <ArrowUpRight size={16} />
          </button>
        </div>
      </section>

      <section className="dashboard-bottom">
        <div className="content-panel welcome-panel">
          <div className="welcome-icon">
            <Users size={22} />
          </div>

          <div>
            <h2>Your campus, better connected.</h2>
            <p>
              Access facilities, manage reservations and stay updated
              with campus services from one place.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
