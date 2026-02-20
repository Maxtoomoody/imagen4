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
});

// Load history on startup
renderHistory();
