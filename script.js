/**
 * CODESTORM AI STUDIO - script.js
 * Integrated with Puter.js and Imagen 4
 */

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
// Regularly check sign-in status to prevent "stuck" states
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

// --- 3. Reference Image Upload Logic ---
dropZone.onclick = () => fileInput.click();

fileInput.onchange = (e) => {
    // Limits selection to maintain performance
    const files = Array.from(e.target.files).slice(0, 10); 
    uploadedImages = [];
    refPreview.innerHTML = '';

    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
            // Converts to Base64 as required by Puter AI
            const base64Data = event.target.result.split(',')[1];
            uploadedImages.push({ data: base64Data, type: file.type });
            
            // Render UI Preview
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
    // SECURITY: Force login if session is missing to avoid 401
    if (!puter.auth.isSignedIn()) {
        return puter.auth.signIn();
    }

    const rawText = promptInput.value.trim();
    if (!rawText && uploadedImages.length === 0) return alert("Please provide a prompt or image first.");

    enhanceBtn.disabled = true;
    enhanceBtn.innerText = "✨ ANALYZING...";

    try {
        // Uses Gemini to rewrite the prompt with cinematic detail
        const response = await puter.ai.chat(
            `You are a high-end prompt engineer. Analyze the following request and images. 
            Create a detailed, cinematic image generation prompt optimized for Imagen 4. 
            Focus on studio lighting and high-end textures. Return ONLY the new prompt.
            User Input: ${rawText}`, 
            { 
                model: 'gemini-3-flash-preview',
                image: uploadedImages.length > 0 ? uploadedImages[0].data : undefined 
            }
        );

        promptInput.value = response.message.content.trim();
        enhanceBtn.innerText = "✨ PROMPT READY";
    } catch (err) {
        console.error("Enhancer Error:", err);
        enhanceBtn.innerText = "⚠️ ERROR";
    } finally {
        setTimeout(() => { 
            enhanceBtn.disabled = false; 
            enhanceBtn.innerText = "✨ Enhance Prompt"; 
        }, 2000);
    }
};

// --- 5. Image Generation Logic (Imagen 4) ---
genBtn.addEventListener('click', async () => {
    // CRITICAL: Check login status before triggering generation
    if (!puter.auth.isSignedIn()) {
        puter.auth.signIn();
        return;
    }

    const prompt = promptInput.value.trim();
    if (!prompt) return alert("System requires a prompt.");

    // UI Feedback: Start loading animation
    genBtn.disabled = true;
    genBtn.innerText = "MATERIALIZING...";
    canvas.innerHTML = '<div class="w-full h-full animate-pulse bg-slate-800/50 flex items-center justify-center text-[10px] text-slate-500 uppercase tracking-[0.2em]">Generating Vision...</div>';
    controls.classList.add('hidden');

    try {
        const options = {
            provider: 'google',
            model: 'imagen-4.0-preview', // High-fidelity Imagen 4
            // Pass the first image as the primary visual reference
            input_image: uploadedImages.length > 0 ? uploadedImages[0].data : undefined
        };

        const image = await puter.ai.txt2img(prompt, options);
        
        // Success: Clear loader and show result
        canvas.innerHTML = '';
        image.className = "w-full h-full object-cover animate-in fade-in duration-1000";
        canvas.appendChild(image);
        controls.classList.remove('hidden');

    } catch (err) {
        console.error("Studio Error:", err);
        // Error handling prevents the button from staying "stuck"
        canvas.innerHTML = '<p class="text-red-400 p-4 text-center text-[10px] uppercase font-bold tracking-widest">Generation Failed. Check Login/Credits.</p>';
        alert("Request failed. Ensure you are signed into Puter and have credits.");
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