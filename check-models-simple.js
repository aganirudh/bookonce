
const apiKey = "AIzaSyD2jN0GjWx-Tstv5lu1QUaDGiVMgB8nGl8";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

async function listModels() {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            const text = await response.text();
            console.error(text);
            return;
        }
        const data = await response.json();
        console.log("AVAILABLE MODELS:");
        data.models.forEach(m => console.log(m.name.replace('models/', '')));
    } catch (error) {
        console.error("Error fetching models:", error);
    }
}

listModels();
