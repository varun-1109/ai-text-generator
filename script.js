// Get references to DOM elements
const userInput = document.getElementById('user-input');
const promptMode = document.getElementById('prompt-mode');
const contentType = document.getElementById('content-type');
const customPromptInput = document.getElementById('custom-prompt-input');
const customPromptTextarea = document.getElementById('custom-prompt');
const dropdownPrompts = document.getElementById('dropdown-prompts');
const generateButton = document.getElementById('generate-button');
const regenerateButton = document.getElementById('regenerate-button');
const outputArea = document.getElementById('output-area');
const loadingIndicator = document.getElementById('loading-indicator');

// Store the last generated prompt and output for regeneration
let lastFullPrompt = ''; // Store the full prompt sent to the API
let lastOutput = '';

/**
 * Shows the loading indicator and disables buttons.
 */
function showLoading() {
    loadingIndicator.classList.remove('hidden');
    generateButton.disabled = true;
    regenerateButton.disabled = true;
    outputArea.textContent = ''; // Clear previous output
}

/**
 * Hides the loading indicator and enables buttons.
 */
function hideLoading() {
    loadingIndicator.classList.add('hidden');
    generateButton.disabled = false;
    // Only enable regenerate if there was a successful generation
    if (lastOutput) {
        regenerateButton.disabled = false;
    }
}

/**
 * Generates content using the Gemini API.
 * @param {string} text - The user's input text.
 * @param {string} selectedPrompt - The specific prompt text to use.
 */
async function generateContent(text, selectedPrompt) {
    showLoading(); // Show loading indicator

    // The full prompt sent to the AI will be the selectedPrompt combined with user text
    const fullPrompt = selectedPrompt.includes('{{text}}') ? selectedPrompt.replace('{{text}}', text) : `${selectedPrompt} "${text}"`;
    
    lastFullPrompt = fullPrompt; // Store the full prompt for regeneration

    try {
        // Gemini API call
        const chatHistory = [];
        chatHistory.push({ role: "user", parts: [{ text: fullPrompt }] });
        const payload = { contents: chatHistory };
        const apiKey = ""; // API key is provided by the environment
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            const textOutput = result.candidates[0].content.parts[0].text;
            outputArea.textContent = textOutput; // Display the AI output
            lastOutput = textOutput; // Store output for regeneration check
        } else {
            outputArea.textContent = 'Error: No valid response from AI. Please try again.';
            lastOutput = ''; // Clear last output on error
            console.error('Unexpected API response structure:', result);
        }
    } catch (error) {
        outputArea.textContent = 'Error: Could not connect to the AI service. Please check your network connection and try again.';
        lastOutput = ''; // Clear last output on error
        console.error('API call failed:', error);
    } finally {
        hideLoading(); // Hide loading indicator
    }
}

// Event listener for prompt mode change
promptMode.addEventListener('change', () => {
    if (promptMode.value === 'custom') {
        dropdownPrompts.classList.add('hidden');
        customPromptInput.classList.remove('hidden');
    } else {
        dropdownPrompts.classList.remove('hidden');
        customPromptInput.classList.add('hidden');
    }
});

// Event listener for the "Generate Output" button
generateButton.addEventListener('click', () => {
    const text = userInput.value.trim();
    if (!text) {
        outputArea.textContent = 'Please enter some text to generate output.';
        return;
    }

    let selectedPrompt = '';
    if (promptMode.value === 'custom') {
        selectedPrompt = customPromptTextarea.value.trim();
        if (!selectedPrompt) {
            outputArea.textContent = 'Please enter a custom prompt.';
            return;
        }
    } else { // dropdown mode
        // Get the text of the selected option
        selectedPrompt = contentType.options[contentType.selectedIndex].textContent;
    }
    
    generateContent(text, selectedPrompt);
});

// Event listener for the "Regenerate" button
regenerateButton.addEventListener('click', () => {
    if (lastFullPrompt) {
        const text = userInput.value.trim(); // Use current input text
        // Re-use the last full prompt stored
        generateContent(text, lastFullPrompt); 
    } else {
        outputArea.textContent = 'Nothing to regenerate. Please generate output first.';
    }
});

// Initial state: disable regenerate button
regenerateButton.disabled = true;