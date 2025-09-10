// Business Component: PersonDetailsView
// Displays basic details for a selected person (placeholder version)

import React from 'react';
/* eslint-disable react/prop-types */
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { registerComponent } from '../../services/registry';

function PersonDetailsView(props) {
  const { personId, fullData, onBackToList } = props; // onUpdateData reserved for future enhancements

  const people =
    fullData && Array.isArray(fullData.people) ? fullData.people : [];
  const person = people.find((p) => p && p.id === personId);

  if (!person) {
    return (
      <Box sx={{ p: 2 }}>
        <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography
            variant="h6"
            component="p"
            color="error"
          >
            Person not found
          </Typography>
          <Button
            variant="contained"
            onClick={() => onBackToList && onBackToList()}
          >
            Back to People
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Typography
            variant="h4"
            component="h2"
          >
            {person.name || 'Unnamed Person'}
          </Typography>
          <Button
            variant="contained"
            onClick={() => onBackToList && onBackToList()}
          >
            Back to List
          </Button>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="body1">{`Email: ${person.email || 'N/A'}`}</Typography>
          <Typography variant="body1">{`Phone: ${person.phone || 'N/A'}`}</Typography>
        </Box>
      </Paper>
    </Box>
  );
}

// Self-registration (business layer)
// Register with business registry (legacy global removal)
registerComponent('business', 'PersonDetailsView', PersonDetailsView);

export default PersonDetailsView;
