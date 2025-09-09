// Business Component: PersonDetailsView
// Displays basic details for a selected person (placeholder version)

/* eslint-disable react/prop-types */
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { registerComponent } from '../../services/core';

function PersonDetailsView(props) {
  if (!window || !window.React) return null; // safety fallback per project pattern
  const e = window.React.createElement;
  const { personId, fullData, onBackToList } = props; // onUpdateData reserved for future enhancements

  const people =
    fullData && Array.isArray(fullData.people) ? fullData.people : [];
  const person = people.find((p) => p && p.id === personId);

  if (!person) {
    return e(
      Box,
      { sx: { p: 2 } },
      e(
        Paper,
        { sx: { p: 3, display: 'flex', flexDirection: 'column', gap: 2 } },
        e(
          Typography,
          { variant: 'h6', component: 'p', color: 'error' },
          'Person not found',
        ),
        e(
          Button,
          {
            variant: 'contained',
            onClick: () => onBackToList && onBackToList(),
          },
          'Back to People',
        ),
      ),
    );
  }

  return e(
    Box,
    { sx: { p: 2 } },
    e(
      Paper,
      { sx: { p: 3, display: 'flex', flexDirection: 'column', gap: 3 } },
      e(
        Box,
        {
          sx: {
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            gap: 2,
          },
        },
        e(
          Typography,
          { variant: 'h4', component: 'h2' },
          person.name || 'Unnamed Person',
        ),
        e(
          Button,
          {
            variant: 'contained',
            onClick: () => onBackToList && onBackToList(),
          },
          'Back to List',
        ),
      ),
      e(
        Box,
        { sx: { display: 'flex', flexDirection: 'column', gap: 1 } },
        e(Typography, { variant: 'body1' }, `Email: ${person.email || 'N/A'}`),
        e(Typography, { variant: 'body1' }, `Phone: ${person.phone || 'N/A'}`),
      ),
    ),
  );
}

// Self-registration (business layer)
// Register with business registry (legacy global removal)
registerComponent('business', 'PersonDetailsView', PersonDetailsView);

export default PersonDetailsView;
