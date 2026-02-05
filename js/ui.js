/**
 * Shared UI Components and Utilities
 * Used across all pages
 */

class UI {
    constructor() {
        this.initEventListeners();
        this.initMobileNavigation();
        this.setupGlobalErrorHandling();
    }

    initEventListeners() {
        // Initialize tooltips
        this.initTooltips();
        
        // Initialize file drag and drop
        this.initFileDragAndDrop();
        
        // Initialize form validation
        this.initFormValidation();
    }

    initMobileNavigation() {
        // Create mobile menu toggle
        const nav = document.querySelector('.nav-links');
        if (nav && window.innerWidth <= 768) {
            const menuToggle = document.createElement('button');
            menuToggle.className = 'mobile-menu-toggle';
            menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
            menuToggle.setAttribute('aria-label', 'Toggle menu');
            
            const navbar = document.querySelector('.navbar');
            navbar.insertBefore(menuToggle, nav);
            
            menuToggle.addEventListener('click', () => {
                nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
                menuToggle.innerHTML = nav.style.display === 'flex' ? 
                    '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
            });
            
            // Handle window resize
            window.addEventListener('resize', () => {
                if (window.innerWidth > 768) {
                    nav.style.display = 'flex';
                    menuToggle.style.display = 'none';
                } else {
                    nav.style.display = 'none';
                    menuToggle.style.display = 'block';
                }
            });
            
            // Initial state
            if (window.innerWidth <= 768) {
                nav.style.display = 'none';
                menuToggle.style.display = 'block';
            }
        }
    }

    initTooltips() {
        // Tooltip implementation
        const tooltipElements = document.querySelectorAll('[data-tooltip]');
        
        tooltipElements.forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                const tooltipText = e.target.getAttribute('data-tooltip');
                this.createTooltip(e.target, tooltipText);
            });
            
            element.addEventListener('mouseleave', (e) => {
                this.removeTooltip(e.target);
            });
        });
    }

    createTooltip(element, text) {
        // Remove existing tooltip
        this.removeTooltip(element);
        
        // Create new tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        
        // Style the tooltip
        tooltip.style.cssText = `
            position: absolute;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 1000;
            white-space: nowrap;
            pointer-events: none;
            transform: translateY(-100%);
            margin-top: -8px;
        `;
        
        // Position the tooltip
        const rect = element.getBoundingClientRect();
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.top = `${rect.top}px`;
        
        // Add to DOM
        document.body.appendChild(tooltip);
        
        // Center horizontally
        tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
        
        // Store reference
        element._tooltip = tooltip;
    }

    removeTooltip(element) {
        if (element._tooltip) {
            element._tooltip.remove();
            element._tooltip = null;
        }
    }

    initFileDragAndDrop() {
        // This is implemented per tool page
        // Common drag and drop styles are handled in CSS
    }

    initFormValidation() {
        // Form validation for number inputs
        const numberInputs = document.querySelectorAll('input[type="number"]');
        numberInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const min = parseFloat(e.target.min) || 0;
                const max = parseFloat(e.target.max) || Infinity;
                let value = parseFloat(e.target.value) || min;
                
                if (value < min) value = min;
                if (value > max) value = max;
                
                e.target.value = value;
            });
        });
    }

    setupGlobalErrorHandling() {
        // Global error handler for uncaught errors
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.showNotification('An unexpected error occurred. Please try again.', 'error');
        });
        
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.showNotification('An error occurred while processing. Please try again.', 'error');
        });
    }

    // Notification system
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icon = type === 'success' ? 'check-circle' : 
                    type === 'error' ? 'exclamation-circle' : 
                    type === 'warning' ? 'exclamation-triangle' : 'info-circle';
        
        notification.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add styles if not already present
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 1rem 1.5rem;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    z-index: 9999;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    animation: slideIn 0.3s ease;
                    max-width: 400px;
                }
                
                .notification-success {
                    background: #4cc9f0;
                    color: white;
                }
                
                .notification-error {
                    background: #f72585;
                    color: white;
                }
                
                .notification-warning {
                    background: #ff9e00;
                    color: white;
                }
                
                .notification-info {
                    background: #4361ee;
                    color: white;
                }
                
                .notification-close {
                    background: transparent;
                    border: none;
                    color: inherit;
                    cursor: pointer;
                    margin-left: auto;
                    opacity: 0.8;
                }
                
                .notification-close:hover {
                    opacity: 1;
                }
                
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    // File size formatting
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Create file preview element
    createFilePreview(file, index) {
        const isImage = file.type.startsWith('image/');
        const isPDF = file.type === 'application/pdf';
        
        const div = document.createElement('div');
        div.className = 'file-preview';
        div.dataset.index = index;
        
        let icon = 'file';
        if (isImage) icon = 'file-image';
        if (isPDF) icon = 'file-pdf';
        
        div.innerHTML = `
            <div class="file-preview-icon">
                <i class="fas fa-${icon}"></i>
            </div>
            <div class="file-preview-info">
                <div class="file-name">${file.name}</div>
                <div class="file-size">${this.formatFileSize(file.size)}</div>
            </div>
            <button class="file-remove" data-index="${index}">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        return div;
    }

    // Show/hide loading spinner
    showLoading(container) {
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        spinner.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        container.appendChild(spinner);
        return spinner;
    }

    hideLoading(spinner) {
        if (spinner && spinner.parentNode) {
            spinner.remove();
        }
    }

    // Update progress bar
    updateProgressBar(container, percentage) {
        const progressBar = container.querySelector('.progress-fill');
        const progressText = container.querySelector('.progress-text');
        
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
        
        if (progressText) {
            progressText.textContent = `${Math.round(percentage)}%`;
        }
    }

    // Confirm dialog
    async confirm(message) {
        return new Promise((resolve) => {
            const dialog = document.createElement('div');
            dialog.className = 'confirm-dialog';
            dialog.innerHTML = `
                <div class="confirm-content">
                    <p>${message}</p>
                    <div class="confirm-buttons">
                        <button class="btn btn-secondary confirm-cancel">Cancel</button>
                        <button class="btn btn-primary confirm-ok">OK</button>
                    </div>
                </div>
            `;
            
            // Add styles
            const style = document.createElement('style');
            style.textContent = `
                .confirm-dialog {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                }
                
                .confirm-content {
                    background: white;
                    padding: 2rem;
                    border-radius: 12px;
                    max-width: 400px;
                    width: 90%;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                }
                
                .confirm-buttons {
                    display: flex;
                    gap: 1rem;
                    margin-top: 1.5rem;
                }
                
                .confirm-buttons button {
                    flex: 1;
                }
            `;
            
            document.head.appendChild(style);
            document.body.appendChild(dialog);
            
            // Add event listeners
            dialog.querySelector('.confirm-cancel').addEventListener('click', () => {
                dialog.remove();
                style.remove();
                resolve(false);
            });
            
            dialog.querySelector('.confirm-ok').addEventListener('click', () => {
                dialog.remove();
                style.remove();
                resolve(true);
            });
        });
    }
}

// Initialize UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.ui = new UI();
    
    // Add CSS for mobile menu if needed
    if (window.innerWidth <= 768) {
        const style = document.createElement('style');
        style.textContent = `
            .mobile-menu-toggle {
                background: none;
                border: none;
                font-size: 1.5rem;
                color: var(--primary-color);
                cursor: pointer;
                padding: 0.5rem;
            }
            
            @media (max-width: 768px) {
                .nav-links {
                    flex-direction: column;
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: white;
                    padding: 1rem;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
            }
        `;
        document.head.appendChild(style);
    }
});