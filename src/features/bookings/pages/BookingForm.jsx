import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
    ArrowLeft,
    CalendarDays,
    Clock3,
    MapPin,
    Users,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react';

import { getResourceById } from '../services/resourceService';
import {
    getAvailableSlots,
    createBooking,
} from '../services/bookingService';

function getToday() {
    const date = new Date();
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60000)
        .toISOString()
        .slice(0, 10);
}

function formatTime(time) {
    const [hours, minutes] = time.split(':').map(Number);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;

    return `${formattedHours}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

function BookingForm() {
    const { resourceId } = useParams();
    const navigate = useNavigate();

    const [searchParams] = useSearchParams();

    const requestedStart = searchParams.get('start');
    const requestedEnd = searchParams.get('end');
    const requestedDate = searchParams.get('date');

    const [resource, setResource] = useState(null);
    const [date, setDate] = useState(requestedDate || getToday());
    const [slots, setSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [purpose, setPurpose] = useState('');
    const [attendeeCount, setAttendeeCount] = useState(1);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        let active = true;

        async function loadResource() {
            try {
                const data = await getResourceById(resourceId);

                if (active) {
                    setResource(data);
                }
            } catch {
                if (active) setError('Unable to load resource details.');
            } finally {
                if (active) setLoading(false);
            }
        }

        loadResource();

        return () => {
            active = false;
        };
    }, [resourceId]);

    useEffect(() => {
        let active = true;

        async function loadAvailability() {
            try {
                setSelectedSlot(null);
                setError('');

                const data = await getAvailableSlots(resourceId, date);

                if (active) {
                    setSlots(data);

                    const requestedSlot =
                        requestedStart && requestedEnd
                            ? data.find(
                                (slot) =>
                                    slot.startTime.startsWith(requestedStart) &&
                                    slot.endTime.startsWith(requestedEnd)
                            )
                            : null;

                    setSelectedSlot(
                        requestedSlot?.available ? requestedSlot : null
                    );
                }
            } catch {
                if (active) {
                    setSlots([]);
                    setError('Unable to load available time slots.');
                }
            }
        }

        loadAvailability();

        return () => {
            active = false;
        };
    }, [resourceId, date, requestedStart, requestedEnd]);

    async function handleSubmit(event) {
        event.preventDefault();

        if (!selectedSlot) {
            setError('Please select an available time slot.');
            return;
        }

        if (!purpose.trim()) {
            setError('Please enter the purpose of your booking.');
            return;
        }

        const requestedAttendees = Number(attendeeCount);

        if (
            !Number.isInteger(requestedAttendees) ||
            requestedAttendees < 1
        ) {
            setError('Please enter a valid attendee count of at least 1.');
            return;
        }

        if (
            resource.capacity != null &&
            requestedAttendees > resource.capacity
        ) {
            setError(`Maximum capacity for this resource is ${resource.capacity}.`);
            return;
        }

        try {
            setSubmitting(true);
            setError('');

            const booking = await createBooking({
                resourceId,
                bookingDate: date,
                startTime: selectedSlot.startTime,
                endTime: selectedSlot.endTime,
                purpose: purpose.trim(),
                attendeeCount: requestedAttendees,
            });

            setSuccess(booking);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Booking could not be completed. Please try again.'
            );
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return <div className="resource-message">Loading resource...</div>;
    }

    if (!resource) {
        return <div className="resource-message">Resource not found.</div>;
    }

    if (success) {
        return (
            <div className="booking-success">
                <div className="success-icon">
                    <CheckCircle2 size={35} />
                </div>

                <h1>Booking request submitted</h1>
                <p>Your reservation request has been recorded.</p>

                <div className="success-details">
                    <span>Booking reference</span>
                    <strong>{success.id}</strong>

                    <span>Resource</span>
                    <strong>{resource.name}</strong>

                    <span>Date</span>
                    <strong>{date}</strong>

                    <span>Time</span>
                    <strong>
                        {formatTime(success.startTime)} – {formatTime(success.endTime)}
                    </strong>

                    <span>Attendees</span>
                    <strong>{success.attendeeCount}</strong>

                    <span>Status</span>
                    <strong>{success.status}</strong>
                </div>

                <button
                    className="primary-button"
                    onClick={() => navigate('/resources')}
                >
                    Back to resources
                </button>
            </div>
        );
    }

    return (
        <div className="booking-page">
            <button
                className="back-link booking-back"
                onClick={() => navigate(`/resources/${resourceId}`)}
            >
                <ArrowLeft size={16} />
                Back to resource
            </button>

            <section className="page-heading">
                <div>
                    <p className="page-eyebrow">RESOURCE ALLOCATION</p>
                    <h1>Book a Resource</h1>
                    <p className="page-description">
                        Select your preferred date and reserve a time slot.
                    </p>
                </div>
            </section>

            <div className="booking-layout">
                <section className="content-panel booking-form-panel">
                    <div className="panel-heading">
                        <div>
                            <h2>Booking details</h2>
                            <p>Provide the details for your reservation.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="booking-form">
                        <div className="form-field">
                            <label>Booking date</label>
                            <div className="form-input-icon">
                                <CalendarDays size={17} />
                                <input
                                    type="date"
                                    value={date}
                                    min={getToday()}
                                    onChange={(event) => setDate(event.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-field">
                            <label>Available time slots</label>

                            <div className="time-slot-grid">
                                {slots.map((slot) => {
                                    const slotId = `${slot.startTime}-${slot.endTime}`;

                                    return (
                                        <button
                                            key={slotId}
                                            type="button"
                                            disabled={!slot.available}
                                            className={`time-slot ${selectedSlot === slot ? 'selected' : ''
                                                } ${!slot.available ? 'occupied' : ''}`}
                                            onClick={() => setSelectedSlot(slot)}
                                        >
                                            <Clock3 size={15} />
                                            <span>
                                                {formatTime(slot.startTime)}
                                                {' – '}
                                                {formatTime(slot.endTime)}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="slot-legend">
                                <span><i className="legend-available" /> Available</span>
                                <span><i className="legend-selected" /> Selected</span>
                                <span><i className="legend-occupied" /> Occupied</span>
                            </div>
                        </div>

                        <div className="form-field">
                            <label htmlFor="purpose">Purpose of booking</label>
                            <textarea
                                id="purpose"
                                rows="4"
                                maxLength="500"
                                placeholder="Explain why you need this resource..."
                                value={purpose}
                                onChange={(event) => setPurpose(event.target.value)}
                                required
                            />
                            <span className="field-hint">
                                {purpose.length}/500 characters
                            </span>
                        </div>

                        <div className="form-field">
                            <label htmlFor="attendees">Number of attendees</label>
                            <input
                                id="attendees"
                                type="number"
                                min="1"
                                max={resource.capacity}
                                value={attendeeCount}
                                onChange={(event) =>
                                    setAttendeeCount(event.target.value)
                                }
                                required
                            />
                            <span className="field-hint">
                                Maximum capacity: {resource.capacity}
                            </span>
                        </div>

                        {error && (
                            <div className="booking-error">
                                <AlertCircle size={17} />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="primary-button submit-booking"
                            disabled={submitting}
                        >
                            {submitting ? 'Submitting...' : 'Submit booking request'}
                        </button>
                    </form>
                </section>

                <aside className="content-panel booking-summary">
                    <div className="panel-heading">
                        <div>
                            <h2>Resource summary</h2>
                            <p>Review before submitting.</p>
                        </div>
                    </div>

                    <div className="booking-summary-body">
                        <div className="resource-type-icon">
                            <CalendarDays size={23} />
                        </div>

                        <h3>{resource.name}</h3>
                        <span className="resource-category">{resource.type}</span>

                        <div className="summary-divider" />

                        <p><MapPin size={16} /> {resource.building}, {resource.location}</p>
                        <p><Users size={16} /> Capacity: {resource.capacity}</p>

                        <div className="summary-divider" />

                        <span className="summary-label">Selected date</span>
                        <strong>{date}</strong>

                        <span className="summary-label">Selected time</span>
                        <strong>
                            {selectedSlot
                                ? `${formatTime(selectedSlot.startTime)} – ${formatTime(selectedSlot.endTime)}`
                                : 'No time selected'}
                        </strong>
                    </div>
                </aside>
            </div>
        </div>
    );
}

export default BookingForm;
