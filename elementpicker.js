let pickElement = document.getElementById("pickElementButton");
let hoverId = "hover";
let lastelement;

pickElement.addEventListener("click", async() => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: setupListener, 
    });

});
function setupListener(){
    //Mouse move listener
    document.body.addEventListener('mousemove', e => {
        //Remove last overlay
        clearOverlay();
        //Add overlay
        let element = document.elementFromPoint(e.x, e.y);
        let boundingRect = element.getBoundingClientRect();
        let overlay = document.createElement("div");
        //Style
        overlay.id = "hover";
        overlay.style.position = "absolute";
        overlay.style.top = boundingRect.y;
        overlay.style.left = boundingRect.x;
        overlay.style.width = boundingRect.width;
        overlay.style.height = boundingRect.height;
        overlay.style.backgroundColor = "rgba(72,159,240,0.5)";
        document.body.appendChild(overlay);
    });
    //Mouse pressed listener
    document.body.addEventListener('click', e =>{
        //Remove last overlay
        clearOverlay();
        let element = document.elementFromPoint(e.x, e.y);
        let tag = element.tagName.toLowerCase();
        let classList = element.classList;
        let selector = "";
        if(classList.length > 0){
            classList.forEach(c => {
                selector += tag + "." + c;
            });
        }else{
            selector = tag;
        }
        let selectedElements = document.querySelectorAll(selector);
        console.log(selectedElements);
    });
    //Removes the last overlay
    function clearOverlay(){
        let currentOverlay = document.body.querySelector('#hover');
        if(currentOverlay){
            document.body.removeChild(currentOverlay);
        }
    }
}
