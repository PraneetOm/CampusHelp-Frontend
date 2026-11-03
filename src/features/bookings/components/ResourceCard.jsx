
import {
  MapPin,
  Users,
  Monitor,
  ArrowUpRight,
  CalendarDays,
} from 'lucide-react';
import { Link } from 'react-router-dom';

function ResourceCard({ resource }) {
  const isAvailable = resource.status === 'AVAILABLE';

  return (
    <article className="resource-card">
      <div className="resource-card-header">
        <div className="resource-type-icon">
          <Monitor size={21} />
        </div>

        <span
          className={`resource-status ${
            isAvailable ? 'available' : 'unavailable'
          }`}
        >
          <span />
          {isAvailable ? 'Available' : 'Unavailable'}
        </span>
      </div>

      <div className="resource-card-body">
        <p className="resource-id">{resource.id}</p>
        <h3>{resource.name}</h3>
        <span className="resource-category">{resource.type}</span>

        <div className="resource-meta">
          <span>
            <MapPin size={15} />
            {resource.building}, {resource.location}
          </span>

          <span>
            <Users size={15} />
            Capacity: {resource.capacity}
          </span>
        </div>

        <div className="resource-facilities">
          {resource.facilities.slice(0, 3).map((facility) => (
            <span key={facility}>{facility}</span>
          ))}
          {resource.facilities.length > 3 && (
            <span>+{resource.facilities.length - 3}</span>
          )}
        </div>
      </div>

      <div className="resource-card-footer">
        <span>{resource.type}</span>

        <Link
          to={`/resources/${resource.id}`}
          className={`resource-book-button ${
            !isAvailable ? 'disabled' : ''
          }`}
          aria-disabled={!isAvailable}
          onClick={(event) => {
            if (!isAvailable) event.preventDefault();
          }}
        >
          {isAvailable ? (
            <>
              <CalendarDays size={15} />
              View resource
            </>
          ) : (
            'Unavailable'
          )}
          {isAvailable && <ArrowUpRight size={15} />}
        </Link>
      </div>
    </article>
  );
}

export default ResourceCard;
