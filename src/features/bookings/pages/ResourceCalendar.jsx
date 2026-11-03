
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  RefreshCw,
} from 'lucide-react';

import { getResources } from '../services/resourceService';
import { getResourceAvailability } from '../services/bookingService';

function toDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatTime(time) {
  const [hours, minutes] = time.split(':').map(Number);
  const suffix = hours >= 12 ? 'PM' : 'AM';

  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

function ResourceCalendar() {
  const navigate = useNavigate();

  const [resources, setResources] = useState([]);
  const [resourceId, setResourceId] = useState('');
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    today.setDate(today.getDate() - today.getDay() + 1);
    return today;
  });

  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      return date;
    });
  }, [weekStart]);

  const selectedResource = resources.find(
    (resource) => String(resource.id) === String(resourceId)
  );

  useEffect(() => {
    let active = true;

    async function loadResources() {
      try {
        const data = await getResources();

        if (!active) return;

        setResources(data);

        if (data.length > 0) {
          setResourceId(String(data[0].id));
        }
      } catch {
        if (active) setError('Unable to load campus resources.');
      }
    }

    loadResources();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!resourceId || weekDays.length === 0) return;

    let active = true;

    async function loadAvailability() {
      try {
        setLoading(true);
        setError('');

        const from = toDateString(weekDays[0]);
        const to = toDateString(weekDays[6]);

        const data = await getResourceAvailability(resourceId, from, to);

        if (active) setAvailability(data);
      } catch {
        if (active) {
          setAvailability({});
          setError('Unable to load resource availability.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAvailability();

    return () => {
      active = false;
    };
  }, [resourceId, weekStart]);

  function changeWeek(amount) {
    setWeekStart((current) => {
      const next = new Date(current);
      next.setDate(next.getDate() + amount * 7);
      return next;
    });
  }

  function openBooking(date, slot) {
    navigate(
      `/resources/${resourceId}/book?date=${date}&start=${slot.startTime}&end=${slot.endTime}`
    );
  }

  const weekLabel = `${weekDays[0].toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
  })} – ${weekDays[6].toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })}`;

  return (
    <div className="resource-calendar-page">
      <section className="page-heading">
        <div>
          <p className="page-eyebrow">CAMPUS SERVICES</p>
          <h1>Resource Availability</h1>
          <p className="page-description">
            Check campus resource schedules before making a reservation.
          </p>
        </div>

        <Link to="/resources" className="secondary-button">
          <CalendarDays size={16} />
          Browse resources
        </Link>
      </section>

      <section className="content-panel calendar-toolbar">
        <div className="calendar-resource-select">
          <label htmlFor="calendar-resource">Select resource</label>
          <select
            id="calendar-resource"
            value={resourceId}
            onChange={(event) => setResourceId(event.target.value)}
          >
            {resources.map((resource) => (
              <option key={resource.id} value={resource.id}>
                {resource.name}
              </option>
            ))}
          </select>
        </div>

        <div className="calendar-week-controls">
          <button
            type="button"
            className="calendar-nav-button"
            onClick={() => changeWeek(-1)}
            aria-label="Previous week"
          >
            <ChevronLeft size={18} />
          </button>

          <strong>{weekLabel}</strong>

          <button
            type="button"
            className="calendar-nav-button"
            onClick={() => changeWeek(1)}
            aria-label="Next week"
          >
            <ChevronRight size={18} />
          </button>

          <button
            type="button"
            className="calendar-today-button"
            onClick={() => {
              const today = new Date();
              today.setHours(12, 0, 0, 0);
              today.setDate(today.getDate() - today.getDay() + 1);
              setWeekStart(today);
            }}
          >
            Today
          </button>
        </div>
      </section>

      {selectedResource && (
        <section className="calendar-resource-info">
          <div>
            <strong>{selectedResource.name}</strong>
            <span>{selectedResource.type}</span>
          </div>
          <span>
            <MapPin size={14} />
            {selectedResource.building}, {selectedResource.location}
          </span>
        </section>
      )}

      <div className="calendar-legend">
        <span><i className="legend-available" /> Available</span>
        <span><i className="legend-occupied" /> Occupied</span>
      </div>

      {error && (
        <div className="booking-error">
          {error}
          <button onClick={() => setWeekStart(new Date(weekStart))}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {!error && loading && (
        <div className="resource-message">Loading weekly schedule...</div>
      )}

      {!error && !loading && resources.length === 0 && (
        <div className="resource-message">No resources found.</div>
      )}

      {!error && !loading && selectedResource && (
        <section className="content-panel calendar-panel">
          <div className="calendar-grid">
            <div className="calendar-header calendar-time-heading">
              <Clock3 size={15} />
            </div>

            {weekDays.map((day) => (
              <div className="calendar-header" key={toDateString(day)}>
                <span>
                  {day.toLocaleDateString('en-IN', { weekday: 'short' })}
                </span>
                <strong>{day.getDate()}</strong>
              </div>
            ))}

            {Array.from({ length: 8 }, (_, index) => {
              const startHour = 9 + index;
              const startTime = `${String(startHour).padStart(2, '0')}:00:00`;
              const endTime = `${String(startHour + 1).padStart(2, '0')}:00:00`;

              return (
                <div className="calendar-row" key={startTime}>
                  <div className="calendar-time">
                    {formatTime(startTime)}
                  </div>

                  {weekDays.map((day) => {
                    const date = toDateString(day);
                    const slot = availability[date]?.find(
                      (item) =>
                        item.startTime === startTime &&
                        item.endTime === endTime
                    );

                    return (
                      <div className="calendar-cell" key={date}>
                        {slot ? (
                          <button
                            type="button"
                            disabled={!slot.available}
                            className={`calendar-slot ${
                              slot.available ? 'available' : 'occupied'
                            }`}
                            onClick={() => openBooking(date, slot)}
                            title={
                              slot.available
                                ? 'Book this time slot'
                                : 'This time slot is occupied'
                            }
                          >
                            {slot.available ? 'Available' : 'Occupied'}
                          </button>
                        ) : (
                          <span className="calendar-slot-unavailable">—</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

export default ResourceCalendar;
