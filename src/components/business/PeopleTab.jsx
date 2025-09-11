import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import PersonDetailsView from './PersonDetailsView';
import { registerComponent } from '../../services/registry';
import { createBusinessComponent } from '../ui/TabBase.jsx';
/**
 * Nightingale CMS - People Tab Component (JSX)
 */
function usePeopleData({ fullData, onViewModeChange, onBackToList }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPersonId, setEditPersonId] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [detailsPersonId, setDetailsPersonId] = useState(null);
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const backToList = useCallback(() => {
    setViewMode('list');
    setDetailsPersonId(null);
    setSelectedPersonId(null);
    onViewModeChange?.('list');
  }, [onViewModeChange]);
  useEffect(() => {
    if (onBackToList) onBackToList(() => backToList);
  }, [onBackToList, backToList]);
  const filteredPeople = useMemo(() => {
    if (!fullData?.people) return [];
    let filtered = fullData.people;
    const searchString = typeof searchTerm === 'string' ? searchTerm : '';
    if (searchString.trim()) {
      const term = searchString.toLowerCase();
      filtered = filtered.filter((person) => {
        const getAddressText = (address) => {
          if (typeof address === 'string') return address.toLowerCase();
          if (address && typeof address === 'object') {
            const parts = [
              address.street,
              address.city,
              address.state,
              address.zip,
            ].filter(Boolean);
            return parts.join(' ').toLowerCase();
          }
          return '';
        };
        return (
          person.name?.toLowerCase().includes(term) ||
          person.email?.toLowerCase().includes(term) ||
          person.phone?.includes(term) ||
          getAddressText(person.address).includes(term)
        );
      });
    }
    return filtered;
  }, [fullData, searchTerm]);
  const handlePersonClick = (person) => {
    setEditPersonId(person.id);
    setIsEditModalOpen(true);
  };
  const handleViewDetails = (person) => {
    if (person) setSelectedPersonId(person.id);
  };
  const handleBackToList = () => backToList();
  const formatDate = (dateString) =>
    window.dateUtils?.format?.(dateString) || dateString;
  return {
    data: filteredPeople,
    loading: false,
    error: null,
    searchTerm,
    setSearchTerm,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    editPersonId,
    setEditPersonId,
    viewMode,
    setViewMode,
    detailsPersonId,
    setDetailsPersonId,
    selectedPersonId,
    setSelectedPersonId,
    backToList,
    handlePersonClick,
    handleViewDetails,
    handleBackToList,
    formatDate,
  };
}
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
function renderPeopleContent({ components, data: dataResult, props }) {
  const { SearchBar, SearchSection } = components;
  if (dataResult.selectedPersonId && PersonDetailsView) {
    return (
      <PersonDetailsView
        personId={dataResult.selectedPersonId}
        fullData={props.fullData}
        onBackToList={dataResult.handleBackToList}
        onUpdateData={props.onUpdateData}
      />
    );
  }
  return (
    <Box
      sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography
            variant="h4"
            component="h1"
          >
            People
          </Typography>
          <Typography
            variant="subtitle1"
            color="text.secondary"
          >{`${dataResult.data.length} ${dataResult.data.length !== 1 ? 'people' : 'person'}`}</Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={() => dataResult.setIsCreateModalOpen(true)}
          aria-label="New Person"
        >
          Add Person
        </Button>
      </Box>
      <SearchSection
        searchBar={
          <SearchBar
            value={dataResult.searchTerm}
            onChange={(e2) => {
              const value =
                typeof e2 === 'string' ? e2 : e2?.target?.value || '';
              dataResult.setSearchTerm(value);
            }}
            placeholder="Search people by name, email, phone, address..."
          />
        }
      />
      {dataResult.data.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography
            variant="body1"
            color="text.secondary"
          >
            No people found
          </Typography>
        </Paper>
      ) : (
        <TableContainer
          component={Paper}
          sx={{ maxHeight: 640 }}
        >
          <Table
            size="small"
            stickyHeader
            aria-label="people table"
          >
            <TableHead>
              <TableRow>
                {['Name', 'Email', 'Phone', 'Address'].map((header) => (
                  <TableCell
                    key={header}
                    sx={{ fontWeight: 600 }}
                  >
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {dataResult.data.map((person) => {
                let addressText = 'N/A';
                const value = person.address;
                if (typeof value === 'string') addressText = value;
                else if (value && typeof value === 'object') {
                  const parts = [
                    value.street,
                    value.city,
                    value.state,
                    value.zip,
                  ].filter(Boolean);
                  addressText = parts.length ? parts.join(', ') : 'N/A';
                }
                return (
                  <TableRow
                    key={person.id}
                    hover
                    onClick={() => dataResult.handleViewDetails(person)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell sx={{ fontWeight: 500 }}>
                      {person.name || 'N/A'}
                    </TableCell>
                    <TableCell>{person.email || 'N/A'}</TableCell>
                    <TableCell>{person.phone || 'N/A'}</TableCell>
                    <TableCell>{addressText}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
function renderPeopleModals({ components, data: dataResult, props }) {
  const PersonCreationModal =
    components.PersonCreationModal ||
    (({ isOpen, onClose }) =>
      isOpen ? (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={onClose}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-white mb-4">
              Create New Person
            </h2>
            <p className="text-gray-400 mb-4">
              PersonCreationModal component not available
            </p>
            <button
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      ) : null);
  return (
    <div>
      <PersonCreationModal
        isOpen={dataResult.isCreateModalOpen}
        onClose={() => dataResult.setIsCreateModalOpen(false)}
        onPersonCreated={(newPerson) => {
          const updatedData = {
            ...props.fullData,
            people: [...(props.fullData.people || []), newPerson],
          };
          props.onUpdateData(updatedData);
          dataResult.setIsCreateModalOpen(false);
        }}
        fullData={props.fullData}
        fileService={props.fileService}
      />
      {dataResult.isEditModalOpen && (
        <PersonCreationModal
          isOpen={dataResult.isEditModalOpen}
          onClose={() => {
            dataResult.setIsEditModalOpen(false);
            dataResult.setEditPersonId(null);
          }}
          onPersonCreated={(updatedPerson) => {
            const updatedData = {
              ...props.fullData,
              people: props.fullData.people.map((p) =>
                p.id === updatedPerson.id ? updatedPerson : p,
              ),
            };
            props.onUpdateData(updatedData);
            dataResult.setIsEditModalOpen(false);
            dataResult.setEditPersonId(null);
          }}
          editPersonId={dataResult.editPersonId}
          fullData={props.fullData}
          fileService={props.fileService}
        />
      )}
    </div>
  );
}
const PeopleTab = createBusinessComponent({
  name: 'PeopleTab',
  useData: usePeopleData,
  renderContent: renderPeopleContent,
  renderModals: renderPeopleModals,
  defaultProps: { fullData: { people: [], cases: [] } },
});
PeopleTab.propTypes = {
  fullData: PropTypes.object,
  onUpdateData: PropTypes.func,
  fileService: PropTypes.object,
  onViewModeChange: PropTypes.func,
  onBackToList: PropTypes.func,
};
registerComponent('business', 'PeopleTab', PeopleTab);
export default PeopleTab;
