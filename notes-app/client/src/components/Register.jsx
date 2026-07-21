import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setFormError('');
    
    // Check password strength when password changes
    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };

  // Password strength checker
  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    setPasswordStrength(strength);
  };

  const getStrengthLabel = () => {
    if (formData.password.length === 0) return '';
    if (passwordStrength <= 1) return 'Weak';
    if (passwordStrength <= 3) return 'Medium';
    return 'Strong';
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 1) return '#e53e3e';
    if (passwordStrength <= 3) return '#f57c00';
    return '#38a169';
  };

  const validateForm = () => {
    // Trim inputs
    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    
    if (!name || !email || !formData.password) {
      setFormError('Please fill in all fields');
      return false;
    }
    
    // Name validation
    if (name.length < 2) {
      setFormError('Name must be at least 2 characters');
      return false;
    }
    if (name.length > 50) {
      setFormError('Name must be less than 50 characters');
      return false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFormError('Please enter a valid email address');
      return false;
    }
    
    // Password validation
    if (formData.password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password.length > 128) {
      setFormError('Password is too long');
      return false;
    }
    
    // Confirm password
    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setFormError('');

    // Sanitize inputs before sending
    const sanitizedData = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password // Don't trim password
    };

    const result = await register(
      sanitizedData.name,
      sanitizedData.email,
      sanitizedData.password
    );
    
    if (!result.success) {
      setFormError(result.message);
    }
    // Don't show specific errors like "User exists" - keep it generic
    
    setIsSubmitting(false);
  };

  // If already authenticated, don't render the form
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">🚀</div>
          <h2>Create Account</h2>
          <p className="auth-subtitle">Start organizing your notes today</p>
        </div>
        
        {/* Error Message - Generic, no specific details */}
        {formError && (
          <div className="error-message" role="alert">
            <span className="error-icon">⚠️</span>
            <span>{formError}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} noValidate>
          {/* Name Field */}
          <div className="form-group">
            <label htmlFor="name">
              Full Name
              <span className="required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              autoComplete="name"
              maxLength={50}
              aria-required="true"
              aria-describedby="name-hint"
            />
            <small id="name-hint" className="sr-only">
              Enter your full name, between 2 and 50 characters
            </small>
          </div>
          
          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email">
              Email Address
              <span className="required">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              autoComplete="email"
              maxLength={254}
              aria-required="true"
              aria-describedby="email-hint"
            />
            <small id="email-hint" className="sr-only">
              Enter a valid email address
            </small>
          </div>
          
          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password">
              Password
              <span className="required">*</span>
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a strong password"
                autoComplete="new-password"
                minLength={6}
                maxLength={128}
                aria-required="true"
                aria-describedby="password-strength"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {formData.password.length > 0 && (
              <div className="password-strength" id="password-strength">
                <div className="strength-bar">
                  <div
                    className="strength-fill"
                    style={{
                      width: `${(passwordStrength / 5) * 100}%`,
                      backgroundColor: getStrengthColor()
                    }}
                  ></div>
                </div>
                <span 
                  className="strength-label"
                  style={{ color: getStrengthColor() }}
                >
                  {getStrengthLabel()}
                </span>
              </div>
            )}
            
            <small className="password-hint">
              Min 6 characters. Use letters, numbers & symbols for strength
            </small>
          </div>
          
          {/* Confirm Password Field */}
          <div className="form-group">
            <label htmlFor="confirmPassword">
              Confirm Password
              <span className="required">*</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              maxLength={128}
              aria-required="true"
            />
            {/* Match indicator */}
            {formData.confirmPassword.length > 0 && (
              <small className={`match-indicator ${formData.password === formData.confirmPassword ? 'match' : 'no-match'}`}>
                {formData.password === formData.confirmPassword ? '✅ Passwords match' : '❌ Passwords do not match'}
              </small>
            )}
          </div>
          
          {/* Submit Button */}
          <button 
            type="submit" 
            className="btn-primary"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>
        
        {/* Login Link */}
        <p className="auth-link">
          Already have an account?{' '}
          <Link to="/login">Sign in here</Link>
        </p>
        
        {/* Terms & Privacy */}
        <p className="terms-text">
          By creating an account, you agree to our{' '}
          <Link to="/terms">Terms of Service</Link> and{' '}
          <Link to="/privacy">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;