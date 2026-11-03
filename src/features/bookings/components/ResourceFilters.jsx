
import { Search, SlidersHorizontal } from 'lucide-react';

function ResourceFilters({
  search,
  onSearchChange,
  selectedType,
  onTypeChange,
}) {
  return (
    <div className="resource-filters">
      <div className="resource-search">
        <Search size={18} />
        <input
          type="search"
          placeholder="Search resources..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <div className="resource-type-filter">
        <SlidersHorizontal size={17} />
        <select
          value={selectedType}
          onChange={(event) => onTypeChange(event.target.value)}
        >
          <option value="All">All resource types</option>
          <option value="Laboratory">Laboratories</option>
          <option value="Seminar Hall">Seminar Halls</option>
          <option value="Classroom">Classrooms</option>
          <option value="Meeting Room">Meeting Rooms</option>
          <option value="Equipment">Equipment</option>
        </select>
      </div>
    </div>
  );
}

export default ResourceFilters;
