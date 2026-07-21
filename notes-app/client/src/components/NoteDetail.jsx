import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getNoteById, deleteNote } from '../services/api';
import './NoteDetail.css';

function NoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');

  useEffect(() => {
    loadNote();
  }, [id]);

  const loadNote = async () => {
    try {
      setLoading(true);
      const res = await getNoteById(id);
      setNote(res.data.data || res.data);
    } catch (error) {
      console.error('Error loading note:', error);
      setError('Note not found');
      setTimeout(() => navigate('/'), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteNote(id);
      navigate('/');
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCopyContent = () => {
    if (note) {
      navigator.clipboard.writeText(`${note.title}\n\n${note.description}`);
      setCopySuccess('Copied!');
      setTimeout(() => setCopySuccess(''), 2000);
    }
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return '';
    const now = new Date();
    const date = new Date(dateString);
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDate(dateString);
  };

  // Loading state
  if (loading) {
    return (
      <div className="detail-container">
        <div className="detail-loading">
          <div className="loading-animation">
            <div className="loading-circle"></div>
            <div className="loading-circle"></div>
            <div className="loading-circle"></div>
          </div>
          <h3>Loading your note...</h3>
          <p>Fetching the details</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="detail-container">
        <div className="detail-error">
          <div className="error-illustration">🔍</div>
          <h2>Note Not Found</h2>
          <p>{error}</p>
          <p className="redirect-message">Redirecting to home page...</p>
          <button onClick={() => navigate('/')} className="btn-home">
            🏠 Go Home Now
          </button>
        </div>
      </div>
    );
  }

  // Note not loaded
  if (!note) {
    return (
      <div className="detail-container">
        <div className="detail-error">
          <p>Note data not available</p>
          <Link to="/" className="btn-home-link">← Back to Notes</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-container">
      <div className="detail-wrapper">
        {/* Navigation Bar */}
        <div className="detail-nav">
          <Link to="/" className="back-button">
            <span className="back-arrow">←</span>
            <span>Back to Notes</span>
          </Link>
          <div className="nav-actions">
            <button onClick={handleCopyContent} className="btn-icon-action" title="Copy content">
              {copySuccess ? '✅' : '📋'}
            </button>
            <Link to={`/edit/${note._id}`} className="btn-icon-action" title="Edit note">
              ✏️
            </Link>
            <button 
              onClick={() => setShowDeleteConfirm(true)} 
              className="btn-icon-action btn-delete-icon" 
              title="Delete note"
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Copy Success Toast */}
        {copySuccess && (
          <div className="copy-toast">
            {copySuccess}
          </div>
        )}

        {/* Main Content Card */}
        <div className="detail-card">
          {/* Card Header */}
          <div className="card-header">
            <div className="card-header-top">
              <div className="status-badge">
                <span className="status-dot"></span>
                Note Details
              </div>
              <span className="note-id-badge">
                ID: {note._id.substring(0, 8)}...
              </span>
            </div>
            <h1 className="note-title-detail">{note.title}</h1>
          </div>

          {/* Card Body */}
          <div className="card-body">
            <div className="description-wrapper">
              <div className="description-label">
                <span className="label-dot"></span>
                Description
              </div>
              <div className="description-content">
                {note.description.split('\n').map((paragraph, index) => (
                  <p key={index}>{paragraph || '\u00A0'}</p>
                ))}
              </div>
            </div>
          </div>

          {/* Card Footer */}
          <div className="card-footer">
            <div className="footer-info">
              <div className="info-item">
                <div className="info-icon">📅</div>
                <div className="info-content">
                  <span className="info-label">Created</span>
                  <span className="info-value">{formatDate(note.createdAt)}</span>
                  <span className="info-relative">{getTimeAgo(note.createdAt)}</span>
                </div>
              </div>
              
              <div className="info-divider"></div>
              
              <div className="info-item">
                <div className="info-icon">🔄</div>
                <div className="info-content">
                  <span className="info-label">Last Updated</span>
                  <span className="info-value">{formatDate(note.updatedAt)}</span>
                  <span className="info-relative">{getTimeAgo(note.updatedAt)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="footer-actions">
              <button onClick={handleCopyContent} className="btn-action-detail btn-copy">
                <span>📋</span>
                Copy Content
              </button>
              <Link to={`/edit/${note._id}`} className="btn-action-detail btn-edit-detail">
                <span>✏️</span>
                Edit Note
              </Link>
              <button 
                onClick={() => setShowDeleteConfirm(true)} 
                className="btn-action-detail btn-delete-detail"
              >
                <span>🗑️</span>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">⚠️</div>
            <h2>Delete Note?</h2>
            <p>Are you sure you want to delete "<strong>{note.title}</strong>"?</p>
            <p className="modal-warning">This action cannot be undone.</p>
            <div className="modal-actions">
              <button 
                onClick={() => setShowDeleteConfirm(false)} 
                className="btn-modal-cancel"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete} 
                className="btn-modal-delete"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <span className="spinner-tiny"></span>
                    Deleting...
                  </>
                ) : (
                  'Yes, Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NoteDetail;