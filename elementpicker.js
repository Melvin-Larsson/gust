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
        removeOverlay("hover");
        //Add overlay
        let element = document.elementFromPoint(e.x, e.y);
        createOverlay(element, "hover");
    });
    //Mouse pressed listener
    document.body.addEventListener('click', e =>{
        //Remove last overlay
        removeOverlay("hover");
        //Query for elements similar to the clicked
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
        //Put overlay above the similar elements
        selectedElements.forEach(element => {
            createOverlay(element, "element", "rgba(247, 250, 67, 0.5)");
        });
    });
    //Removes the last overlay
    function removeOverlay(className){
        let currentOverlay = document.body.querySelector(`.${className}`);
        if(currentOverlay){
            document.body.removeChild(currentOverlay);
        }
    }
    function createOverlay(element, className, colorString = "rgba(72, 159, 240, 0.5)"){
        let boundingRect = element.getBoundingClientRect();
        let overlay = document.createElement("div");
        //Style
        overlay.className = className;
        overlay.style.position = "absolute";
        overlay.style.top = boundingRect.y;
        overlay.style.left = boundingRect.x;
        overlay.style.width = boundingRect.width;
        overlay.style.height = boundingRect.height;
        overlay.style.backgroundColor = colorString;
        document.body.appendChild(overlay);
    }
}
