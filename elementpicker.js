let selectors = [];
let clickedElements = [];
const hoverClass = "hover";
const elementClass = "element";
//Add mouse listeners
document.body.addEventListener('mousemove', mouseMoved);
document.body.addEventListener('click', mouseClicked);
function mouseMoved(e){
    removeOverlay(hoverClass);
    //Add overlay
    let element = document.elementFromPoint(e.x, e.y);
    createOverlay(element, hoverClass);
}
function mouseClicked(e){
    removeOverlay(hoverClass);
    let element = document.elementFromPoint(e.x, e.y);
    clickedElements.push(element);
    //Query for elements similar to the clicked
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
    let newElements = document.querySelectorAll(selector);
    selectors.push(selector);
    //Put overlay above the similar elements
    newElements.forEach(element => {
        createOverlay(element, elementClass, "rgba(247, 250, 67, 0.5)");
    });

    elementSelected();
}
function createOverlay(element, className, colorString = "rgba(72, 159, 240, 0.5)"){
    let boundingRect = element.getBoundingClientRect();
    let overlay = document.createElement("div");
    //Style
    overlay.className = className;
    overlay.style.position = "fixed";
    overlay.style.top = boundingRect.y + "px";
    overlay.style.left = boundingRect.x + "px";
    overlay.style.width = boundingRect.width + "px";
    overlay.style.height = boundingRect.height + "px";
    overlay.style.backgroundColor = colorString
    document.body.appendChild(overlay);
}
function removeOverlay(className){
    let currentOverlay = document.body.querySelector(`.${className}`);
    if(currentOverlay){
    document.body.removeChild(currentOverlay);
    }
}
function elementSelected(){
    //Detatch listeners
    document.body.removeEventListener('mousemove', mouseMoved);
    document.body.removeEventListener('click', mouseClicked);
}
//Add message listener
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse){
        //Return all elements
        if(request.subject === "getElements"){
            let selector = "";
            for(var i = 0; i < selectors.length; i++){
                selector += selectors[i];
                if(i < selectors.length - 1){
                    selector += ", ";
                }
            }
            let selectedElements = document.querySelectorAll(selector);
            sendResponse(createResponseElements(selectedElements));
        }
        //Return element
        else if(request.subject === "getClickedElements"){
            sendResponse(createResponseElements(clickedElements));
        }
    }
)
function createResponseElements(elements){
    let responseElements = [];
    elements.forEach(element => {
        responseElements.push({text: element.textContent, classList: element.classList, tag: element.tagName});
    });
    return {elements: responseElements};
}
