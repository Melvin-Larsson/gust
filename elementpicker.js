let pickElement = document.getElementById("pickElementButton");
let hoverId = "hover";
let lastelement;

pickElement.addEventListener("click", async() => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: setupListener, 
    });
    console.log("Something happened");

    function setupListener(){
        document.body.addEventListener('mousemove', e => {
            //Remove last overlay
            let currentOverlay = document.body.querySelector('#hover');
            if(currentOverlay){
                document.body.removeChild(currentOverlay);
            }
            //Add overlay
            let element = document.elementFromPoint(e.x, e.y);
            let boundingRect = element.getBoundingClientRect();
            let overlay = document.createElement("div");
            overlay.id = "hover";
            overlay.style.position = "absolute";
            overlay.style.top = boundingRect.y;
            overlay.style.left = boundingRect.x;
            overlay.style.width = boundingRect.width;
            overlay.style.height = boundingRect.height;
            overlay.style.backgroundColor = "rgba(72,159,240,0.5)";
            document.body.appendChild(overlay);
        });
    }
});
