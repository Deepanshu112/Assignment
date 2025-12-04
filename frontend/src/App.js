// src/App.js
import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CssBaseline,
  Alert,
  CircularProgress,
  Fab,
  Button,
  Chip,
  Badge,
  Divider,
  Paper,
  ThemeProvider,
  createTheme,
  alpha,
  styled
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Close as CloseIcon,
  ArrowUpward as ArrowUpwardIcon,
  GitHub as GitHubIcon,
  Notifications as NotificationsIcon,
  TrendingUp as TrendingUpIcon,
  Bolt as BoltIcon,
  Palette as PaletteIcon,
  Rocket as RocketIcon,
  Amazon as AmazonIcon,
  Analytics as AnalyticsIcon,
  AutoAwesome as AutoAwesomeIcon,
  BarChart as BarChartIcon,
  Whatshot as WhatshotIcon, // Alternative for Sparkles
  Star as StarIcon, // Alternative for Sparkles
  EmojiEvents as EmojiEventsIcon,
  OfflineBolt as OfflineBoltIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import ASINForm from './components/ASINForm';
import ComparisonView from './components/ComparisonView';
import HistoryView from './components/HistoryView';
import { optimizeService } from './services/api';

// Modern theme with gradient and shadows
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6366F1',
      light: '#8B5CF6',
      dark: '#4F46E5',
    },
    secondary: {
      main: '#10B981',
      light: '#34D399',
      dark: '#059669',
    },
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF',
    },
    gradient: {
      primary: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
      secondary: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
      accent: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 800,
      background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    h5: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 500,
      color: '#64748B',
    },
  },
  shape: {
    borderRadius: 16,
  },
  shadows: [
    'none',
    '0px 2px 8px rgba(99, 102, 241, 0.1)',
    '0px 4px 20px rgba(99, 102, 241, 0.15)',
    '0px 8px 32px rgba(99, 102, 241, 0.2)',
    ...Array(21).fill('none')
  ],
});

// Custom styled components
const GlassPaper = styled(Paper)(({ theme }) => ({
  background: alpha(theme.palette.background.paper, 0.85),
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: theme.shadows[2],
}));

const GradientButton = styled(Button)(({ theme }) => ({
  background: theme.palette.gradient.primary,
  color: 'white',
  fontWeight: 600,
  textTransform: 'none',
  padding: '12px 32px',
  borderRadius: 12,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 12px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
  },
}));

const StatusBadge = styled(Chip)(({ theme, status }) => ({
  fontWeight: 600,
  borderRadius: 20,
  background: status === 'online' 
    ? alpha(theme.palette.secondary.main, 0.1)
    : alpha(theme.palette.error.main, 0.1),
  color: status === 'online' 
    ? theme.palette.secondary.dark
    : theme.palette.error.dark,
  border: `1px solid ${status === 'online' 
    ? theme.palette.secondary.light
    : theme.palette.error.light
  }`,
}));

function App() {
  const [optimizationData, setOptimizationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [view, setView] = useState('optimizer');
  const [selectedASIN, setSelectedASIN] = useState('');
  const [healthStatus, setHealthStatus] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [notifications] = useState(3);

  useEffect(() => {
    checkBackendHealth();
    
    const handleScroll = () => {
      setShowScrollTop(window.pageYOffset > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const checkBackendHealth = async () => {
    try {
      const health = await optimizeService.checkHealth();
      setHealthStatus(health);
    } catch (err) {
      console.error('Backend health check failed:', err);
    }
  };

  const handleOptimize = async (asin) => {
    setLoading(true);
    setError('');
    setSuccess('');
    setSelectedASIN(asin);
    
    try {
      const result = await optimizeService.optimizeProduct(asin);
      if (result.success) {
        setOptimizationData(result.data);
        setSuccess(`Successfully optimized ${asin}!`);
        setView('optimizer');
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to optimize product');
      console.error('Optimization error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistory = (asin) => {
    setSelectedASIN(asin || '');
    setView('history');
    setDrawerOpen(false);
  };

  const handleClearData = () => {
    setOptimizationData(null);
    setError('');
    setSuccess('');
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const menuItems = [
    { 
      text: 'Dashboard', 
      icon: <DashboardIcon />, 
      view: 'optimizer',
      badge: null
    },
    { 
      text: 'Optimization History', 
      icon: <HistoryIcon />, 
      view: 'history',
      badge: '12'
    },
  ];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      {/* Modern App Bar with gradient */}
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{
          background: theme.palette.gradient.primary,
          backdropFilter: 'blur(20px)',
          borderBottom: 'none',
        }}
      >
        <Toolbar sx={{ minHeight: '80px' }}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={() => setDrawerOpen(true)}
            sx={{ 
              mr: 2,
              background: 'rgba(255,255,255,0.1)',
              '&:hover': {
                background: 'rgba(255,255,255,0.2)',
              }
            }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <RocketIcon sx={{ mr: 1.5, fontSize: 32 }} />
            <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', color: 'white' }}>
              Optimizing <span style={{ fontWeight: 300 }}>project</span>
            </Typography>
            
          </Box>
          
        </Toolbar>
      </AppBar>

      {/* Modern Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 280,
            background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
            borderRight: '1px solid rgba(99, 102, 241, 0.1)',
          }
        }}
      >
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: theme.palette.gradient.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)',
            }}
          >
            <RocketIcon sx={{ fontSize: 32, color: 'white' }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Content Optimizer
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.5 }}>
            AI-powered listing optimization
          </Typography>
        </Box>
        
        <Divider sx={{ mx: 2 }} />
        
        <List sx={{ p: 2 }}>
          {menuItems.map((item) => (
            <ListItem
              button
              key={item.text}
              onClick={() => {
                setView(item.view);
                setDrawerOpen(false);
              }}
              sx={{
                borderRadius: 12,
                mb: 1,
                background: view === item.view ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                borderLeft: view === item.view ? `4px solid ${theme.palette.primary.main}` : 'none',
                '&:hover': {
                  background: alpha(theme.palette.primary.main, 0.05),
                }
              }}
            >
              <ListItemIcon sx={{ 
                color: view === item.view ? theme.palette.primary.main : '#64748B',
                minWidth: 40
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: view === item.view ? 600 : 500,
                }}
              />
              {item.badge && (
                <Chip
                  size="small"
                  label={item.badge}
                  sx={{
                    background: view === item.view ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.1),
                    color: view === item.view ? 'white' : theme.palette.primary.main,
                    fontSize: '0.65rem',
                    height: 20,
                  }}
                />
              )}
            </ListItem>
          ))}
        </List>
        
      </Drawer>

      {/* Main Content with modern layout */}
      <Box sx={{ 
        background: 'radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.05) 0%, transparent 50%)',
        minHeight: 'calc(100vh - 80px)'
      }}>
        <Container maxWidth="lg" sx={{ pt: 4, pb: 8 }}>          

          {/* Alerts */}
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
                border: 'none',
                color: '#991B1B',
                fontWeight: 500,
              }}
              icon={<ErrorIcon />}
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}

          {success && (
            <Alert 
              severity="success"
              sx={{ 
                mb: 3,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
                border: 'none',
                color: '#065F46',
                fontWeight: 500,
              }}
              icon={<CheckCircleIcon />}
              onClose={() => setSuccess('')}
            >
              {success}
            </Alert>
          )}

          {/* Optimizer View */}
          {view === 'optimizer' && (
            <>
              <ASINForm
                onOptimize={handleOptimize}
                onViewHistory={handleViewHistory}
                isLoading={loading}
              />
              
              {optimizationData && (
                <ComparisonView
                  data={optimizationData}
                  isLoading={loading}
                />
              )}

            </>
          )}

          {view === 'history' && (
            <HistoryView
              onSelectOptimization={(asin) => {
                setSelectedASIN(asin);
                setView('optimizer');
              }}
              selectedASIN={selectedASIN}
            />
          )}

          {/* Modern Loading Overlay */}
          {loading && (
            <Box sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999
            }}>
              <Box sx={{ textAlign: 'center', maxWidth: 400 }}>
                <Box
                  sx={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: theme.palette.gradient.primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                    animation: 'pulse 2s infinite',
                  }}
                >
                  <RocketIcon sx={{ fontSize: 48, color: 'white' }} />
                </Box>
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
                  Working Magic...
                </Typography>
                <Typography variant="body1" sx={{ color: '#64748B', mb: 3 }}>
                  AI is analyzing your product and generating optimized content
                </Typography>
                <CircularProgress 
                  size={60} 
                  thickness={4}
                  sx={{
                    color: theme.palette.primary.main,
                    animation: 'spin 1s linear infinite',
                  }}
                />
              </Box>
            </Box>
          )}
        </Container>
      </Box>

      {/* Animated Scroll to Top Button */}
      {showScrollTop && (
        <Fab
          onClick={scrollToTop}
          sx={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            background: theme.palette.gradient.primary,
            color: 'white',
            width: 56,
            height: 56,
            '&:hover': {
              transform: 'scale(1.1)',
              background: theme.palette.primary.dark,
            },
            transition: 'all 0.3s ease',
            boxShadow: '0 12px 24px rgba(99, 102, 241, 0.3)',
          }}
        >
          <ArrowUpwardIcon />
        </Fab>
      )}

      {/* Modern Footer */}
      <Box component="footer" sx={{ 
        py: 4, 
        px: 2,
        background: 'linear-gradient(180deg, #F1F5F9 0%, #E2E8F0 100%)',
        borderTop: '1px solid rgba(203, 213, 225, 0.3)'
      }}>
      </Box>

      {/* Global Styles */}
      <style jsx="true">{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        
        .gradient-text {
          background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #10B981 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .glass-effect {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </ThemeProvider>
  );
}

export default App;