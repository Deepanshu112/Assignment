// src/components/HistoryView.js
import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Button,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Collapse,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab
} from '@mui/material';
import {
  History as HistoryIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  DateRange as DateRangeIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  // Compare as CompareIcon
} from '@mui/icons-material';
import { optimizeService } from '../services/api';

import Grid from '@mui/material/Grid';

const HistoryView = ({ onSelectOptimization, selectedASIN }) => {
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState(selectedASIN || '');
  const [expandedItems, setExpandedItems] = useState({});
  const [activeTab, setActiveTab] = useState(0);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [viewDialog, setViewDialog] = useState(null);

  // Fetch history on component mount
  useEffect(() => {
    fetchHistory();
  }, []);

  // Filter history when search term changes
  useEffect(() => {
    if (searchTerm) {
      const filtered = history.filter(item =>
        item.asin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.optimized_title && item.optimized_title.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredHistory(filtered);
    } else {
      setFilteredHistory(history);
    }
  }, [searchTerm, history]);

  // Set search term if selectedASIN prop changes
  useEffect(() => {
    if (selectedASIN) {
      setSearchTerm(selectedASIN);
    }
  }, [selectedASIN]);

  // Helper to safely parse values that may be JSON strings, arrays,
  // or plain comma-separated / plain text values. Always returns an array.
  const parseMaybeArray = (value) => {
    if (!value && value !== 0) return [];
    if (Array.isArray(value)) return value;
    if (typeof value !== 'string') return [String(value)];

    const s = value.trim();
    // If it looks like JSON, try to parse
    if (s.startsWith('[') || s.startsWith('{')) {
      try {
        const parsed = JSON.parse(s);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        // fall through to fallback
      }
    }

    // If comma-separated, split
    const parts = s.split(/\s*,\s*/).filter(Boolean);
    if (parts.length) return parts;

    // Fallback: return the whole string as single item
    return [s];
  };

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await optimizeService.getAllHistory();
      if (response.success) {
        setHistory(response.data.optimizations);
        setFilteredHistory(response.data.optimizations);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch history');
    } finally {
      setLoading(false);
    }
  };

  const handleExpand = (id) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Return a stable key for each history item. Some endpoints return slim
  // objects without `id`, so fall back to ASIN+timestamp to avoid using
  // `undefined` as a key (which made all cards share the same key).
  const getItemKey = (item) => {
    if (!item) return undefined;
    if (item.id) return String(item.id);
    // use asin and created_at (or timestamp) as fallback
    const ts = item.created_at || item.timestamp || '';
    return `${item.asin || 'unknown'}_${ts}`;
  };

  const handleViewOptimization = async (item) => {
    // Ensure we have the full optimization record. The all-history endpoint
    // may return a slim object; fetch full history for the ASIN and open
    // the latest record.
    setLoading(true);
    setError('');
    try {
      // If item already has original_title, it is a full record
      if (item.original_title && item.optimized_title) {
        setViewDialog(item);
        return;
      }

      const resp = await optimizeService.getHistoryByASIN(item.asin);
      if (resp && resp.success && resp.data && resp.data.optimizations && resp.data.optimizations.length > 0) {
        // Use the most recent optimization
        setViewDialog(resp.data.optimizations[0]);
      } else {
        setError('No detailed history found for this ASIN');
      }
    } catch (err) {
      setError(err.message || 'Failed to load optimization details');
    } finally {
      setLoading(false);
    }
  };

  // (Re-optimize removed) — previously would trigger parent to show optimizer for ASIN

  const handleDelete = async (id, asin) => {
    try {
      // Note: You'll need to implement a delete endpoint in backend
      // For now, just filter out the item from state
      setHistory(prev => prev.filter(item => item.id !== id));
      setFilteredHistory(prev => prev.filter(item => item.id !== id));
      setDeleteDialog(null);
    } catch (err) {
      setError('Failed to delete optimization');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <Box textAlign="center">
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>Loading optimization history...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <HistoryIcon color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              Optimization History
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {filteredHistory.length} optimizations found
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Search and Filter */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by ASIN or product title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchTerm('')}>
                  ✕
                </IconButton>
              </InputAdornment>
            )
          }}
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} size="small">
            <Tab label="All" />
          </Tabs>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* No Results */}
      {filteredHistory.length === 0 && !loading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body1">
            No optimization history found.
            {searchTerm && ` Try a different search term or clear the search.`}
          </Typography>
        </Alert>
      )}

      {/* History List */}
      <List>
        {filteredHistory.map((item, index) => {
          // Include index to guarantee uniqueness even if created_at is identical
          const baseKey = getItemKey(item) || `${item.asin || 'unknown'}_${item.created_at || item.timestamp || ''}`;
          const key = `${baseKey}_${index}`;
          return (
            <React.Fragment key={key}>
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent sx={{ py: 2, px: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                    <Chip
                      label={item.asin}
                      color="primary"
                      size="small"
                      sx={{ fontWeight: 'bold' }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle1" noWrap sx={{ fontWeight: 500 }}>
                        {item.optimized_title?.substring(0, 60)}
                        {item.optimized_title?.length > 60 && '...'}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <DateRangeIcon fontSize="small" sx={{ color: 'text.secondary', fontSize: 14 }} />
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(item.created_at)} ({getTimeAgo(item.created_at)})
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => handleViewOptimization(item)}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {/* Re-optimize button removed from history view */}
                    <Tooltip title="Expand">
                      <IconButton
                        size="small"
                        onClick={() => handleExpand(key)}
                      >
                        {expandedItems[key] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                {/* Expanded Content */}
                <Collapse in={expandedItems[key]}>
                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #eee' }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom color="text.secondary">
                          Original Title
                        </Typography>
                        <Typography variant="body2" paragraph>
                          {item.original_title || 'N/A'}
                        </Typography>
                        
                        <Typography variant="subtitle2" gutterBottom color="text.secondary">
                          Optimized Title
                        </Typography>
                        <Typography variant="body2" paragraph sx={{ color: 'primary.main', fontWeight: 500 }}>
                          {item.optimized_title || 'N/A'}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom color="text.secondary">
                          Keywords
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                          {parseMaybeArray(item.keywords).map((keyword, idx) => (
                            <Chip
                              key={idx}
                              label={keyword}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.75rem' }}
                            />
                          ))}
                        </Box>
                        
                      </Grid>
                    </Grid>
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          </React.Fragment>
          
        );
        })}
      </List>

      {/* View Dialog */}
      <Dialog
        open={!!viewDialog}
        onClose={() => setViewDialog(null)}
        maxWidth="md"
        fullWidth
      >
        {viewDialog && (
          <>
            <DialogTitle>
              Optimization Details - {viewDialog.asin}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">Original Title</Typography>
                <Typography variant="body1" paragraph>{viewDialog.original_title}</Typography>
                
                <Typography variant="subtitle2" color="text.secondary">Optimized Title</Typography>
                <Typography variant="body1" paragraph sx={{ color: 'primary.main', fontWeight: 500 }}>
                  {viewDialog.optimized_title}
                </Typography>
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Original Bullet Points
                  </Typography>
                  <List dense>
                    {parseMaybeArray(viewDialog.original_bullets).map((bullet, idx) => (
                      <ListItem key={idx} sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 30 }}>
                          •
                        </ListItemIcon>
                        <ListItemText primary={bullet} primaryTypographyProps={{ variant: 'body2' }} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Optimized Bullet Points
                  </Typography>
                  <List dense>
                    {parseMaybeArray(viewDialog.optimized_bullets).map((bullet, idx) => (
                      <ListItem key={idx} sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 30, color: 'success.main' }}>
                          ✓
                        </ListItemIcon>
                        <ListItemText 
                          primary={bullet} 
                          primaryTypographyProps={{ variant: 'body2', color: 'success.main' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewDialog(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteDialog}
        onClose={() => setDeleteDialog(null)}
      >
        <DialogTitle>Delete Optimization</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the optimization for ASIN: <strong>{deleteDialog?.asin}</strong>?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)}>Cancel</Button>
          <Button 
            color="error" 
            variant="contained"
            onClick={() => handleDelete(deleteDialog.id, deleteDialog.asin)}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

// (Grid import is at the top of this file)

export default HistoryView;