
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Users, CalendarDays } from 'lucide-react';
import { getResourceById } from '../services/resourceService';

function ResourceDetails() {
  const { resourceId } = useParams();
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadResource() {
      try {
        const data = await getResourceById(resourceId);

        if (active) setResource(data);
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

  if (loading) {
    return <div className="resource-message">Loading resource...</div>;
  }

  if (error) {
    return <div className="resource-message error-message">{error}</div>;
  }

  if (!resource) {
    return <div className="resource-message">Resource not found.</div>;
  }

  const isAvailable = resource.status === 'AVAILABLE';

  return (
    <div className="dashboard">
      <Link to="/resources" className="back-link">
        <ArrowLeft size={16} /> Back to resources
      </Link>

      <section className="page-heading">
        <div>
          <p className="page-eyebrow">RESOURCE DETAILS</p>
          <h1>{resource.name}</h1>
          <p className="page-description">
            {resource.type} · {resource.id}
          </p>
        </div>

        {isAvailable && (
          <Link
            to={`/resources/${resource.id}/book`}
            className="primary-button"
          >
            <CalendarDays size={17} />
            Book this resource
          </Link>
        )}
      </section>

      <div className="content-panel resource-detail-panel">
        <h2>Resource information</h2>

        <p><MapPin size={16} /> {resource.building}, {resource.location}</p>
        <p><Users size={16} /> Capacity: {resource.capacity}</p>
        <p>
          Status: {isAvailable ? 'Available' : 'Unavailable'}
        </p>

        <h3>Facilities</h3>

        <div className="resource-facilities">
          {resource.facilities.map((facility) => (
            <span key={facility}>{facility}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ResourceDetails;
