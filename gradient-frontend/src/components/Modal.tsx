import React, { useState, useEffect, useRef } from 'react';
import { CheckCircleIcon, XCircleIcon, AlertCircleIcon, CloseIcon } from './Icons';

interface ModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void | Promise<void>;
  readonly title: string;
  readonly message: string;
  readonly type: 'accept' | 'cancel' | 'warning';
  readonly confirmText?: string;
  readonly cancelText?: string;
}

export function Modal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}: ModalProps): JSX.Element | null {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus management: automatic focus based on safety/action type when open
  useEffect(() => {
    if (isOpen) {
      if (type === 'cancel') {
        // Focus the safer 'Cancel' button first for destructive actions
        cancelRef.current?.focus();
      } else {
        // Focus 'Confirm' button first for constructive actions
        confirmRef.current?.focus();
      }
    }
  }, [isOpen, type]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isSubmitting]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = async (): Promise<void> => {
    try {
      setIsSubmitting(true);
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Configure appearance based on modal type
  let typeClass = '';
  let IconComponent = CheckCircleIcon;

  switch (type) {
    case 'accept':
      typeClass = 'modal-type-accept';
      IconComponent = CheckCircleIcon;
      break;
    case 'cancel':
      typeClass = 'modal-type-cancel';
      IconComponent = XCircleIcon;
      break;
    case 'warning':
      typeClass = 'modal-type-warning';
      IconComponent = AlertCircleIcon;
      break;
  }

  return (
    <div className="modal-overlay" onClick={isSubmitting ? undefined : onClose}>
      <div 
        className={`modal-window ${typeClass}`} 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <button 
          type="button" 
          className="modal-close-btn" 
          onClick={onClose}
          disabled={isSubmitting}
          aria-label="Close modal"
        >
          <CloseIcon size={18} />
        </button>

        <div className="modal-content-wrapper">
          <div className="modal-icon-container">
            <IconComponent size={28} className="modal-type-icon" />
          </div>
          
          <div className="modal-text-content">
            <h3 id="modal-title" className="modal-title-text">{title}</h3>
            <p className="modal-message-text">{message}</p>
          </div>
        </div>

        <div className="modal-actions-wrapper">
          <button
            ref={cancelRef}
            type="button"
            className="btn btn-secondary modal-btn-cancel"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {cancelText}
          </button>
          
          <button
            ref={confirmRef}
            type="button"
            className={`btn modal-btn-confirm ${isSubmitting ? 'submitting' : ''}`}
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="btn-spinner"></span>
            ) : null}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
