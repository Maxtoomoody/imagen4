const genBtn = document.getElementById('generate-btn');
const promptInput = document.getElementById('prompt');
const fileInput = document.getElementById('file-input');
const dropZone = document.getElementById('drop-zone');
const refPreview = document.getElementById('ref-preview');
const canvas = document.getElementById('canvas');
const controls = document.getElementById('controls');

let uploadedImages = [];

// Handle File Uploads
dropZone.onclick = () => fileInput.click();

fileInput.onchange = async (e) => {
    const files = Array.from(e.target.files).slice(0, 14); // Limit to 14 for Gemini
    uploadedImages = [];
    refPreview.innerHTML = '';

    for (const file of files) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64Data = event.target.result.split(',')[1];
            uploadedImages.push({ data: base64Data, type: file.type });
            
            // Add thumbnail preview
            const img = document.createElement('img');
            img.src = event.target.result;
            img.className = "w-full aspect-square object-cover rounded-lg border border-slate-700";
            refPreview.appendChild(img);
        };
        reader.readAsDataURL(file);
    }
};

// Generate Logic
genBtn.addEventListener('click', async () => {
    const prompt = promptInput.value.trim();
    if (!prompt) return alert("Please enter a prompt!");

    // UI Feedback
    genBtn.disabled = true;
    genBtn.innerText = "GENERATING...";
    canvas.innerHTML = '<div class="animate-pulse text-slate-500">Materializing...</div>';

    try {
        // Use Gemini 3 for multi-reference support
        // Note: For multiple references, current Puter API supports one primary input_image
        const options = {
            provider: 'gemini',
            model: 'gemini-3-pro-image-preview',
            // If multiple images are provided, we use the first one as the primary reference
            input_image: uploadedImages.length > 0 ? uploadedImages[0].data : undefined,
            input_image_mime_type: uploadedImages.length > 0 ? uploadedImages[0].type : undefined
        };

        const image = await puter.ai.txt2img(prompt, options);
        
        canvas.innerHTML = '';
        image.className = "w-full h-full object-cover transition-all duration-700";
        canvas.appendChild(image);
        controls.classList.remove('hidden');

    } catch (err) {
        console.error("AI Error:", err);
        canvas.innerHTML = '<p class="text-red-400">Error generating vision. Try a different model.</p>';
    } finally {
        genBtn.disabled = false;
        genBtn.innerText = "GENERATE VISION";
    }
});

// Download Logic
document.getElementById('download-btn').onclick = () => {
    const img = canvas.querySelector('img');
    if (!img) return;
    const link = document.createElement('a');
    link.href = img.src;
    link.download = `codestorm-${Date.now()}.png`;
    link.click();
};
