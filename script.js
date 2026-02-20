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

// --- 1. Authentication Monitoring ---
function updateAuthUI() {
    if (puter.auth.isSignedIn()) {
        authStatus.innerText = "System Authenticated";
        authStatus.classList.replace('text-slate-500', 'text-[#70f3f6]');
    } else {
        authStatus.innerText = "Sign in to Generate";
    }
}
setInterval(updateAuthUI, 2000);

// --- 2. Image Upload Handling ---
dropZone.onclick = () => fileInput.click();

fileInput.onchange = (e) => {
    const files = Array.from(e.target.files).slice(0, 10);
    uploadedImages = [];
    refPreview.innerHTML = '';

    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64Data = event.target.result.split(',')[1];
            uploadedImages.push({ data: base64Data, type: file.type });
            
            const img = document.createElement('img');
            img.src = event.target.result;
            img.className = "w-full aspect-square object-cover rounded-lg border border-slate-700";
            refPreview.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
};

// --- 3. Prompt Enhancer Logic ---
enhanceBtn.onclick = async () => {
    if (!puter.auth.isSignedIn()) return puter.auth.signIn(); // Fix for 401
    
    const rawText = promptInput.value.trim();
    enhanceBtn.disabled = true;
    enhanceBtn.innerText = "✨ ANALYZING...";

    try {
        const response = await puter.ai.chat(
            `You are an expert prompt engineer. Enhance this prompt for high-end AI image generation: "${rawText}". Return ONLY the new prompt.`, 
            { model: 'gemini-3-flash-preview' }
        );
        promptInput.value = response.message.content.trim();
        enhanceBtn.innerText = "✨ PROMPT ENHANCED";
    } catch (err) {
        alert("Enhancement failed. Check your connection.");
    } finally {
        setTimeout(() => { enhanceBtn.disabled = false; enhanceBtn.innerText = "✨ Enhance Prompt"; }, 2000);
    }
};

// --- 4. Generation Logic (Imagen 4) ---
genBtn.addEventListener('click', async () => {
    // Critical 401 Fix: Check login before request
    if (!puter.auth.isSignedIn()) {
        puter.auth.signIn();
        return;
    }

    const prompt = promptInput.value.trim();
    if (!prompt) return alert("Please enter a prompt!");

    genBtn.disabled = true;
    genBtn.innerText = "MATERIALIZING...";
    canvas.innerHTML = '<div class="w-full h-full shimmer"></div>';
    controls.classList.add('hidden');

    try {
        const options = {
            provider: 'google',
            model: 'imagen-4.0-preview', // Ensure exact model name
            input_image: uploadedImages.length > 0 ? uploadedImages[0].data : undefined
        };

        const image = await puter.ai.txt2img(prompt, options);
        
        canvas.innerHTML = '';
        image.className = "w-full h-full object-cover animate-in fade-in duration-700";
        canvas.appendChild(image);
        controls.classList.remove('hidden');

    } catch (err) {
        console.error("Studio Error:", err);
        canvas.innerHTML = '<p class="text-red-400 p-4 text-center text-xs uppercase font-bold">Generation Failed. Check Credits.</p>';
    } finally {
        genBtn.disabled = false;
        genBtn.innerText = "Generate Vision";
    }
});

// --- 5. Download ---
document.getElementById('download-btn').onclick = () => {
    const img = canvas.querySelector('img');
    const link = document.createElement('a');
    link.href = img.src;
    link.download = `codestorm-${Date.now()}.png`;
    link.click();
};
