import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getNoteById, updateNote } from '../services/api';
import './EditNote.css';

function EditNote() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ 
    title: '', 
    description: '' 
  });
  const [originalForm, setOriginalForm] = useState({ title: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadNote();
  }, [id]);

  const loadNote = async () => {
    try {
      setLoading(true);
      const res = await getNoteById(id);
      const note = res.data.data || res.data;
      setForm({ 
        title: note.title, 
        description: note.description 
      });
      setOriginalForm({ 
        title: note.title, 
        description: note.description 
      });
    } catch (error) {
      console.error('Error loading note:', error);
      setError('Note not found or you don\'t have permission to edit it.');
      setTimeout(() => navigate('/'), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ 
      ...form, 
      [e.target.name]: e.target.value 
    });
    setError('');
    setSuccessMessage('');
  };

  const hasChanges = () => {
    return form.title !== originalForm.title || 
           form.description !== originalForm.description;
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

    if (!hasChanges()) {
      setError('No changes detected. Make some edits first!');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await updateNote(id, form);
      setSuccessMessage('Note updated successfully! Redirecting...');
      setTimeout(() => navigate('/'), 1000);
    } catch (error) {
      console.error('Error updating note:', error);
      setError(error.response?.data?.message || 'Failed to update note');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges()) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset all changes to original?')) {
      setForm({ ...originalForm });
      setError('');
      setSuccessMessage('');
    }
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Loading state
  if (loading) {
    return (
      <div className="edit-note-container">
        <div className="loading-card">
          <div className="loading-spinner-edit">
            <div className="spinner-edit"></div>
          </div>
          <h3>Loading your note...</h3>
          <p>Please wait a moment</p>
        </div>
      </div>
    );
  }

  // Error state (note not found)
  if (error && !form.title) {
    return (
      <div className="edit-note-container">
        <div className="error-card-edit">
          <div className="error-icon-edit">🔍</div>
          <h2>Note Not Found</h2>
          <p>{error}</p>
          <p className="redirect-text">Redirecting to home page...</p>
          <button onClick={() => navigate('/')} className="btn-go-home">
            Go Home Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-note-container">
      <div className="edit-note-wrapper">
        {/* Header */}
        <div className="form-header-edit">
          <div className="header-icon-edit">✏️</div>
          <h1>Edit Note</h1>
          <p className="header-subtitle-edit">Update your thoughts and ideas</p>
          <div className="note-meta-edit">
            <span className="note-id">ID: {id.substring(0, 8)}...</span>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="success-alert">
            <span className="success-icon">✅</span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-alert-edit">
            <span className="error-icon-edit-text">⚠️</span>
            <span>{error}</span>
            <button onClick={() => setError('')} className="error-close-edit">✕</button>
          </div>
        )}

        {/* Changes Indicator */}
        {hasChanges() && (
          <div className="changes-indicator">
            <span className="changes-dot"></span>
            You have unsaved changes
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="edit-note-form">
          {/* Title Input */}
          <div className="input-group-edit">
            <label htmlFor="title">
              <span className="label-icon-edit">📌</span>
              Title
            </label>
            <div className="input-wrapper-edit">
              <input
                type="text"
                id="title"
                name="title"
                placeholder="Enter note title"
                value={form.title}
                onChange={handleChange}
                maxLength={100}
                className={form.title !== originalForm.title ? 'input-modified' : ''}
              />
              <div className="input-footer-edit">
                <span className="character-count-edit">
                  {form.title.length}/100 characters
                </span>
                {form.title.length >= 90 && (
                  <span className="character-warning-edit">
                    Almost at limit!
                  </span>
                )}
                {form.title !== originalForm.title && (
                  <span className="modified-badge">Modified</span>
                )}
              </div>
            </div>
          </div>

          {/* Description Input */}
          <div className="input-group-edit">
            <label htmlFor="description">
              <span className="label-icon-edit">📄</span>
              Description
            </label>
            <div className="input-wrapper-edit">
              <textarea
                id="description"
                name="description"
                placeholder="Write your thoughts, ideas, or anything you want to remember..."
                value={form.description}
                onChange={handleChange}
                rows="8"
                maxLength={1000}
                className={form.description !== originalForm.description ? 'input-modified' : ''}
              />
              <div className="input-footer-edit">
                <span className="character-count-edit">
                  {form.description.length}/1000 characters
                </span>
                {form.description.length >= 900 && (
                  <span className="character-warning-edit">
                    Almost at limit!
                  </span>
                )}
                {form.description !== originalForm.description && (
                  <span className="modified-badge">Modified</span>
                )}
                <div className="character-bar-edit">
                  <div 
                    className="character-bar-fill-edit"
                    style={{ width: `${(form.description.length / 1000) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions-edit">
            <button 
              type="submit" 
              className="btn-save"
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="spinner-small-edit"></span>
                  Saving Changes...
                </>
              ) : (
                <>
                  <span>💾</span>
                  Update Note
                </>
              )}
            </button>
            <button 
              type="button" 
              onClick={handleReset}
              className="btn-reset"
              disabled={saving || !hasChanges()}
            >
              <span>🔄</span>
              Reset
            </button>
            <button 
              type="button" 
              onClick={handleCancel}
              className="btn-cancel-edit"
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditNote;