
import { useEffect, useMemo, useState } from 'react';
import {
  getResources,
  createResource,
  updateResource,
  updateResourceStatus,
} from '../services/resourceService';

const emptyForm = {
  name: '',
  type: 'Laboratory',
  building: '',
  location: '',
  capacity: '',
  status: 'AVAILABLE',
  facilities: '',
};

function AdminResources() {
  const [resources, setResources] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  async function loadResources() {
    const data = await getResources();
    setResources([...data]);
  }

  useEffect(() => {
    loadResources();
  }, []);

  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      const matchesSearch =
        resource.name.toLowerCase().includes(search.toLowerCase()) ||
        resource.building.toLowerCase().includes(search.toLowerCase()) ||
        resource.id.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' || resource.status === statusFilter;

      const matchesType =
        typeFilter === 'ALL' || resource.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [resources, search, statusFilter, typeFilter]);

  const availableCount = resources.filter(
    (resource) => resource.status === 'AVAILABLE'
  ).length;

  const unavailableCount = resources.length - availableCount;

  function openAddForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setShowForm(true);
  }

  function openEditForm(resource) {
    setEditingId(resource.id);
    setForm({
      ...resource,
      facilities: resource.facilities.join(', '),
    });
    setError('');
    setShowForm(true);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (
      !form.name.trim() ||
      !form.building.trim() ||
      !form.location.trim() ||
      !form.capacity ||
      Number(form.capacity) < 1
    ) {
      setError('Please complete all fields with valid values.');
      return;
    }

    const resourceData = {
      name: form.name.trim(),
      type: form.type,
      building: form.building.trim(),
      location: form.location.trim(),
      capacity: Number(form.capacity),
      status: form.status,
      facilities: form.facilities
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    };

    try {
      if (editingId) {
        await updateResource(editingId, resourceData);
      } else {
        await createResource(resourceData);
      }

      await loadResources();
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    }
  }

  async function handleStatusChange(resource) {
    const nextStatus =
      resource.status === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE';

    await updateResourceStatus(resource.id, nextStatus);
    await loadResources();
  }

  return (
    <div className="admin-resources-page">
      <div className="admin-page-header">
        <div>
          <p className="admin-eyebrow">ADMINISTRATION / RESOURCES</p>
          <h1>Resource Management</h1>
          <p className="admin-subtitle">
            Manage campus facilities, capacity and availability.
          </p>
        </div>

        <button className="admin-primary-btn" onClick={openAddForm}>
          + Add Resource
        </button>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <span>Total Resources</span>
          <strong>{resources.length}</strong>
          <small>Registered campus resources</small>
        </div>
        <div className="admin-stat-card">
          <span>Available</span>
          <strong>{availableCount}</strong>
          <small>Open for booking</small>
        </div>
        <div className="admin-stat-card">
          <span>Unavailable</span>
          <strong>{unavailableCount}</strong>
          <small>Currently disabled</small>
        </div>
      </div>

      <section className="admin-inventory">
        <div className="admin-inventory-heading">
          <div>
            <h2>Resource Inventory</h2>
            <p>{filteredResources.length} resources found</p>
          </div>
        </div>

        <div className="admin-filters">
          <input
            type="text"
            placeholder="Search by name, ID or building..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
          >
            <option value="ALL">All types</option>
            <option value="Laboratory">Laboratory</option>
            <option value="Seminar Hall">Seminar Hall</option>
            <option value="Meeting Room">Meeting Room</option>
            <option value="Classroom">Classroom</option>
            <option value="Equipment">Equipment</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="ALL">All statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="UNAVAILABLE">Unavailable</option>
          </select>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-resource-table">
            <thead>
              <tr>
                <th>RESOURCE</th>
                <th>TYPE</th>
                <th>LOCATION</th>
                <th>CAPACITY</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredResources.map((resource) => (
                <tr key={resource.id}>
                  <td>
                    <strong>{resource.name}</strong>
                    <small>{resource.id}</small>
                  </td>
                  <td>{resource.type}</td>
                  <td>
                    {resource.building}
                    <small>{resource.location}</small>
                  </td>
                  <td>{resource.capacity}</td>
                  <td>
                    <span
                      className={`admin-status ${
                        resource.status === 'AVAILABLE'
                          ? 'is-available'
                          : 'is-unavailable'
                      }`}
                    >
                      {resource.status}
                    </span>
                  </td>
                  <td>
                    <div className="admin-actions">
                      <button onClick={() => openEditForm(resource)}>
                        Edit
                      </button>
                      <button onClick={() => handleStatusChange(resource)}>
                        {resource.status === 'AVAILABLE'
                          ? 'Deactivate'
                          : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredResources.length === 0 && (
                <tr>
                  <td colSpan="6" className="admin-empty">
                    No resources match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showForm && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <div>
                <p className="admin-eyebrow">
                  {editingId ? 'UPDATE RESOURCE' : 'NEW RESOURCE'}
                </p>
                <h2>{editingId ? 'Edit Resource' : 'Add Resource'}</h2>
              </div>
              <button
                className="admin-close-btn"
                onClick={() => setShowForm(false)}
                type="button"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label>
                Resource Name
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Computer Lab 03"
                  required
                />
              </label>

              <label>
                Resource Type
                <select name="type" value={form.type} onChange={handleChange}>
                  <option>Laboratory</option>
                  <option>Seminar Hall</option>
                  <option>Meeting Room</option>
                  <option>Classroom</option>
                  <option>Equipment</option>
                </select>
              </label>

              <div className="admin-form-row">
                <label>
                  Building
                  <input
                    name="building"
                    value={form.building}
                    onChange={handleChange}
                    placeholder="Block A"
                    required
                  />
                </label>
                <label>
                  Floor / Location
                  <input
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="First Floor"
                    required
                  />
                </label>
              </div>

              <div className="admin-form-row">
                <label>
                  Capacity
                  <input
                    name="capacity"
                    type="number"
                    min="1"
                    value={form.capacity}
                    onChange={handleChange}
                    placeholder="40"
                    required
                  />
                </label>
                <label>
                  Status
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="UNAVAILABLE">Unavailable</option>
                  </select>
                </label>
              </div>

              <label>
                Facilities
                <input
                  name="facilities"
                  value={form.facilities}
                  onChange={handleChange}
                  placeholder="Computers, Projector, AC"
                />
                <small>Separate facilities with commas.</small>
              </label>

              {error && <p className="admin-form-error">{error}</p>}

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-secondary-btn"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-primary-btn">
                  {editingId ? 'Save Changes' : 'Create Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminResources;
