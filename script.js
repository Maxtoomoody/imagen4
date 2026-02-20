// --- 1. Element Selectors ---
const genBtn = document.getElementById('generate-btn');
const enhanceBtn = document.getElementById('enhance-btn');
const promptInput = document.getElementById('prompt');
const fileInput = document.getElementById('file-input');
const dropZone = document.getElementById('drop-zone');
const refPreview = document.getElementById('ref-preview');
const canvas = document.getElementById('canvas');
const controls = document.getElementById('controls');
const authStatus = document.getElementById('auth-status');

let uploadedImages = [];

// --- 2. Authentication UI Sync ---
// Regularly check if the user is signed in to update the status bar
function updateAuthUI() {
    if (puter.auth.isSignedIn()) {
        authStatus.innerText = "System Authenticated";
        authStatus.style.color = "#70f3f6";
    } else {
        authStatus.innerText = "Sign in to Generate";
        authStatus.style.color = "#64748b";
    }
}
setInterval(updateAuthUI, 2000);

// --- 3. Multi-Reference Upload Logic ---
dropZone.onclick = () => fileInput.click();

fileInput.onchange = (e) => {
    const files = Array.from(e.target.files).slice(0, 10); // Limit to 10 for stability
    uploadedImages = [];
    refPreview.innerHTML = '';

    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64Data = event.target.result.split(',')[1];
            uploadedImages.push({ data: base64Data, type: file.type });
            
            // Create thumbnail for the UI
            const img = document.createElement('img');
            img.src = event.target.result;
            img.className = "w-full aspect-square object-cover rounded-lg border border-slate-700 hover:border-[#70f3f6] transition-all";
            refPreview.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
};

// --- 4. AI Prompt Enhancer (Gemini 3 Flash) ---
enhanceBtn.onclick = async () => {
    // SECURITY FIX: Check if signed in before calling AI
    if (!puter.auth.isSignedIn()) {
        return puter.auth.signIn();
    }

    const rawText = promptInput.value.trim();
    if (!rawText && uploadedImages.length === 0) return alert("Enter a prompt or upload an image first.");

    enhanceBtn.disabled = true;
    enhanceBtn.innerText = "✨ ANALYZING VISION...";

    try {
        // Uses Gemini to rewrite the prompt based on text and the first reference image
        const response = await puter.ai.chat(
            `As a professional prompt engineer, rewrite this prompt for Imagen 4 to be cinematic and detailed: "${rawText}". Return ONLY the rewritten prompt.`, 
            { 
                model: 'gemini-3-flash-preview',
                image: uploadedImages.length > 0 ? uploadedImages[0].data : undefined 
            }
        );
        promptInput.value = response.message.content.trim();
        enhanceBtn.innerText = "✨ PROMPT ENHANCED";
    } catch (err) {
        console.error(err);
        enhanceBtn.innerText = "⚠️ ENHANCE FAILED";
    } finally {
        setTimeout(() => { enhanceBtn.disabled = false; enhanceBtn.innerText = "✨ Enhance Prompt"; }, 2000);
    }
};

// --- 5. Image Generation Logic (Imagen 4) ---
genBtn.addEventListener('click', async () => {
    // SECURITY FIX: Prevents 401 Unauthorized errors
    if (!puter.auth.isSignedIn()) {
        puter.auth.signIn();
        return;
    }

    const prompt = promptInput.value.trim();
    if (!prompt) return alert("Please enter a prompt!");

    // UI Feedback: Start loading
    genBtn.disabled = true;
    genBtn.innerText = "MATERIALIZING...";
    canvas.innerHTML = '<div class="w-full h-full animate-pulse bg-slate-800 flex items-center justify-center text-xs text-slate-500 uppercase tracking-widest">Generating Vision...</div>';
    controls.classList.add('hidden');

    try {
        const options = {
            provider: 'google',
            model: 'imagen-4.0-preview', // High-quality Imagen 4
            input_image: uploadedImages.length > 0 ? uploadedImages[0].data : undefined
        };

        const image = await puter.ai.txt2img(prompt, options);
        
        // Render result to canvas
        canvas.innerHTML = '';
        image.className = "w-full h-full object-cover animate-in fade-in duration-700";
        canvas.appendChild(image);
        controls.classList.remove('hidden');

    } catch (err) {
        console.error("Studio Error:", err);
        canvas.innerHTML = '<p class="text-red-400 p-4 text-center text-xs uppercase font-bold">Generation Failed. Sign in again or check credits.</p>';
    } finally {
        genBtn.disabled = false;
        genBtn.innerText = "Generate Vision";
    }
});

// --- 6. Download Feature ---
document.getElementById('download-btn').onclick = () => {
    const img = canvas.querySelector('img');
    if (!img) return;
    const link = document.createElement('a');
    link.href = img.src;
    link.download = `codestorm-vision-${Date.now()}.png`;
    link.click();
};
