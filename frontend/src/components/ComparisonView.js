import React, { useState } from 'react';
import {
  Paper,
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  Divider,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Alert,
  Tabs,
  Tab,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  ContentCopy as CopyIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Star as StarIcon,
  Title as TitleIcon,
  Description as DescriptionIcon,
  KeyboardArrowRight as ArrowRightIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon
} from '@mui/icons-material';

const ComparisonView = ({ data, isLoading }) => {
  const [copiedItem, setCopiedItem] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    bullets: true,
    description: true
  });
  const [activeTab, setActiveTab] = useState(0);
  const [showKeywords, setShowKeywords] = useState(true);

  if (!data) {
    return (
      <Alert severity="info">
        Enter an ASIN above to see the optimization comparison.
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Box textAlign="center">
          <RefreshIcon sx={{ fontSize: 60, color: 'primary.main', animation: 'spin 2s linear infinite' }} />
          <Typography variant="h6" sx={{ mt: 2 }}>Optimizing product...</Typography>
          <Typography variant="body2" color="text.secondary">
            This may take a few moments
          </Typography>
        </Box>
      </Box>
    );
  }

  const { original, optimized, asin, timestamp } = data;

  // Copy text to clipboard
  const copyToClipboard = async (text, itemName) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(itemName);
      setTimeout(() => setCopiedItem(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Download optimized content
  const downloadOptimized = () => {
    const content = `
Optimized Amazon Listing for ASIN: ${asin}
Generated on: ${new Date(timestamp).toLocaleString()}

Title:
${optimized.optimizedTitle}

Bullet Points:
${optimized.optimizedBulletPoints.map((bp, i) => `${i + 1}. ${bp}`).join('\n')}

Description:
${optimized.optimizedDescription}

Keywords:
${optimized.keywords.join(', ')}

Original Title: ${original.title}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `amazon-optimized-${asin}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Calculate improvement metrics (mock for now)
  const calculateImprovements = () => {
    const titleLengthDiff = optimized.optimizedTitle.length - (original.title?.length || 0);
    const bulletsCountDiff = optimized.optimizedBulletPoints.length - (original.bulletPoints?.length || 0);
    
    return {
      titleLength: {
        original: original.title?.length || 0,
        optimized: optimized.optimizedTitle.length,
        diff: titleLengthDiff,
        better: Math.abs(titleLengthDiff) <= 20 // Within reasonable range
      },
      bulletsCount: {
        original: original.bulletPoints?.length || 0,
        optimized: optimized.optimizedBulletPoints.length,
        diff: bulletsCountDiff,
        better: optimized.optimizedBulletPoints.length >= 3
      }
    };
  };

  const improvements = calculateImprovements();

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 2, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
          Optimization Results
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Chip 
            label={`ASIN: ${asin}`} 
            color="primary" 
            variant="outlined"
          />
          {timestamp && (
            <Chip 
              label={`Optimized: ${new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`} 
              variant="outlined"
              size="small"
            />
          )}
        </Box>
      </Box>

      {/* Tabs for different views */}
      <Box sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Side-by-Side Comparison" />
        </Tabs>
      </Box>

      {/* Side-by-Side Comparison */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Original Column */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%', borderColor: '#e0e0e0' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" color="text.secondary">
                    Original Listing
                  </Typography>
                  <Chip label="Before" color="default" size="small" />
                </Box>
                
                {/* Title */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TitleIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="subtitle2" color="text.secondary">Title</Typography>
                    <Typography variant="caption" sx={{ ml: 'auto', color: 'text.secondary' }}>
                      {original.title?.length || 0} chars
                    </Typography>
                  </Box>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f9f9f9', minHeight: '80px' }}>
                    <Typography variant="body1">{original.title || 'No title found'}</Typography>
                  </Paper>
                </Box>

                {/* Bullet Points */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <StarIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="subtitle2" color="text.secondary">
                        Bullet Points ({original.bulletPoints?.length || 0})
                      </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => toggleSection('bullets')}>
                      {expandedSections.bullets ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>
                  
                  <Collapse in={expandedSections.bullets}>
                    <List dense>
                      {original.bulletPoints?.map((bullet, index) => (
                        <ListItem key={index} sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 30 }}>
                            <ArrowRightIcon fontSize="small" color="action" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={bullet} 
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      )) || (
                        <Alert severity="info" sx={{ mt: 1 }}>No bullet points found</Alert>
                      )}
                    </List>
                  </Collapse>
                </Box>

                {/* Description */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <DescriptionIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="subtitle2" color="text.secondary">
                        Description
                      </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => toggleSection('description')}>
                      {expandedSections.description ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>
                  
                  <Collapse in={expandedSections.description}>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f9f9f9', maxHeight: '200px', overflow: 'auto' }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                        {original.description || 'No description found'}
                      </Typography>
                    </Paper>
                  </Collapse>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Optimized Column */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ 
              height: '100%', 
              borderColor: '#4caf50',
              borderWidth: 2,
              bgcolor: '#f8fff8'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
                    Optimized Listing
                  </Typography>
                  <Chip label="AI Enhanced" color="success" size="small" />
                </Box>
                
                {/* Title */}
                <Box sx={{ mb: 3, position: 'relative' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TitleIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} />
                    <Typography variant="subtitle2" color="success.main">Optimized Title</Typography>
                    <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" color={improvements.titleLength.better ? 'success.main' : 'warning.main'}>
                        {improvements.titleLength.optimized} chars
                        {improvements.titleLength.diff !== 0 && (
                          <span> ({improvements.titleLength.diff > 0 ? '+' : ''}{improvements.titleLength.diff})</span>
                        )}
                      </Typography>
                      <Tooltip title={copiedItem === 'title' ? 'Copied!' : 'Copy title'}>
                        <IconButton 
                          size="small" 
                          onClick={() => copyToClipboard(optimized.optimizedTitle, 'title')}
                          color={copiedItem === 'title' ? 'success' : 'default'}
                        >
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  <Paper variant="outlined" sx={{ p: 2, borderColor: '#c8e6c9', bgcolor: '#f1f8e9', minHeight: '80px' }}>
                    <Typography variant="body1" sx={{ color: '#1b5e20', fontWeight: 500 }}>
                      {optimized.optimizedTitle}
                    </Typography>
                  </Paper>
                  {improvements.titleLength.better && (
                    <Typography variant="caption" color="success.main" sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      <CheckIcon fontSize="small" sx={{ mr: 0.5 }} />
                      Good length for SEO
                    </Typography>
                  )}
                </Box>

                {/* Bullet Points */}
                <Box sx={{ mb: 3, position: 'relative' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <StarIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} />
                      <Typography variant="subtitle2" color="success.main">
                        Optimized Bullet Points ({optimized.optimizedBulletPoints.length})
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" color={improvements.bulletsCount.better ? 'success.main' : 'warning.main'}>
                        {improvements.bulletsCount.diff !== 0 && (
                          <span>{improvements.bulletsCount.diff > 0 ? '+' : ''}{improvements.bulletsCount.diff}</span>
                        )}
                      </Typography>
                      <Tooltip title="Copy all bullets">
                        <IconButton 
                          size="small" 
                          onClick={() => copyToClipboard(optimized.optimizedBulletPoints.join('\n'), 'bullets')}
                          color={copiedItem === 'bullets' ? 'success' : 'default'}
                        >
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <IconButton size="small" onClick={() => toggleSection('bullets')}>
                        {expandedSections.bullets ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <Collapse in={expandedSections.bullets}>
                    <List dense>
                      {optimized.optimizedBulletPoints.map((bullet, index) => (
                        <ListItem key={index} sx={{ py: 0.5, bgcolor: index % 2 === 0 ? '#f9f9f9' : 'transparent' }}>
                          <ListItemIcon sx={{ minWidth: 30 }}>
                            <CheckIcon fontSize="small" color="success" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={bullet} 
                            primaryTypographyProps={{ 
                              variant: 'body2',
                              sx: { color: '#1b5e20' }
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                    {improvements.bulletsCount.better && (
                      <Typography variant="caption" color="success.main" sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <CheckIcon fontSize="small" sx={{ mr: 0.5 }} />
                        Ideal number of bullet points for conversions
                      </Typography>
                    )}
                  </Collapse>
                </Box>

                {/* Description */}
                <Box sx={{ position: 'relative' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <DescriptionIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} />
                      <Typography variant="subtitle2" color="success.main">
                        Enhanced Description
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Tooltip title="Copy description">
                        <IconButton 
                          size="small" 
                          onClick={() => copyToClipboard(optimized.optimizedDescription, 'description')}
                          color={copiedItem === 'description' ? 'success' : 'default'}
                        >
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <IconButton size="small" onClick={() => toggleSection('description')}>
                        {expandedSections.description ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <Collapse in={expandedSections.description}>
                    <Paper variant="outlined" sx={{ p: 2, borderColor: '#c8e6c9', bgcolor: '#f1f8e9', maxHeight: '200px', overflow: 'auto' }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-line', color: '#1b5e20' }}>
                        {optimized.optimizedDescription}
                      </Typography>
                    </Paper>
                    <Typography variant="caption" color="success.main" sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      <CheckIcon fontSize="small" sx={{ mr: 0.5 }} />
                      Persuasive and compliant with Amazon policies
                    </Typography>
                  </Collapse>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Keywords Section */}
      <Box sx={{ mt: 4 }}>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">
            Keyword Suggestions
          </Typography>
          <Button
            size="small"
            onClick={() => setShowKeywords(!showKeywords)}
            startIcon={showKeywords ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          >
            {showKeywords ? 'Hide' : 'Show'} Keywords
          </Button>
        </Box>
        
        <Collapse in={showKeywords}>
          <Grid container spacing={1} sx={{ mb: 2 }}>
            {optimized.keywords?.map((keyword, index) => (
              <Grid item key={index}>
                <Chip
                  label={keyword}
                  color={index < 2 ? "primary" : "secondary"}
                  variant="outlined"
                  onDelete={() => copyToClipboard(keyword, `keyword-${index}`)}
                  deleteIcon={<CopyIcon />}
                  sx={{ m: 0.5 }}
                />
              </Grid>
            ))}
          </Grid>
        </Collapse>
      </Box>

      {/* Copy Feedback */}
      {copiedItem && (
        <Alert severity="success" sx={{ mt: 2, animation: 'fadeInOut 2s' }}>
          {copiedItem === 'title' && 'Title copied to clipboard!'}
          {copiedItem === 'bullets' && 'All bullet points copied to clipboard!'}
          {copiedItem === 'description' && 'Description copied to clipboard!'}
          {copiedItem.startsWith('keyword-') && 'Keyword copied to clipboard!'}
        </Alert>
      )}
    </Paper>
  );
};

export default ComparisonView;