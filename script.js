const genBtn = document.getElementById('generate-btn');
const promptInput = document.getElementById('prompt');
const canvas = document.getElementById('canvas');
const modelSelect = document.getElementById('model-select');
const placeholderText = document.getElementById('placeholder-text');

genBtn.addEventListener('click', async () => {
    const prompt = promptInput.value.trim();

    if (!prompt) {
        alert("Ya Mo, please enter a prompt first!");
        return;
    }

    // UI Feedback: Loading state
    genBtn.disabled = true;
    genBtn.innerText = "Generating...";
    placeholderText.style.display = 'none';
    canvas.innerHTML = '<div class="loading-pulse"></div>';

    try {
        // Calling Puter.js with Imagen 4
        const imageElement = await puter.ai.txt2img(prompt, {
            model: modelSelect.value,
        });

        // Clear canvas and add generated image
        canvas.innerHTML = '';
        imageElement.id = "generated-image";
        canvas.appendChild(imageElement);

    } catch (error) {
        console.error("Error:", error);
        canvas.innerHTML = `<p class="text-red-400 p-4 text-center">Failed to generate image. Please try again.</p>`;
    } finally {
        genBtn.disabled = false;
        genBtn.innerText = "Generate Magic";
    }
});