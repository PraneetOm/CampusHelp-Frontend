
import { useEffect, useMemo, useState } from 'react';
import { Plus, LayoutGrid } from 'lucide-react';
import ResourceCard from '../components/ResourceCard';
import ResourceFilters from '../components/ResourceFilters';
import { getResources } from '../services/resourceService';

function ResourceDirectory() {
  const [resources, setResources] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadResources() {
      try {
        setLoading(true);
        setError('');

        const data = await getResources();

        if (isMounted) {
          setResources(data);
        }
      } catch {
        if (isMounted) {
          setError('Unable to load resources. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadResources();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      const matchesSearch = [
        resource.name,
        resource.id,
        resource.building,
        resource.type,
      ]
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesType =
        selectedType === 'All' || resource.type === selectedType;

      return matchesSearch && matchesType;
    });
  }, [resources, search, selectedType]);

  return (
    <div className="resource-directory">
      <section className="page-heading">
        <div>
          <p className="page-eyebrow">CAMPUS SERVICES</p>
          <h1>Resource Directory</h1>
          <p className="page-description">
            Discover and reserve facilities across your campus.
          </p>
        </div>

        <button className="primary-button">
          <Plus size={18} />
          Request a resource
        </button>
      </section>

      <section className="resource-overview">
        <div>
          <LayoutGrid size={20} />
          <span>
            <strong>{resources.length}</strong> campus resources
          </span>
        </div>

        <span>
          <strong>
            {resources.filter((item) => item.status === 'AVAILABLE').length}
          </strong>{' '}
          currently available
        </span>
      </section>

      <ResourceFilters
        search={search}
        onSearchChange={setSearch}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
      />

      {loading && (
        <div className="resource-message">Loading resources...</div>
      )}

      {!loading && error && (
        <div className="resource-message error-message">{error}</div>
      )}

      {!loading && !error && filteredResources.length === 0 && (
        <div className="resource-message">
          No resources match your search. Try another name or category.
        </div>
      )}

      {!loading && !error && filteredResources.length > 0 && (
        <>
          <div className="resource-results-heading">
            <h2>Available campus resources</h2>
            <span>{filteredResources.length} results</span>
          </div>

          <div className="resource-grid">
            {filteredResources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default ResourceDirectory;