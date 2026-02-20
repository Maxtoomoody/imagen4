const historyList = document.getElementById('history-list');
const downloadBtn = document.getElementById('download-btn');
const actionButtons = document.getElementById('action-buttons');

// 1. Function to Save to History
function addToHistory(imageSrc) {
    const history = JSON.parse(localStorage.getItem('studio_history') || '[]');
    history.unshift(imageSrc); // Add new to start
    localStorage.setItem('studio_history', JSON.stringify(history.slice(0, 10))); // Keep last 10
    renderHistory();
}

// 2. Function to Render History Thumbnails
function renderHistory() {
    const history = JSON.parse(localStorage.getItem('studio_history') || '[]');
    historyList.innerHTML = history.map(src => `
        <img src="${src}" class="w-full aspect-square object-cover rounded-lg border border-slate-700 cursor-pointer hover:border-[#70f3f6] transition-all" onclick="updateMainCanvas('${src}')">
    `).join('');
}

// 3. Update Canvas from History
window.updateMainCanvas = (src) => {
    canvas.innerHTML = `<img src="${src}" class="rounded-lg shadow-lg">`;
    setupDownload(src);
};

// 4. Download Logic
function setupDownload(src) {
    actionButtons.classList.remove('hidden');
    downloadBtn.onclick = () => {
        const link = document.createElement('a');
        link.href = src;
        link.download = `codestorm-${Date.now()}.png`; //
        link.click();
    };
}

// Update your existing Generate Button event listener
genBtn.addEventListener('click', async () => {
    // ... your existing code ...
    try {
        const imageElement = await puter.ai.txt2img(prompt, { model: modelSelect.value });
        const src = imageElement.src;

        canvas.innerHTML = '';
        canvas.appendChild(imageElement);
        
        addToHistory(src); // Save to sidebar
        setupDownload(src); // Enable download
    } catch (error) { /* ... */ }
    const uploadInput = document.getElementById('multi-upload');
const previewGrid = document.getElementById('preview-grid');
const dropZone = document.getElementById('drop-zone');
let referenceImages = [];

// Handle File Selection
dropZone.onclick = () => uploadInput.click();

uploadInput.onchange = async (e) => {
    const files = Array.from(e.target.files).slice(0, 16); // Limit to 16
    referenceImages = [];
    previewGrid.innerHTML = '';

    for (const file of files) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target.result.split(',')[1];
            referenceImages.push({
                data: base64,
                mime_type: file.type
            });
            
            // Add thumbnail to UI
            previewGrid.innerHTML += `<img src="${event.target.result}" class="w-full aspect-square object-cover rounded border border-slate-700">`;
        };
        reader.readAsDataURL(file);
    }
};

// Updated Generate Logic
genBtn.addEventListener('click', async () => {
    const prompt = promptInput.value;
    if (!prompt) return;

    try {
        const options = {
            model: "gemini-3-pro-image-preview", // Model that supports multiple references
            provider: "gemini",
            // For Puter.js multi-image, we pass them in the 'input_images' array
            input_images: referenceImages.map(img => img.data), 
            input_image_mime_types: referenceImages.map(img => img.mime_type)
        };

        const imageElement = await puter.ai.txt2img(prompt, options);
        canvas.innerHTML = '';
        canvas.appendChild(imageElement);
    } catch (err) {
        console.error(err);
    }
});

// Load history on startup
renderHistory();
