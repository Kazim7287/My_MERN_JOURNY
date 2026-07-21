const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ============ PROTECT MIDDLEWARE ============
const protect = async (req, res, next) => {
  let token;

  // Check if authorization header exists and starts with Bearer
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token (exclude password)
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        // 🔒 Don't log user ID in production
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Auth failed: User not found');
        }
        return res.status(401).json({
          success: false,
          message: "Authentication failed. Please login again.",
        });
      }

      // 🔒 Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Auth successful');
      }

      next();
    } catch (error) {
      // 🔒 Secured error logging - no token details
      if (process.env.NODE_ENV === 'development') {
        console.error(`❌ Auth error: ${error.name}`);
      }
      
      // Handle specific JWT errors
      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          message: "Invalid authentication. Please login again.",
        });
      }
      
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Your session has expired. Please login again.",
        });
      }

      if (error.name === "NotBeforeError") {
        return res.status(401).json({
          success: false,
          message: "Authentication not yet valid. Please try again later.",
        });
      }
      
      // Generic error - don't expose details
      res.status(401).json({
        success: false,
        message: "Authentication failed. Please login again.",
      });
    }
  } else {
    // No token provided
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Auth failed: No token provided');
    }
    
    return res.status(401).json({
      success: false,
      message: "Please login to access this resource.",
    });
  }
};

// ============ ADMIN MIDDLEWARE ============
const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Admin access granted');
    }
    next();
  } else {
    // 🔒 Don't reveal if user exists, just deny access
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Admin access denied');
    }
    
    res.status(403).json({
      success: false,
      message: "You do not have permission to perform this action.",
    });
  }
};

// ============ OPTIONAL: ROLE-BASED MIDDLEWARE ============
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!roles.includes(req.user.role)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`⚠️ Role '${req.user.role}' not authorized`);
      }
      
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action.",
      });
    }

    next();
  };
};

// ============ OPTIONAL: RATE LIMITING HELPER ============
const rateLimitStore = new Map();

const rateLimiter = (windowMs = 60000, maxRequests = 10) => {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!rateLimitStore.has(ip)) {
      rateLimitStore.set(ip, []);
    }
    
    const requests = rateLimitStore.get(ip);
    const windowStart = now - windowMs;
    
    // Remove old requests
    while (requests.length > 0 && requests[0] < windowStart) {
      requests.shift();
    }
    
    if (requests.length >= maxRequests) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`⚠️ Rate limit exceeded for IP: ${ip.replace(/\./g, '[.]')}`);
      }
      
      return res.status(429).json({
        success: false,
        message: "Too many requests. Please try again later.",
      });
    }
    
    requests.push(now);
    next();
  };
};

module.exports = { 
  protect, 
  admin, 
  authorize,
  rateLimiter 
};