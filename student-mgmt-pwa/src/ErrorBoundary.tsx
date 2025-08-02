import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Box, Card, Typography, Button, Alert } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          background: 'linear-gradient(135deg, #e3f0ff 0%, #f9f9f9 100%)' 
        }}>
          <Card sx={{ p: 4, maxWidth: 500, boxShadow: 6, borderRadius: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ErrorOutlineIcon sx={{ fontSize: 40, color: '#f44336', mr: 2 }} />
              <Typography variant="h5" color="error">
                Something went wrong
              </Typography>
            </Box>
            
            <Alert severity="error" sx={{ mb: 3 }}>
              An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
            </Alert>

            <Typography variant="body2" sx={{ mb: 3, color: '#666' }}>
              If you continue to see this error, please:
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
              <Typography variant="body2" sx={{ color: '#666' }}>
                • Check your internet connection
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                • Make sure the backend server is running
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                • Clear your browser cache and cookies
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={this.handleReload}
                sx={{ flex: 1 }}
              >
                Refresh Page
              </Button>
              <Button
                variant="outlined"
                onClick={this.handleGoHome}
              >
                Go to Home
              </Button>
            </Box>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                  Debug Information (Development Only):
                </Typography>
                <Typography variant="caption" component="div" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  {this.state.error.toString()}
                </Typography>
              </Box>
            )}
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 