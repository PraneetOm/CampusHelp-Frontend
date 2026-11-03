import { Link } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    CalendarDays,
    Clock3,
    MapPin,
    Users,
    Search,
    XCircle,
    RefreshCw,
} from 'lucide-react';

import {
    getMyBookings,
    cancelBooking,
} from '../services/bookingService';

const filters = ['All', 'Pending', 'Confirmed', 'Cancelled', 'Completed'];

function formatDate(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);

    return new Date(year, month - 1, day).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function formatTime(timeString) {
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

function MyBookings() {
    const [bookings, setBookings] = useState([]);
    const [activeFilter, setActiveFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [cancellingId, setCancellingId] = useState(null);

    const loadBookings = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            const data = await getMyBookings();
            setBookings(data);
        } catch {
            setError('Unable to load your bookings. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadBookings();
    }, [loadBookings]);

    const filteredBookings = useMemo(() => {
        return bookings.filter((booking) => {
            const matchesStatus =
                activeFilter === 'All' ||
                booking.status === activeFilter.toUpperCase();

            const searchText = [
                booking.id,
                booking.resourceName,
                booking.resourceType,
                booking.purpose,
            ].join(' ').toLowerCase();

            return matchesStatus && searchText.includes(search.toLowerCase());
        });
    }, [bookings, activeFilter, search]);

    const counts = useMemo(() => ({
        total: bookings.length,
        pending: bookings.filter((b) => b.status === 'PENDING').length,
        confirmed: bookings.filter((b) => b.status === 'CONFIRMED').length,
        cancelled: bookings.filter((b) => b.status === 'CANCELLED').length,
    }), [bookings]);

    async function handleCancel(bookingId) {
        const confirmed = window.confirm(
            'Are you sure you want to cancel this booking?'
        );

        if (!confirmed) return;

        try {
            setCancellingId(bookingId);
            setError('');

            await cancelBooking(bookingId);
            await loadBookings();
        } catch (err) {
            setError(err.message || 'Unable to cancel this booking.');
        } finally {
            setCancellingId(null);
        }
    }

    return (
        <div className="my-bookings">
            <section className="page-heading">
                <div>
                    <p className="page-eyebrow">CAMPUS SERVICES</p>
                    <h1>My Bookings</h1>
                    <p className="page-description">
                        Track and manage your campus resource reservations.
                    </p>
                </div>

                <button
                    className="secondary-button"
                    onClick={loadBookings}
                    disabled={loading}
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </section>

            <section className="booking-stats">
                <div className="booking-stat">
                    <span>Total bookings</span>
                    <strong>{counts.total}</strong>
                </div>

                <div className="booking-stat">
                    <span>Pending</span>
                    <strong>{counts.pending}</strong>
                </div>

                <div className="booking-stat">
                    <span>Confirmed</span>
                    <strong>{counts.confirmed}</strong>
                </div>

                <div className="booking-stat">
                    <span>Cancelled</span>
                    <strong>{counts.cancelled}</strong>
                </div>
            </section>

            <section className="content-panel my-bookings-panel">
                <div className="booking-list-toolbar">
                    <div>
                        <h2>Reservation history</h2>
                        <p>All your resource booking requests</p>
                    </div>

                    <div className="my-bookings-search">
                        <Search size={17} />
                        <input
                            type="search"
                            placeholder="Search bookings..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>
                </div>

                <div className="booking-tabs">
                    {filters.map((filter) => (
                        <button
                            key={filter}
                            className={activeFilter === filter ? 'active' : ''}
                            onClick={() => setActiveFilter(filter)}
                        >
                            {filter}
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="booking-error page-booking-error">
                        <XCircle size={17} />
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="resource-message">Loading your bookings...</div>
                ) : filteredBookings.length === 0 ? (
                    <div className="booking-empty">
                        <CalendarDays size={30} />
                        <h3>No bookings found</h3>
                        <p>Try changing your filters or search term.</p>
                    </div>
                ) : (
                    <div className="my-booking-list">
                        {filteredBookings.map((booking) => (
                            <article className="my-booking-card" key={booking.id}>
                                <div className="my-booking-main">
                                    <div className="my-booking-icon">
                                        <CalendarDays size={20} />
                                    </div>

                                    <div className="my-booking-info">
                                        <div className="my-booking-title">
                                            <h3>{booking.resourceName}</h3>
                                            <BookingStatus status={booking.status} />
                                        </div>

                                        <span className="booking-reference">
                                            {booking.id} · {booking.resourceType}
                                        </span>

                                        <div className="my-booking-meta">
                                            <span>
                                                <CalendarDays size={14} />
                                                {formatDate(booking.bookingDate)}
                                            </span>

                                            <span>
                                                <Clock3 size={14} />
                                                {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
                                            </span>

                                            <span>
                                                <MapPin size={14} />
                                                {booking.location}
                                            </span>

                                            <span>
                                                <Users size={14} />
                                                {booking.attendeeCount} attendees
                                            </span>
                                        </div>

                                        <p className="booking-purpose">
                                            <strong>Purpose:</strong> {booking.purpose}
                                        </p>
                                    </div>
                                </div>

                                <div className="my-booking-actions">
                                    <Link
                                        to={`/bookings/${booking.id}`}
                                        className="view-booking-button"
                                    >
                                        View details
                                    </Link>

                                    {['PENDING', 'CONFIRMED'].includes(booking.status) && (
                                        <button
                                            className="cancel-booking-button"
                                            disabled={cancellingId === booking.id}
                                            onClick={() => handleCancel(booking.id)}
                                        >
                                            <XCircle size={15} />
                                            {cancellingId === booking.id ? 'Cancelling...' : 'Cancel booking'}
                                        </button>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

export default MyBookings;
