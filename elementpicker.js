let pickElement = document.getElementById("pickElementButton");

pickElement.addEventListener("click", async() => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: setupListener, 
    });
    console.log("Something happened");

    function setupListener(){
        document.body.addEventListener('mousemove', e => {
            console.log(e.x + " " + e.y);
        });
    }
});
