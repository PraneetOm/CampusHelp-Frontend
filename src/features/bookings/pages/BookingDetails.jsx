
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  MapPin,
  Users,
  FileText,
  XCircle,
  RefreshCw,
} from 'lucide-react';

import {
  getBookingById,
  cancelBooking,
} from '../services/bookingService';

function formatDate(dateString) {
  if (!dateString) return '—';

  const [year, month, day] = dateString.split('-').map(Number);

  return new Date(year, month - 1, day).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(timeString) {
  if (!timeString) return '—';

  const [hours, minutes] = timeString.split(':').map(Number);
  const suffix = hours >= 12 ? 'PM' : 'AM';

  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

function BookingStatus({ status }) {
  return (
    <span className={`booking-status ${status.toLowerCase()}`}>
      <span />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="booking-detail-item">
      <div className="booking-detail-icon">
        <Icon size={17} />
      </div>

      <div>
        <span>{label}</span>
        <strong>{value || '—'}</strong>
      </div>
    </div>
  );
}

function BookingDetails() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const loadBooking = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const data = await getBookingById(bookingId);

      if (!data) {
        setBooking(null);
        setError('Booking not found.');
        return;
      }

      setBooking(data);
    } catch {
      setError('Unable to load booking details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  async function handleCancel() {
    const confirmed = window.confirm(
      'Are you sure you want to cancel this booking?'
    );

    if (!confirmed) return;

    try {
      setCancelling(true);
      setError('');

      await cancelBooking(bookingId);
      await loadBooking();
    } catch (err) {
      setError(err.message || 'Unable to cancel this booking.');
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return <div className="resource-message">Loading booking details...</div>;
  }

  if (!booking) {
    return (
      <div className="booking-details-page">
        <Link to="/bookings" className="back-link">
          <ArrowLeft size={16} /> Back to My Bookings
        </Link>

        <div className="resource-message error-message">
          {error || 'Booking not found.'}
        </div>
      </div>
    );
  }

  const canCancel = ['PENDING', 'CONFIRMED'].includes(booking.status);

  return (
    <div className="booking-details-page">
      <Link to="/bookings" className="back-link">
        <ArrowLeft size={16} /> Back to My Bookings
      </Link>

      <section className="page-heading booking-detail-heading">
        <div>
          <p className="page-eyebrow">RESERVATION DETAILS</p>
          <h1>{booking.resourceName}</h1>
          <p className="page-description">
            Booking reference: <strong>{booking.id}</strong>
          </p>
        </div>

        <BookingStatus status={booking.status} />
      </section>

      {error && (
        <div className="booking-error">
          <XCircle size={16} />
          {error}
        </div>
      )}

      <div className="booking-details-layout">
        <section className="content-panel booking-details-panel">
          <div className="booking-details-panel-heading">
            <h2>Booking information</h2>
            <span>{booking.resourceType}</span>
          </div>

          <div className="booking-details-grid">
            <DetailItem
              icon={CalendarDays}
              label="Booking date"
              value={formatDate(booking.bookingDate)}
            />

            <DetailItem
              icon={Clock3}
              label="Time"
              value={`${formatTime(booking.startTime)} – ${formatTime(booking.endTime)}`}
            />

            <DetailItem
              icon={MapPin}
              label="Location"
              value={booking.location}
            />

            <DetailItem
              icon={Users}
              label="Attendees"
              value={booking.attendeeCount}
            />

            <DetailItem
              icon={FileText}
              label="Booking reference"
              value={booking.id}
            />
          </div>

          <div className="booking-purpose-section">
            <h3>Purpose of booking</h3>
            <p>{booking.purpose || 'No purpose provided.'}</p>
          </div>
        </section>

        <aside className="content-panel booking-details-sidebar">
          <div className="booking-details-panel-heading">
            <h2>Booking status</h2>
          </div>

          <div className="booking-status-content">
            <BookingStatus status={booking.status} />

            <p>
              {booking.status === 'PENDING' &&
                'Your booking request is awaiting approval.'}

              {booking.status === 'CONFIRMED' &&
                'Your reservation has been confirmed.'}

              {booking.status === 'CANCELLED' &&
                'This reservation has been cancelled.'}

              {booking.status === 'COMPLETED' &&
                'This reservation has been completed.'}
            </p>

            {booking.createdAt && (
              <div className="booking-created-date">
                <span>Requested on</span>
                <strong>
                  {new Date(booking.createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </strong>
              </div>
            )}

            {canCancel && (
              <button
                className="cancel-booking-button booking-detail-cancel"
                onClick={handleCancel}
                disabled={cancelling}
              >
                <XCircle size={16} />
                {cancelling ? 'Cancelling...' : 'Cancel reservation'}
              </button>
            )}

            <button
              className="secondary-button booking-back-button"
              onClick={() => navigate('/bookings')}
            >
              <ArrowLeft size={15} />
              Back to bookings
            </button>

            <button
              className="booking-refresh-button"
              onClick={loadBooking}
              disabled={loading}
            >
              <RefreshCw size={14} />
              Refresh details
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default BookingDetails;
