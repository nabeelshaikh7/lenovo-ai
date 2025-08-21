const { supabase } = require('./supabaseClient');

/**
 * Express middleware to authenticate JWT tokens using Supabase
 * Extracts the JWT from the Authorization header and verifies it
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Get the Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ 
        error: 'Authorization header is required',
        message: 'Please provide a valid JWT token in the Authorization header'
      });
    }

    // Check if the header starts with 'Bearer '
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Invalid authorization format',
        message: 'Authorization header must start with "Bearer "'
      });
    }

    // Extract the token (remove 'Bearer ' prefix)
    const token = authHeader.substring(7);

    if (!token) {
      return res.status(401).json({ 
        error: 'Token is required',
        message: 'Please provide a valid JWT token'
      });
    }

    // Verify the token using Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('Token verification failed:', error);
      return res.status(401).json({ 
        error: 'Invalid or expired token',
        message: 'The provided JWT token is invalid or has expired'
      });
    }

    // Add the user to the request object for use in subsequent middleware/routes
    req.user = user;
    
    // Call next() to proceed to the next middleware or route handler
    next();
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'An error occurred while authenticating the request'
    });
  }
};

module.exports = authMiddleware;
