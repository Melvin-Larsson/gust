let selectors = [];
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
    //Send elements
    console.log("Sending response " + selectors.length);
    let selector = "";
    for(var i = 0; i < selectors.length; i++){
        selector += selectors[i];
        if(i < selectors.length - 1){
            selector += ", ";
        }
    }
    let selectedElements = document.querySelectorAll(selector);
    let values = [];
    selectedElements.forEach(element => {
        values.push({text: element.textContent, classList: element.classList, tag: element.tagName});
    });
    chrome.runtime.sendMessage({subject: "elementSelected", elements: values});
}
