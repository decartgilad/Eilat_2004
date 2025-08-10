document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const previewSection = document.getElementById('previewSection');
    const previewImage = document.getElementById('previewImage');
    // Prompt display elements removed
    
    let selectedFile = null;
    let lastGeneratedPrompt = null; // Store the last prompt for "try again" functionality
    let lastCompressedImage = null; // Store the last compressed image for "try again" functionality
    
    // Image compression function using Web Worker
    function compressImage(file, maxWidth = 1024, maxHeight = 1024, quality = 0.75) {
        return new Promise((resolve, reject) => {
            console.log('Starting image compression...');
            
            // Create Web Worker
            const worker = new Worker('image-compressor-worker.js');
            
            worker.onmessage = function(e) {
                const { success, blob, error, originalSize, compressedSize, compressionRatio } = e.data;
                
                if (success) {
                    console.log(`Image compressed successfully: ${originalSize} → ${compressedSize} bytes (${compressionRatio}%)`);
                    resolve(blob);
                } else {
                    console.error('Image compression failed:', error);
                    reject(new Error(error));
                }
                
                // Clean up worker
                worker.terminate();
            };
            
            worker.onerror = function(error) {
                console.error('Worker error:', error);
                reject(error);
                worker.terminate();
            };
            
            // Send image file to worker
            worker.postMessage({
                imageData: file,
                maxWidth: maxWidth,
                maxHeight: maxHeight,
                quality: quality
            });
        });
    }
    
    // API Configuration - Using FAL AI Vision LLM
    const FAL_VISION_API_KEY = '7fd1bb10-a549-49b4-9e6e-8c8e788bfc87:73e5186164ab6856ad6eaad1fa79b426';
    const FAL_VISION_URL = 'https://fal.run/fal-ai/any-llm/vision';
    
    // FAL AI Configuration
    const FAL_API_KEY = '7fd1bb10-a549-49b4-9e6e-8c8e788bfc87:73e5186164ab6856ad6eaad1fa79b426';
    const FAL_IMAGE_URL = 'https://fal.run/fal-ai/flux-lora/image-to-image';
    
    // Classic 2004 loading message with animated GIF
    function showLoadingMessage(message = 'מעבד תמונה... חכה רגע...') {
        // Remove any existing loading messages first
        const existingLoading = document.querySelectorAll('.loading');
        existingLoading.forEach(loading => {
            const container = loading.parentNode;
            if (container && container.className === 'message-container') {
                container.remove();
            } else {
                loading.remove();
            }
        });
        
        // Create loading message with animated GIF above text
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'success-message loading';
        loadingDiv.innerHTML = `
            <div style="text-align: center;">
                <img src="Assets/ajax-loader-small.gif" alt="טוען..." style="display: block; margin: 0 auto; margin-bottom: 15px;">
                <br>
                ${message}
            </div>
        `;
        
        // Add loading message below the image preview area (same as showMessage)
        const previewSection = document.getElementById('previewSection');
        const uploadArea = document.getElementById('uploadArea');
        
        const messageContainer = document.createElement('div');
        messageContainer.style.width = '100%';
        messageContainer.style.margin = '10px 0';
        messageContainer.style.textAlign = 'center';
        messageContainer.className = 'message-container';
        messageContainer.appendChild(loadingDiv);
        
        // Insert after the preview section or upload area
        if (previewSection && previewSection.style.display !== 'none') {
            previewSection.parentNode.insertBefore(messageContainer, previewSection.nextSibling);
        } else if (uploadArea) {
            uploadArea.parentNode.insertBefore(messageContainer, uploadArea.nextSibling);
        } else {
            document.body.appendChild(messageContainer);
        }
        
        return loadingDiv;
    }
    
    // Drag and Drop functionality
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    // Add drag & drop to preview section (when image is already loaded)
    function addDragDropToPreview() {
        const previewSection = document.getElementById('previewSection');
        if (!previewSection) return;

        previewSection.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            previewSection.style.backgroundColor = '#F0F0F0';
        });

        previewSection.addEventListener('dragleave', function(e) {
            e.preventDefault();
            e.stopPropagation();
            previewSection.style.backgroundColor = '';
        });

        previewSection.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            previewSection.style.backgroundColor = '';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                console.log('Dropping new image to replace existing one');
                handleFile(files[0]); // This will replace the current image
            }
        });
    }

    // Add click to upload functionality to the preview image
    function addClickToUpload() {
        const previewImage = document.getElementById('previewImage');
        if (!previewImage) return;

        // Remove existing click handler to avoid duplicates
        previewImage.removeEventListener('click', handleImageClick);
        
        // Add click handler
        previewImage.addEventListener('click', handleImageClick);
        
        // Add visual cue that image is clickable
        previewImage.style.cursor = 'pointer';
        previewImage.title = 'לחץ כדי להעלות תמונה חדשה';
    }

    function handleImageClick() {
        console.log('Image clicked - opening file dialog');
        fileInput.click();
    }
    
    // Click to upload
    uploadArea.addEventListener('click', function() {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });
    
    // File handling with 2004 style messages
    function handleFile(file) {
        console.log('handleFile called with file:', file.name, file.type, file.size);
        
        // Check if it's an image
        if (!file.type.startsWith('image/')) {
            showMessage('שגיאה: אנא בחר קובץ תמונה בלבד!', 'error');
            return;
        }
        
        // No file size limit - removed for better user experience
        
        selectedFile = file;
        
        // Create preview with 2004 style
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImage.src = e.target.result;
            previewSection.style.display = 'block';
            uploadArea.style.display = 'none';
            
            // Prompt display elements removed
            
            // Add drag & drop and click functionality to preview section
            addDragDropToPreview();
            addClickToUpload();
            
            // Show loading immediately with GIF
            const settings = getCurrentSettings();
            let loadingMessage = 'מתחיל לנתח את התמונה... (התמונה תיחתך ליחס 4:3)';
            
            showLoadingMessage(loadingMessage);
            
            // Start processing after a brief moment
            setTimeout(() => {
                console.log('About to start processing image...');
                // Auto-process the image immediately
                setTimeout(() => {
                    console.log('Starting processImage function...');
                    processImage(selectedFile);
                }, 1000);
            }, 1500); // Show upload success, then processing message
        };
        reader.readAsDataURL(file);
    }
    
    // Auto-processing enabled - no manual button needed
    
    // Process image function - Send to LLM to generate prompt
    function processImage(file) {
        console.log('processImage called with file:', file);
        
        // Show processing status
        const loadingDiv = showLoadingMessage('דוחס תמונה...');
        
        // Get current settings
        const settings = getCurrentSettings();
        console.log('Current settings:', settings);
        
        // Always use regular prompt (extreme mode temporarily disabled)
        const promptToUse = settings.promptReg;
        
        console.log('Using prompt mode: Regular (extreme mode disabled)');
        console.log('Prompt length:', promptToUse.length);
        
        // Return a Promise
        return new Promise(async (resolve, reject) => {
            try {
                // First compress the image using settings
                console.log('Compressing image before analysis...');
                const maxWidth = parseInt(settings.maxWidth) || 1024;
                const maxHeight = parseInt(settings.maxHeight) || 1024;
                const quality = parseFloat(settings.compressionQuality) || 0.75;
        
                const compressedBlob = await compressImage(file, maxWidth, maxHeight, quality);
                
                // Store compressed image for "try again" functionality
                lastCompressedImage = compressedBlob;
                
                            // Show compression success message
            showMessage('התמונה נדחסה ונחתכה בהצלחה ליחס 4:3!', 'success');
                
                // Update loading message
                const container = loadingDiv.parentNode;
                if (container && container.className === 'message-container') {
                    container.remove();
                }
                
                // Show appropriate message based on cropping setting
                showLoadingMessage('מנתח את התמונה... (התמונה נחתכה ליחס 4:3)');
                
                // Convert compressed blob to base64
                const reader = new FileReader();
                reader.onload = function(e) {
                    const base64Image = e.target.result;
                    // Remove the data:image/type;base64, prefix if it exists
                    const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
                    
                    // Prepare request data for FAL AI Vision
                    const visionRequestData = {
                        prompt: "Please analyze this image and describe it according to the style guidelines above. If the image doesn't match the 2000s Israeli youth aesthetic, describe what changes would be needed to make it fit that style.",
                        system_prompt: promptToUse,
                        model: "google/gemini-flash-1.5",
                        image_url: base64Image
                    };
                    
                    // Send to FAL AI Vision
                    console.log('Sending request to FAL AI Vision with model:', visionRequestData.model);
                    console.log('System prompt length:', promptToUse.length);
                    console.log('Image data length:', base64Image.length);
                    console.log('FAL Vision URL:', FAL_VISION_URL);
                    console.log('API Key (first 10 chars):', FAL_VISION_API_KEY.substring(0, 10) + '...');
                    
                    fetch(FAL_VISION_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Key ${FAL_VISION_API_KEY}`
                        },
                        body: JSON.stringify(visionRequestData)
                    })
                    .then(response => {
                        console.log('Response status:', response.status);
                        console.log('Response headers:', response.headers);
                        
                        if (!response.ok) {
                            // Log more details about the error
                            return response.text().then(errorText => {
                                console.error('Error response body:', errorText);
                                throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
                            });
                        }
                        return response.json();
                    })
                    .then(data => {
                        // Remove loading message properly
                        const container = loadingDiv.parentNode;
                        if (container && container.className === 'message-container') {
                            container.remove();
                        } else {
                            loadingDiv.remove();
                        }
                        
                        console.log('FAL AI Vision Response full:', data);
                        
                        // Check if we have a valid response from FAL AI Vision
                        if (!data.output) {
                            console.error('Invalid response structure:', data);
                            showMessage('שגיאה: תגובה לא תקינה מ-FAL AI Vision', 'error');
                            reject(new Error('Invalid response structure'));
                            return;
                        }
                        
                        // Extract the generated prompt from FAL AI Vision response
                        const generatedPrompt = data.output;
                        
                        // Store the prompt for "try again" functionality
                        lastGeneratedPrompt = generatedPrompt;
                        
                        console.log('Generated Prompt:', generatedPrompt);
                        
                        // Prompt generated successfully (display elements removed from UI)
                        console.log('Prompt generated successfully:', generatedPrompt);
                        
                                        let successMessage = 'פרומפט נוצר בהצלחה! עכשיו מייצר תמונה חדשה...';
                        
                        showMessage(successMessage, 'success');
                        
                        // Auto-send to FAL AI for image generation with compressed image
                        setTimeout(() => {
                            showMessage('שולח תמונה לעיבוד...', 'success');
                            generateImageWithFAL(generatedPrompt, compressedBlob);
                        }, 1500);
                        
                        resolve(data);
                    })
                    .catch(error => {
                        // Remove loading message properly
                        const container = loadingDiv.parentNode;
                        if (container && container.className === 'message-container') {
                            container.remove();
                        } else {
                            loadingDiv.remove();
                        }
                        console.error('Error:', error);
                        showMessage('שגיאה בעיבוד התמונה: ' + error.message, 'error');
                        reject(error);
                    });
                };
                
                reader.readAsDataURL(compressedBlob);
                
            } catch (error) {
                console.error('Error compressing image:', error);
                // Remove loading message
                const container = loadingDiv.parentNode;
                if (container && container.className === 'message-container') {
                    container.remove();
                } else {
                    loadingDiv.remove();
                }
                showMessage('שגיאה בדחיסת התמונה: ' + error.message, 'error');
                reject(error);
            }
        });
    }
    
    // Generate image with FAL AI (image-to-image)
    function generateImageWithFAL(prompt, compressedImageBlob) {
        console.log('generateImageWithFAL called with prompt:', prompt);
        
        const settings = getCurrentSettings();
        
        let loadingMessage = 'יוצר תמונה חדשה... חכה רגע...';
        
        const loadingDiv = showLoadingMessage(loadingMessage);
        
        // Get original image dimensions from the compressed blob
        const img = new Image();
        
        img.onload = function() {
            const originalWidth = img.naturalWidth;
            const originalHeight = img.naturalHeight;
            
            console.log('Original image dimensions:', originalWidth, 'x', originalHeight);
            
            // Show message about image dimensions
            if (cropTo4x3) {
                // Removed the message about image dimensions
            } else {
                showMessage(`מידות התמונה: ${originalWidth}x${originalHeight}`, 'info');
            }
            
            // Convert compressed blob to base64 for image-to-image
            const reader = new FileReader();
            reader.onload = function(e) {
                const base64Image = e.target.result;
                
                // Prepare FAL AI request for image-to-image
                const falRequestData = {
                    prompt: prompt,
                    image_url: base64Image,
                    loras: [{
                        path: settings.loraPath || "https://v3.fal.media/files/tiger/KEjPSZ5h8C3_BIvelf1ZJ_pytorch_lora_weights.safetensors",
                        scale: parseFloat(settings.scale) || 1.0
                    }],
                    num_inference_steps: parseInt(settings.inferenceSteps) || 20,
                    guidance_scale: parseFloat(settings.guidanceScale) || 7.5,
                    strength: parseFloat(settings.strength) || 0.7,
                    seed: Math.floor(Math.random() * 1000000),
                    image_size: {
                        width: originalWidth,
                        height: originalHeight
                    }
                };
            
                console.log('Sending request to FAL AI:', falRequestData);
                console.log('FAL Image URL:', FAL_IMAGE_URL);
                console.log('API Key (first 10 chars):', FAL_API_KEY.substring(0, 10) + '...');
                
                // Show message about image format being sent
                showMessage(`שולח תמונה לעיבוד... (${originalWidth}x${originalHeight})`, 'info');
                showMessage(`שולח תמונה במידות: ${originalWidth}x${originalHeight}`, 'info');
                
                // Send to FAL AI
                fetch(FAL_IMAGE_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Key ${FAL_API_KEY}`
                    },
                    body: JSON.stringify(falRequestData)
                })
                .then(response => {
                    console.log('FAL AI Response status:', response.status);
                    
                    if (!response.ok) {
                        throw new Error(`FAL AI HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    // Remove loading message properly
                    const container = loadingDiv.parentNode;
                    if (container && container.className === 'message-container') {
                        container.remove();
                    } else {
                        loadingDiv.remove();
                    }
                    
                    console.log('FAL AI Response:', data);
                    console.log('Response structure:', JSON.stringify(data, null, 2));
                    
                    // Display the generated image
                    if (data.images && data.images[0] && data.images[0].url) {
                        console.log('Image URL found:', data.images[0].url);
                        displayGeneratedImage(data.images[0].url);
                        
                        let successMessage = `תמונה חדשה נוצרה בהצלחה! (נשלחה ביחס 4:3, ${originalWidth}x${originalHeight})`;
                        
                        showMessage(successMessage, 'success');
                    } else {
                        console.error('No image URL in FAL AI response:', data);
                        console.error('Response keys:', Object.keys(data));
                        if (data.images) {
                            console.error('Images array:', data.images);
                        }
                        showMessage('שגיאה: לא התקבלה תמונה מהמערכת', 'error');
                    }
                })
                .catch(error => {
                    // Remove loading message properly
                    const container = loadingDiv.parentNode;
                    if (container && container.className === 'message-container') {
                        container.remove();
                    } else {
                        loadingDiv.remove();
                    }
                    console.error('FAL AI Error:', error);
                    showMessage('שגיאה ביצירת התמונה: ' + error.message, 'error');
                });
            };
            
            reader.readAsDataURL(compressedImageBlob);
        };
        
        // Create object URL from blob to get dimensions
        const objectUrl = URL.createObjectURL(compressedImageBlob);
        img.src = objectUrl;
        
        // Clean up object URL after loading
        img.addEventListener('load', function() {
            URL.revokeObjectURL(objectUrl);
        });
    }
    
    // Display the generated image
    function displayGeneratedImage(imageUrl) {
        console.log('Displaying generated image:', imageUrl);
        
        // Create or update the generated image section
        let generatedSection = document.getElementById('generatedSection');
        if (!generatedSection) {
            generatedSection = document.createElement('div');
            generatedSection.id = 'generatedSection';
            generatedSection.innerHTML = `
                <table width="100%" border="1" cellpadding="15" cellspacing="0" bgcolor="#FFFFFF">
                    <tr>
                        <td align="center">
                            <font face="SHIMARG, Arial" size="2" color="#000000">
                                <b>תמונה שנוצרה:</b>
                            </font>
                            <br><br>
                            <img id="generatedImage" border="1" style="max-width: 100%; max-height: 400px; object-fit: contain;">
                            <br><br>
                            <input type="button" id="tryAgainButton" value="נסה שוב" 
                                   style="background-color: #048ABF; color: white; border: 2px outset #048ABF; padding: 8px 16px; font-family: SHIMARG, Arial; font-size: 14px; cursor: pointer;">
                        </td>
                    </tr>
                </table>
            `;
            
            // Add after the preview section
            const previewSection = document.getElementById('previewSection');
            previewSection.parentNode.insertBefore(generatedSection, previewSection.nextSibling);
        }
        
        // Set the image source
        const generatedImage = document.getElementById('generatedImage');
        generatedImage.src = imageUrl;
        generatedImage.alt = 'תמונה שנוצרה';
        
        // Add event listener to "Try Again" button
        const tryAgainButton = document.getElementById('tryAgainButton');
        if (tryAgainButton && lastGeneratedPrompt && lastCompressedImage) {
            // Remove any existing event listeners
            tryAgainButton.replaceWith(tryAgainButton.cloneNode(true));
            const newTryAgainButton = document.getElementById('tryAgainButton');
            
            newTryAgainButton.addEventListener('click', function() {
                console.log('Try again button clicked, regenerating with prompt:', lastGeneratedPrompt);
                generateImageWithFAL(lastGeneratedPrompt, lastCompressedImage);
            });
        }
        
        generatedSection.style.display = 'block';
    }
    
    // Message display function with 2004 style
    function showMessage(message, type) {
        console.log('showMessage called:', message, type);
        
        // Remove existing messages (but only the message div, not containers)
        const existingMessages = document.querySelectorAll('.error-message, .success-message');
        existingMessages.forEach(msg => {
            if (!msg.classList.contains('loading')) {
                // Remove the entire container if it exists
                const container = msg.parentNode;
                if (container && container.style && container.style.margin === '15px 0') {
                    container.remove();
                } else {
                    msg.remove();
                }
            }
        });
        
        // Create new message with 2004 style
        const messageDiv = document.createElement('div');
        messageDiv.className = type === 'error' ? 'error-message' : 'success-message';
        messageDiv.innerHTML = message;
        
        // Add message below the image preview area
        const previewSection = document.getElementById('previewSection');
        const uploadArea = document.getElementById('uploadArea');
        
        // Create a simple message container without background
        const messageContainer = document.createElement('div');
        messageContainer.style.width = '100%';
        messageContainer.style.margin = '10px 0';
        messageContainer.style.textAlign = 'center';
        messageContainer.className = 'message-container';
        messageContainer.appendChild(messageDiv);
        
        // Insert after the preview section or upload area
        if (previewSection && previewSection.style.display !== 'none') {
            // Insert after preview section
            previewSection.parentNode.insertBefore(messageContainer, previewSection.nextSibling);
        } else if (uploadArea) {
            // Insert after upload area
            uploadArea.parentNode.insertBefore(messageContainer, uploadArea.nextSibling);
        } else {
            // Fallback to body
            document.body.appendChild(messageContainer);
        }
        
        // Auto remove after 5 seconds (classic 2004 style)
        setTimeout(() => {
            if (messageDiv.parentNode) {
                const container = messageDiv.parentNode;
                if (container && container.className === 'message-container') {
                    container.remove();
                } else {
                    messageDiv.remove();
                }
            }
        }, 5000);
    }
    
    // Get current settings from admin panel
    function getCurrentSettings() {
        const savedSettings = localStorage.getItem('eilat2004_settings');
        if (savedSettings) {
            return JSON.parse(savedSettings);
        }
        
        // Default settings if none saved
        return {
            loraPath: 'https://v3.fal.media/files/tiger/KEjPSZ5h8C3_BIvelf1ZJ_pytorch_lora_weights.safetensors',
            promptReg: 'You are an AI specialized in describing, conceptualizing, and generating prompts that match a specific visual style: early-to-mid 2000s Israeli youth snapshots. Always maintain this aesthetic unless explicitly told otherwise.\n\nCore style rules:\n1. Aesthetic Summary: Early/mid-2000s candid hotel, balcony, pool, and street scenes. Direct harsh on-camera flash, warm saturated colors, Mediterranean youth culture, slightly kitschy and spontaneous.\n\n2. Age Specification: Based on the subject\'s appearance, clothing, and environment, estimate their age range and explicitly mention it in the description (e.g., "appears to be around 17–19 years old").\n\n3. What to Emphasize:\n   - Direct flash with hard shadows.\n   - 4:3 aspect ratio, eye-level or slight dutch angle.\n   - Simple hotel rooms, balconies with metal railings, pools with palm trees.\n   - Hairstyles: buzzcuts, spiked gel, bleached streaks.\n   - Clothing: tank tops, graphic tees, sporty polos; for women – bikinis, colorful tops.\n   - Accessories: oversized sunglasses, earrings, watches, necklaces.\n   - Gestures like peace signs, holding drinks/snacks.\n   - Groups of 2–6 in relaxed, unposed arrangements.\n\n4. What to Avoid:\n   - Soft cinematic/studio lighting.\n   - Modern props/technology like smartphones.\n   - Extreme shallow depth-of-field.\n   - Overly modern or cyberpunk grading.\n   - Minimalist sterile compositions.\n\n5. Lighting & Color:\n   - Warm white balance, slightly orange/pink skin tones.\n   - High contrast and moderate-high saturation.\n   - Slight highlight clipping and lifted blacks.\n\n6. Camera Look – DV Style:\n   - Captured with early/mid-2000s DV camcorder (e.g., Sony Handycam).\n   - Slight video noise, interlaced scanlines, and light motion blur even in still frame.\n   - Slight chromatic aberration and color bleeding around edges.\n   - Focal length equiv: 28–50mm, aperture f/2.8–4.0, ISO 200–400.\n   - 4:3 aspect ratio, often with slight tilt or imperfect framing.\n\n7. Composition:\n   - Half-body or chest-up portraits.\n   - Tight group crops, bold casual cuts.\n   - Slight tilt for dynamism.\n\n8. Output Behavior:\n   - Always integrate these style elements.\n   - Always mention the estimated age of the subject(s).\n   - Always specify that it was captured on a DV camcorder.\n   - Avoid drifting into unrelated aesthetics unless explicitly requested.',
            promptExtreme: 'הכנס כאן את הטקסט הקיצוני שלך',
            scale: '1.0',
            inferenceSteps: '20',
            guidanceScale: '7.5',
            strength: '0.7',
            cropTo4x3: 'true', // Default to true for new users
            maxWidth: '1024',
            maxHeight: '1024',
            compressionQuality: '0.75'
        };
    }
    
    // Classic 2004 reset functionality
    function resetUpload() {
        selectedFile = null;
        previewSection.style.display = 'none';
        uploadArea.style.display = 'block';
        fileInput.value = '';
        
        // Prompt display elements removed
        
        // Hide generated image section
        const generatedSection = document.getElementById('generatedSection');
        if (generatedSection) {
            generatedSection.style.display = 'none';
        }
        
        // Auto-processing mode - no button to show
        
        // Remove any messages
        const messages = document.querySelectorAll('.error-message, .success-message');
        messages.forEach(msg => msg.remove());
    }
    
    // Classic 2004 navigation links (for future use)
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        // Only prevent default for links that don't have real pages
        const href = link.getAttribute('href');
        if (href === '#' || href === '' || !href) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                showMessage('דף זה בבנייה...', 'error');
            });
        }
        // All .html files are now real pages, so let them work normally
    });
    
    // Classic 2004 page load effect - disabled
}); 