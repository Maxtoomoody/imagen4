/**
 * CODESTORM AI STUDIO - script.js
 * Integrated with Puter.js & Imagen 4
 */

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

// --- 1. Fix for 401 Unauthorized: Sign-In Status ---
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

// --- 2. File Upload Handling ---
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
            img.className = "w-full aspect-square object-cover rounded-lg border border-slate-700 hover:border-[#70f3f6] transition-all";
            refPreview.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
};

// --- 3. Prompt Enhancer Logic ---
enhanceBtn.onclick = async () => {
    // Force sign-in to prevent 401 error
    if (!puter.auth.isSignedIn()) {
        return puter.auth.signIn();
    }

    const rawText = promptInput.value.trim();
    if (!rawText && uploadedImages.length === 0) return alert("Enter prompt or image first!");

    enhanceBtn.disabled = true;
    enhanceBtn.innerText = "✨ ANALYZING...";

    try {
        const response = await puter.ai.chat(
            `Rewrite this for high-end AI generation: "${rawText}". Use cinematic terms. Return ONLY the new prompt.`, 
            { 
                model: 'gemini-3-flash-preview',
                image: uploadedImages.length > 0 ? uploadedImages[0].data : undefined 
            }
        );
        promptInput.value = response.message.content.trim();
        enhanceBtn.innerText = "✨ PROMPT READY";
    } catch (err) {
        enhanceBtn.innerText = "⚠️ ERROR";
    } finally {
        setTimeout(() => { enhanceBtn.disabled = false; enhanceBtn.innerText = "✨ Enhance Prompt"; }, 2000);
    }
};

// --- 4. Main Generation Logic ---
genBtn.addEventListener('click', async () => {
    // MANDATORY: Prevents the 401 Unauthorized "stuck" state
    if (!puter.auth.isSignedIn()) {
        puter.auth.signIn();
        return;
    }

    const prompt = promptInput.value.trim();
    if (!prompt) return alert("System requires a prompt!");

    genBtn.disabled = true;
    genBtn.innerText = "MATERIALIZING...";
    canvas.innerHTML = '<div class="w-full h-full animate-pulse bg-slate-800/50 flex items-center justify-center text-xs text-slate-500 uppercase tracking-widest">Generating...</div>';

    try {
        const options = {
            provider: 'google',
            model: 'imagen-4.0-preview',
            input_image: uploadedImages.length > 0 ? uploadedImages[0].data : undefined
        };

        const image = await puter.ai.txt2img(prompt, options);
        canvas.innerHTML = '';
        image.className = "w-full h-full object-cover animate-in fade-in duration-700";
        canvas.appendChild(image);
        controls.classList.remove('hidden');

    } catch (err) {
        console.error("Studio Error:", err);
        canvas.innerHTML = '<p class="text-red-400 p-4 text-center text-xs font-bold uppercase">FAILED: Check Credits/Sign-in</p>';
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