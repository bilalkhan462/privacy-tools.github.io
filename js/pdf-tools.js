/**
 * PDF Tools - Complete implementation for all PDF tools
 * Includes: Merge, Split
 * Uses pdf-lib library
 * All processing happens client-side
 */

class PDFTools {
    constructor() {
        this.currentTool = 'merge'; // merge, split
        this.files = [];
        this.processedPDF = null;
        this.pageCounts = {};
    }

    // Common initialization
    initTool(toolName) {
        this.currentTool = toolName;
        this.files = [];
        this.processedPDF = null;
        this.pageCounts = {};
    }

    // PDF Merger methods
    async mergePDFs(files) {
        try {
            const mergedPdf = await PDFLib.PDFDocument.create();
            let totalPages = 0;
            
            // Process each file in order
            for (const file of files) {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
                
                // Copy all pages
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach(page => {
                    mergedPdf.addPage(page);
                });
                
                totalPages += pdf.getPageCount();
            }
            
            // Save the merged PDF
            const mergedPdfBytes = await mergedPdf.save();
            const mergedBlob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
            
            return {
                blob: mergedBlob,
                size: mergedBlob.size,
                pages: totalPages
            };
            
        } catch (error) {
            console.error('PDF merge error:', error);
            throw error;
        }
    }

    // PDF Splitter methods
    async splitPDF(file, splitMethod, options = {}) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
            const totalPages = pdf.getPageCount();
            
            let pageIndices = [];
            
            switch (splitMethod) {
                case 'all':
                    // Split all pages into individual PDFs
                    pageIndices = Array.from({ length: totalPages }, (_, i) => [i]);
                    break;
                    
                case 'range':
                    // Extract a range of pages
                    const start = Math.max(1, options.start || 1) - 1;
                    const end = Math.min(totalPages, options.end || totalPages) - 1;
                    
                    if (start > end) {
                        throw new Error('Invalid page range');
                    }
                    
                    pageIndices = [Array.from({ length: end - start + 1 }, (_, i) => start + i)];
                    break;
                    
                case 'custom':
                    // Extract custom selected pages
                    if (!options.selectedPages || options.selectedPages.length === 0) {
                        throw new Error('No pages selected');
                    }
                    
                    // Convert to zero-based indices and sort
                    const selected = options.selectedPages
                        .map(p => p - 1)
                        .sort((a, b) => a - b);
                    
                    pageIndices = [selected];
                    break;
                    
                default:
                    throw new Error('Invalid split method');
            }
            
            // Create separate PDFs for each set of pages
            const splitFiles = [];
            
            for (const indices of pageIndices) {
                const newPdf = await PDFLib.PDFDocument.create();
                
                // Copy selected pages
                const copiedPages = await newPdf.copyPages(pdf, indices);
                copiedPages.forEach(page => {
                    newPdf.addPage(page);
                });
                
                // Save the new PDF
                const pdfBytes = await newPdf.save();
                const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
                
                // Create file name
                let fileName = file.name.replace(/\.[^/.]+$/, "");
                if (pageIndices.length > 1 || splitMethod === 'all') {
                    const pageNumbers = indices.map(i => i + 1).join('-');
                    fileName += `_pages_${pageNumbers}`;
                } else if (splitMethod === 'range') {
                    fileName += `_pages_${indices[0] + 1}-${indices[indices.length - 1] + 1}`;
                }
                
                const pdfFile = new File([pdfBlob], `${fileName}.pdf`, { type: 'application/pdf' });
                splitFiles.push(pdfFile);
            }
            
            return {
                files: splitFiles,
                totalPages: totalPages
            };
            
        } catch (error) {
            console.error('PDF split error:', error);
            throw error;
        }
    }

    // Get page count of a PDF
    async getPDFPageCount(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
            return pdf.getPageCount();
        } catch (error) {
            console.error('Error getting page count:', error);
            return 0;
        }
    }

    // Generate page thumbnails (simplified version)
    async generatePageThumbnails(file, container, maxThumbnails = 20) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
            const pageCount = pdf.getPageCount();
            
            // Clear container
            container.innerHTML = '';
            
            // Create thumbnail elements
            for (let i = 0; i < Math.min(pageCount, maxThumbnails); i++) {
                const thumb = document.createElement('div');
                thumb.className = 'page-thumbnail';
                thumb.dataset.page = i + 1;
                thumb.innerHTML = `
                    <div class="page-number">${i + 1}</div>
                    <div class="page-preview">Page ${i + 1}</div>
                `;
                
                // Add click handler for selection
                thumb.addEventListener('click', () => {
                    thumb.classList.toggle('selected');
                });
                
                container.appendChild(thumb);
            }
            
            if (pageCount > maxThumbnails) {
                const more = document.createElement('div');
                more.className = 'page-more';
                more.textContent = `+ ${pageCount - maxThumbnails} more pages`;
                container.appendChild(more);
            }
            
        } catch (error) {
            console.error('Error generating thumbnails:', error);
            container.innerHTML = '<div class="error">Could not generate thumbnails</div>';
        }
    }

    // Utility methods
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Create downloadable link
    createDownloadLink(blob, fileName) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Download multiple files as ZIP
    async downloadAsZip(files, zipName = 'download.zip') {
        if (typeof JSZip === 'undefined') {
            // Fallback to individual downloads if JSZip not available
            files.forEach(file => {
                this.createDownloadLink(file, file.name);
            });
            return;
        }
        
        try {
            const zip = new JSZip();
            
            // Add files to zip
            files.forEach((file, index) => {
                zip.file(file.name, file);
            });
            
            // Generate zip file
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            this.createDownloadLink(zipBlob, zipName);
            
        } catch (error) {
            console.error('Error creating ZIP:', error);
            // Fallback to individual downloads
            files.forEach(file => {
                this.createDownloadLink(file, file.name);
            });
        }
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
window.pdfTools = new PDFTools();