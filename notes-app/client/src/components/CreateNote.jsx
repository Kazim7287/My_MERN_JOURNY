import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createNote } from '../services/api';
import './CreateNote.css';

function CreateNote() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ 
    title: '', 
    description: '' 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ 
      ...form, 
      [e.target.name]: e.target.value 
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!form.title.trim()) {
      setError('Please enter a title for your note ✏️');
      return;
    }
    if (!form.description.trim()) {
      setError('Please add some description to your note 📝');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await createNote(form);
      navigate('/');
    } catch (error) {
      console.error('Error creating note:', error);
      setError(error.response?.data?.message || 'Failed to create note');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (form.title || form.description) {
      if (window.confirm('Are you sure you want to discard your changes?')) {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  return (
    <div className="create-note-container">
      <div className="create-note-wrapper">
        {/* Header */}
        <div className="form-header">
          <div className="header-icon">📝</div>
          <h1>Create New Note</h1>
          <p className="header-subtitle">Capture your thoughts and ideas</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-alert">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
            <button onClick={() => setError('')} className="error-close">✕</button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="create-note-form">
          {/* Title Input */}
          <div className="input-group">
            <label htmlFor="title">
              <span className="label-icon">📌</span>
              Title
            </label>
            <div className="input-wrapper">
              <input
                type="text"
                id="title"
                name="title"
                placeholder="Give your note a catchy title..."
                value={form.title}
                onChange={handleChange}
                maxLength={100}
                autoFocus
              />
              <div className="input-footer">
                <span className="character-count">
                  {form.title.length}/100 characters
                </span>
                {form.title.length >= 90 && (
                  <span className="character-warning">
                    Almost at limit!
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description Input */}
          <div className="input-group">
            <label htmlFor="description">
              <span className="label-icon">📄</span>
              Description
            </label>
            <div className="input-wrapper">
              <textarea
                id="description"
                name="description"
                placeholder="Write your thoughts, ideas, or anything you want to remember..."
                value={form.description}
                onChange={handleChange}
                rows="8"
                maxLength={1000}
              />
              <div className="input-footer">
                <span className="character-count">
                  {form.description.length}/1000 characters
                </span>
                {form.description.length >= 900 && (
                  <span className="character-warning">
                    Almost at limit!
                  </span>
                )}
                <div className="character-bar">
                  <div 
                    className="character-bar-fill"
                    style={{ width: `${(form.description.length / 1000) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          {!form.title && !form.description && (
            <div className="tips-card">
              <h3>💡 Tips for a great note:</h3>
              <ul>
                <li>Use a clear and descriptive title</li>
                <li>Add details that will help you remember later</li>
                <li>You can always edit your notes anytime</li>
              </ul>
            </div>
          )}

          {/* Form Actions */}
          <div className="form-actions">
            <button 
              type="submit" 
              className="btn-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  Creating...
                </>
              ) : (
                <>
                  <span>✅</span>
                  Create Note
                </>
              )}
            </button>
            <button 
              type="button" 
              onClick={handleCancel}
              className="btn-cancel"
              disabled={loading}
            >
              Cancel
            </button>
          </div>

          {/* Keyboard Shortcuts Hint */}
          <p className="shortcuts-hint">
            💡 Press <kbd>Esc</kbd> to cancel or <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to submit
          </p>
        </form>
      </div>
    </div>
  );
}

export default CreateNote;