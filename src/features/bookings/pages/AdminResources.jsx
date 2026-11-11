import { useEffect, useMemo, useState } from 'react';
import {
  getResources,
  getResourceOptions,
  createResource,
  updateResource,
  updateResourceStatus,
} from '../services/resourceService';

const emptyForm = {
  name: '',
  resourceTypeId: '',
  roomId: '',
  capacity: '',
  status: 'AVAILABLE',
};

// temporarily constant :)
const COLLEGE_ID = '10000000-0000-0000-0000-000000000001';

function AdminResources() {
  const [resourceTypes, setResourceTypes] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  async function loadResources() {
    try {
      setLoading(true);
      const data = await getResources();
      setResources(data);
    } catch (err) {
      console.error('Failed to load resources:', err);
      setError('Unable to load resources.');
    } finally {
      setLoading(false);
    }
  }

  async function loadOptions() {
    try {
      const data = await getResourceOptions(COLLEGE_ID);
      setResourceTypes(data.resourceTypes);
      setRooms(data.rooms);
    } catch (err) {
      console.error('Failed to load resource options:', err);
      setError('Unable to load resource types and rooms.');
    }
  }

  useEffect(() => {
    loadResources();
    loadOptions();
  }, []);

  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      const matchesSearch =
        resource.name.toLowerCase().includes(search.toLowerCase()) ||
        (resource.building || '').toLowerCase().includes(search.toLowerCase()) ||
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
      name: resource.name || '',
      resourceTypeId: resource.resourceTypeId || '',
      roomId: resource.roomId || '',
      capacity: resource.capacity ?? '',
      status: resource.status,
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
      !form.resourceTypeId ||
      !form.capacity ||
      Number(form.capacity) < 1
    ) {
      setError('Please complete all required fields.');
      return;
    }

    const resourceData = {
      collegeId: COLLEGE_ID,
      resourceTypeId: form.resourceTypeId,
      roomId: form.roomId || null,
      name: form.name.trim(),
      code: editingId
        ? resources.find((r) => r.id === editingId)?.code || null
        : null,
      description: editingId
        ? resources.find((r) => r.id === editingId)?.description || null
        : '',
      capacity: Number(form.capacity),
      bookable: true,
      active: form.status === 'AVAILABLE',
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
      console.error('Resource save failed:', err);
      setError(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Unable to save resource.'
      );
    }
  }

  async function handleStatusChange(resource) {
    try {
      const nextActive = !resource.active;

      await updateResourceStatus(resource.id, nextActive);
      await loadResources();
    } catch (err) {
      console.error('Status update failed:', err);
      setError('Unable to update resource status.');
    }
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
                      className={`admin-status ${resource.status === 'AVAILABLE'
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
                <select
                  name="resourceTypeId"
                  value={form.resourceTypeId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select resource type</option>

                  {resourceTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="admin-form-row">
                <label>
                  Room / Location
                  <select
                    name="roomId"
                    value={form.roomId}
                    onChange={handleChange}
                  >
                    <option value="">Standalone resource / No room</option>

                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name} — {room.building}
                      </option>
                    ))}
                  </select>
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
