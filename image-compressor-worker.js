// Web Worker for image compression
// Runs image compression in background to avoid blocking UI

self.onmessage = async function(e) {
    const { imageData, maxWidth, maxHeight, quality, cropTo4x3 = true } = e.data;
    
    try {
        console.log('Worker: Starting image compression...');
        
        // Create ImageBitmap from the image data
        const imageBitmap = await createImageBitmap(imageData);
        
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = imageBitmap;
        const aspectRatio = width / height;
        
        // Scale down if image is larger than max dimensions
        if (width > maxWidth || height > maxHeight) {
            if (width / maxWidth > height / maxHeight) {
                // Width is the limiting factor
                width = maxWidth;
                height = width / aspectRatio;
            } else {
                // Height is the limiting factor
                height = maxHeight;
                width = height * aspectRatio;
            }
        }
        
        let finalWidth, finalHeight;
        let cropX = 0, cropY = 0;
        
        if (cropTo4x3) {
            // Crop to 4:3 aspect ratio (landscape)
            const targetAspectRatio = 4 / 3; // 4:3
            
            if (width / height > targetAspectRatio) {
                // Image is wider than 4:3, crop width
                finalHeight = height;
                finalWidth = height * targetAspectRatio;
                cropX = (width - finalWidth) / 2;
                cropY = 0;
            } else {
                // Image is taller than 4:3, crop height
                finalWidth = width;
                finalHeight = width / targetAspectRatio;
                cropX = 0;
                cropY = (height - finalHeight) / 2;
            }
            
            console.log(`Worker: Cropping to 4:3 format: ${Math.round(finalWidth)}x${Math.round(finalHeight)}`);
        } else {
            // No cropping, use resized dimensions
            finalWidth = Math.round(width);
            finalHeight = Math.round(height);
            console.log(`Worker: No cropping, using resized dimensions: ${finalWidth}x${finalHeight}`);
        }
        
        console.log(`Worker: Resizing from ${imageBitmap.width}x${imageBitmap.height} to ${Math.round(width)}x${Math.round(height)}`);
        
        const canvas = new OffscreenCanvas(finalWidth, finalHeight);
        const ctx = canvas.getContext('2d');
        
        if (cropTo4x3) {
            // Draw cropped image to 4:3 format
            ctx.drawImage(
                imageBitmap, 
                Math.round(cropX), Math.round(cropY), Math.round(finalWidth), Math.round(finalHeight), // source crop
                0, 0, finalWidth, finalHeight // destination
            );
        } else {
            // Draw resized image without cropping
            ctx.drawImage(
                imageBitmap,
                0, 0, imageBitmap.width, imageBitmap.height, // source
                0, 0, finalWidth, finalHeight // destination
            );
        }
        
        // Convert to WebP blob with specified quality
        const blob = await canvas.convertToBlob({
            type: 'image/webp',
            quality: quality
        });
        
        console.log(`Worker: Compression complete. Original size: ${imageData.size}, Compressed size: ${blob.size}, Compression ratio: ${(blob.size / imageData.size * 100).toFixed(1)}%`);
        
        // Send result back to main thread
        self.postMessage({
            success: true,
            blob: blob,
            originalSize: imageData.size,
            compressedSize: blob.size,
            compressionRatio: (blob.size / imageData.size * 100).toFixed(1)
        });
        
    } catch (error) {
        console.error('Worker: Compression failed:', error);
        self.postMessage({
            success: false,
            error: error.message
        });
    }
};
