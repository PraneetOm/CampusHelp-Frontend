
import { useEffect, useMemo, useState } from 'react';
import {
  getAllBookings,
  updateBookingStatus,
} from '../services/bookingService';

function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadBookings() {
    setLoading(true);

    try {
      const data = await getAllBookings();
      setBookings(data);
    } catch (err) {
      setError(err.message || 'Unable to load bookings.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, []);

  const pending = bookings.filter(
    (booking) => booking.status === 'PENDING'
  ).length;

  const confirmed = bookings.filter(
    (booking) => booking.status === 'CONFIRMED'
  ).length;

  const rejected = bookings.filter(
    (booking) => booking.status === 'REJECTED'
  ).length;

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const query = search.toLowerCase();

      const matchesSearch =
        booking.id.toLowerCase().includes(query) ||
        booking.resourceName.toLowerCase().includes(query) ||
        booking.purpose.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === 'ALL' ||
        booking.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [bookings, search, statusFilter]);

  async function handleReview(bookingId, status) {
    const action = status === 'CONFIRMED' ? 'approve' : 'reject';

    if (!window.confirm(`Are you sure you want to ${action} this booking?`)) {
      return;
    }

    setError('');

    try {
      await updateBookingStatus(bookingId, status);
      await loadBookings();
    } catch (err) {
      setError(err.message || 'Unable to update booking.');
    }
  }

  return (
    <div className="admin-bookings-page">
      <div className="admin-page-header">
        <div>
          <p className="admin-eyebrow">ADMINISTRATION / BOOKINGS</p>
          <h1>Booking Management</h1>
          <p className="admin-subtitle">
            Review and manage campus resource booking requests.
          </p>
        </div>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <span>Total Bookings</span>
          <strong>{bookings.length}</strong>
          <small>All booking requests</small>
        </div>

        <div className="admin-stat-card">
          <span>Pending</span>
          <strong>{pending}</strong>
          <small>Awaiting review</small>
        </div>

        <div className="admin-stat-card">
          <span>Confirmed</span>
          <strong>{confirmed}</strong>
          <small>Approved bookings</small>
        </div>

        <div className="admin-stat-card">
          <span>Rejected</span>
          <strong>{rejected}</strong>
          <small>Declined requests</small>
        </div>
      </div>

      <section className="admin-inventory">
        <div className="admin-inventory-heading">
          <div>
            <h2>Booking Requests</h2>
            <p>{filteredBookings.length} bookings found</p>
          </div>
        </div>

        <div className="admin-filters">
          <input
            type="text"
            placeholder="Search booking ID, resource or purpose..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="ALL">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {error && <p className="admin-form-error">{error}</p>}

        {loading ? (
          <p>Loading bookings...</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-resource-table">
              <thead>
                <tr>
                  <th>BOOKING</th>
                  <th>RESOURCE</th>
                  <th>DATE & TIME</th>
                  <th>PURPOSE</th>
                  <th>ATTENDEES</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {filteredBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>
                      <strong>{booking.id}</strong>
                    </td>

                    <td>
                      <strong>{booking.resourceName}</strong>
                      <small>{booking.resourceType}</small>
                    </td>

                    <td>
                      {booking.bookingDate}
                      <small>
                        {booking.startTime.slice(0, 5)} –{' '}
                        {booking.endTime.slice(0, 5)}
                      </small>
                    </td>

                    <td>{booking.purpose}</td>
                    <td>{booking.attendeeCount}</td>

                    <td>
                      <span
                        className={`admin-status status-${booking.status.toLowerCase()}`}
                      >
                        {booking.status}
                      </span>
                    </td>

                    <td>
                      {booking.status === 'PENDING' ? (
                        <div className="admin-actions">
                          <button
                            onClick={() =>
                              handleReview(booking.id, 'CONFIRMED')
                            }
                          >
                            Approve
                          </button>

                          <button
                            className="admin-reject-btn"
                            onClick={() =>
                              handleReview(booking.id, 'REJECTED')
                            }
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="admin-no-action">—</span>
                      )}
                    </td>
                  </tr>
                ))}

                {filteredBookings.length === 0 && (
                  <tr>
                    <td colSpan="7" className="admin-empty">
                      No bookings found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminBookings;
