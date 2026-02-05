/**
 * Image Tools - Complete implementation for all image tools
 * Includes: Compressor, WebP Converter, Resizer
 * All processing happens client-side
 */

class ImageTools {
    constructor() {
        this.currentTool = 'compressor'; // compressor, webp, resizer
        this.files = [];
        this.processedFiles = [];
    }

    // Common initialization for all tools
    initTool(toolName) {
        this.currentTool = toolName;
        this.files = [];
        this.processedFiles = [];
        
        // Setup common event listeners
        this.setupCommonEventListeners();
    }

    setupCommonEventListeners() {
        // This would be implemented based on the specific tool page
        // Each tool page has its own initialization
    }

    // Common file handling methods
    async compressImage(file, options = {}) {
        const defaultOptions = {
            maxSizeMB: 10,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            fileType: this.getFileType(file),
            initialQuality: 0.8
        };
        
        const finalOptions = { ...defaultOptions, ...options };
        
        try {
            const compressedFile = await imageCompression(file, finalOptions);
            return compressedFile;
        } catch (error) {
            console.error('Compression error:', error);
            throw error;
        }
    }

    async convertToWebP(file, quality = 0.8, lossless = false) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            
            img.onload = () => {
                URL.revokeObjectURL(url);
                
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                // Convert to WebP
                const qualityParam = lossless ? 1 : quality;
                const webpDataUrl = canvas.toDataURL('image/webp', qualityParam);
                const webpBlob = this.dataURLToBlob(webpDataUrl);
                
                const webpFile = new File([webpBlob], 
                    `${file.name.replace(/\.[^/.]+$/, "")}.webp`, 
                    { type: 'image/webp' }
                );
                
                resolve(webpFile);
            };
            
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load image'));
            };
            
            img.src = url;
        });
    }

    async resizeImage(file, width, height, maintainAspectRatio = true, outputFormat = 'original') {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            
            img.onload = () => {
                URL.revokeObjectURL(url);
                
                let newWidth = width;
                let newHeight = height;
                
                if (maintainAspectRatio) {
                    const aspectRatio = img.width / img.height;
                    
                    if (width && !height) {
                        newHeight = width / aspectRatio;
                    } else if (height && !width) {
                        newWidth = height * aspectRatio;
                    } else if (width && height) {
                        // Fit within dimensions while maintaining aspect ratio
                        const widthRatio = width / img.width;
                        const heightRatio = height / img.height;
                        const ratio = Math.min(widthRatio, heightRatio);
                        
                        newWidth = img.width * ratio;
                        newHeight = img.height * ratio;
                    }
                }
                
                const canvas = document.createElement('canvas');
                canvas.width = newWidth;
                canvas.height = newHeight;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, newWidth, newHeight);
                
                // Determine output format
                let mimeType = file.type;
                if (outputFormat !== 'original') {
                    mimeType = `image/${outputFormat}`;
                }
                
                // Convert to data URL
                const quality = 0.9; // Default quality
                const dataUrl = canvas.toDataURL(mimeType, quality);
                const blob = this.dataURLToBlob(dataUrl);
                
                const extension = outputFormat === 'original' ? 
                    this.getFileExtension(file.name) : outputFormat;
                
                const resizedFile = new File([blob], 
                    `${file.name.replace(/\.[^/.]+$/, "")}_${newWidth}x${newHeight}.${extension}`, 
                    { type: mimeType }
                );
                
                resolve(resizedFile);
            };
            
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load image'));
            };
            
            img.src = url;
        });
    }

    // Utility methods
    getFileType(file) {
        if (file.type.includes('png')) return 'image/png';
        if (file.type.includes('jpeg') || file.type.includes('jpg')) return 'image/jpeg';
        return file.type;
    }

    getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    }

    dataURLToBlob(dataURL) {
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        
        return new Blob([u8arr], { type: mime });
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    calculateSavings(originalSize, newSize) {
        const saved = originalSize - newSize;
        const percentage = ((saved / originalSize) * 100).toFixed(1);
        return {
            bytes: saved,
            percentage: percentage,
            isSaved: saved > 0
        };
    }

    // Error handling
    showError(element, message) {
        if (element) {
            element.classList.remove('hidden');
            element.innerHTML = `
                <i class="fas fa-exclamation-circle"></i>
                <span>${message}</span>
            `;
        }
    }

    hideError(element) {
        if (element) {
            element.classList.add('hidden');
        }
    }

    // Progress handling
    updateProgress(container, fill, text, percentage) {
        if (container) container.classList.remove('hidden');
        if (fill) fill.style.width = `${percentage}%`;
        if (text) text.textContent = `${Math.round(percentage)}%`;
    }

    hideProgress(container) {
        if (container) container.classList.add('hidden');
    }
}

// Create global instance
window.imageTools = new ImageTools();