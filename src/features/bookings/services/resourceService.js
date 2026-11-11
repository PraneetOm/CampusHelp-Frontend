import apiClient from '../../../services/api/apiClient';

const mapResource = (resource) => ({
  ...resource,
  type: resource.type || 'Other',
  building: resource.building || 'Standalone',
  location: resource.room || resource.building || 'Standalone',
  status:
    resource.active && resource.bookable
      ? 'AVAILABLE'
      : 'UNAVAILABLE',
  facilities: [],
});

export const getResources = async () => {
  const response = await apiClient.get('/api/resources');
  return response.data.map(mapResource);
};

export const getResourceOptions = async (collegeId) => {
  const response = await apiClient.get('/api/resources/options', {
    params: { collegeId },
  });

  return response.data;
};

export const createResource = async (resourceData) => {
  const response = await apiClient.post('/api/resources', resourceData);
  return response.data;
};

export const updateResource = async (id, resourceData) => {
  const response = await apiClient.put(
    `/api/resources/${id}`,
    resourceData
  );

  return response.data;
};

export const updateResourceStatus = async (id, active) => {
  const response = await apiClient.patch(
    `/api/resources/${id}/status`,
    null,
    { params: { active } }
  );

  return response.data;
};

export const getResourceById = async (id) => {
  const resources = await getResources();
  return resources.find((resource) => resource.id === id) || null;
};