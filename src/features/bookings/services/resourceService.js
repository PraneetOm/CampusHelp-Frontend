
const mockResources = [
  {
    id: 'RES-001',
    name: 'Computer Lab 01',
    type: 'Laboratory',
    building: 'Block A',
    location: 'First Floor',
    capacity: 40,
    status: 'AVAILABLE',
    facilities: ['Computers', 'Projector', 'Air Conditioning'],
  },
  {
    id: 'RES-002',
    name: 'Seminar Hall A',
    type: 'Seminar Hall',
    building: 'Block B',
    location: 'Ground Floor',
    capacity: 120,
    status: 'AVAILABLE',
    facilities: ['Projector', 'Sound System', 'Air Conditioning'],
  },
  {
    id: 'RES-003',
    name: 'Conference Room',
    type: 'Meeting Room',
    building: 'Admin Block',
    location: 'Second Floor',
    capacity: 20,
    status: 'AVAILABLE',
    facilities: ['Display Screen', 'Whiteboard'],
  },
  {
    id: 'RES-004',
    name: 'Computer Lab 02',
    type: 'Laboratory',
    building: 'Block A',
    location: 'Second Floor',
    capacity: 35,
    status: 'UNAVAILABLE',
    facilities: ['Computers', 'Projector'],
  },
  {
    id: 'RES-005',
    name: 'Lecture Hall 01',
    type: 'Classroom',
    building: 'Block C',
    location: 'First Floor',
    capacity: 80,
    status: 'AVAILABLE',
    facilities: ['Projector', 'Audio System'],
  },
  {
    id: 'RES-006',
    name: 'Sports Equipment Room',
    type: 'Equipment',
    building: 'Sports Complex',
    location: 'Ground Floor',
    capacity: 15,
    status: 'AVAILABLE',
    facilities: ['Sports Equipment', 'Storage'],
  },
];

// Fetch all resources
export async function getResources() {
  return mockResources;
}

// Fetch a single resource
export async function getResourceById(id) {
  return mockResources.find((resource) => resource.id === id) || null;
}

// Generate the next resource ID
function generateResourceId() {
  const maxId = mockResources.reduce((max, resource) => {
    const number = Number(resource.id.split('-')[1]) || 0;
    return Math.max(max, number);
  }, 0);

  return `RES-${String(maxId + 1).padStart(3, '0')}`;
}

// Add a new resource
export async function createResource(resourceData) {
  const newResource = {
    ...resourceData,
    id: generateResourceId(),
    status: resourceData.status || 'AVAILABLE',
    capacity: Number(resourceData.capacity),
    facilities: Array.isArray(resourceData.facilities)
      ? resourceData.facilities
      : [],
  };

  mockResources.push(newResource);
  return newResource;
}

// Update resource details
export async function updateResource(id, updatedData) {
  const index = mockResources.findIndex(
    (resource) => resource.id === id
  );

  if (index === -1) {
    throw new Error('Resource not found');
  }

  mockResources[index] = {
    ...mockResources[index],
    ...updatedData,
    capacity: Number(updatedData.capacity ?? mockResources[index].capacity),
    facilities: updatedData.facilities
      ? updatedData.facilities
      : mockResources[index].facilities,
  };

  return mockResources[index];
}

// Activate or deactivate a resource
export async function updateResourceStatus(id, status) {
  const resource = mockResources.find(
    (resource) => resource.id === id
  );

  if (!resource) {
    throw new Error('Resource not found');
  }

  if (!['AVAILABLE', 'UNAVAILABLE'].includes(status)) {
    throw new Error('Invalid resource status');
  }

  resource.status = status;
  return resource;
}
