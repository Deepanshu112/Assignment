import React, { useState } from 'react';
import {
  TextField,
  Button,
  Box,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  Tooltip,
  Chip
} from '@mui/material';
import {
  Search as SearchIcon,
  ContentCopy as CopyIcon,
  History as HistoryIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { optimizeService } from '../services/api';

const ASINForm = ({ onOptimize, onViewHistory, isLoading }) => {
  const [asin, setAsin] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [recentASINs, setRecentASINs] = useState([]);

  // Validate ASIN format
  const validateASIN = (value) => {
    const asinRegex = /^[A-Z0-9]{10}$/;
    return asinRegex.test(value.toUpperCase());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const trimmedASIN = asin.trim().toUpperCase();
    
    if (!trimmedASIN) {
      setError('Please enter an ASIN');
      return;
    }

    if (!validateASIN(trimmedASIN)) {
      setError('Invalid ASIN format. ASIN should be 10 characters (letters/numbers)');
      return;
    }

    if (!recentASINs.includes(trimmedASIN)) {
      setRecentASINs(prev => [trimmedASIN, ...prev.slice(0, 4)]);
    }

    try {
      await onOptimize(trimmedASIN);
      setSuccess(`Successfully optimized product: ${trimmedASIN}`);
      setAsin('');
    } catch (err) {
      setError(err.message || 'Failed to optimize product');
    }
  };


  // Handle view history for a specific ASIN
  const handleViewHistory = (asin) => {
    if (onViewHistory) {
      onViewHistory(asin);
    }
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 4, 
        mb: 4, 
        borderRadius: 2,
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}
    >
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        Content Optimizer
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Enter an Amazon ASIN to fetch product details and generate an optimized listing.
      </Typography>

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
        <TextField
          fullWidth
          label="Enter Amazon ASIN"
          variant="outlined"
          value={asin}
          onChange={(e) => setAsin(e.target.value.toUpperCase())}
          placeholder="e.g., B08N5WRWNW"
          disabled={isLoading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            )
          }}
          helperText="ASIN is a 10-character alphanumeric identifier (e.g., B08N5WRWNW)"
          sx={{ mb: 2 }}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            disabled={isLoading || !asin}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
            sx={{ flex: 2 }}
          >
            {isLoading ? 'Optimizing...' : 'Optimize Product'}
          </Button>

          {asin && (
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => handleViewHistory(asin)}
              startIcon={<HistoryIcon />}
              sx={{ flex: 1 }}
            >
              View History
            </Button>
          )}
        </Box>

        {/* Info Section */}
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>How to find an ASIN:</strong>
            <br />
            1. Go to Amazon product page
            <br />
            2. Look in the URL: amazon.com/dp/<strong>ASIN</strong>
            <br />
            3. Or check product details section
          </Typography>
        </Alert>
      </Box>
    </Paper>
  );
};

export default ASINForm;