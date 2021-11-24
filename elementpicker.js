let callbackId = -1;
const hoverClass = "hover";
let elementClass = "";
function mouseMoved(e){
    removeOverlay(hoverClass);
    //Add overlay
    let element = document.elementFromPoint(e.x, e.y);
    createOverlay(element, hoverClass);
}
function mouseClicked(e){
    removeOverlay(hoverClass);
    let element = document.elementFromPoint(e.x, e.y);
    //Callback
    chrome.runtime.sendMessage({subject: "elementSelected", callbackId: callbackId, element: createResponseElement(element)});
    elementSelected();
}
function createOverlayFromSelector(selector, className, colorString = "rgba(72, 159, 240, 0.5)"){
    elements = document.body.querySelectorAll(selector);
    elements.forEach(element => {
        createOverlay(element, className, colorString);
    });
}

function createOverlay(element, className, colorString = "rgba(72, 159, 240, 0.5)"){
    let boundingRect = element.getBoundingClientRect();
    let overlay = document.createElement("div");
    //Style
    overlay.className = className;
    overlay.style.position = "absolute";
    overlay.style.top = boundingRect.top + window.pageYOffset + "px";
    overlay.style.left = boundingRect.left + window.pageXOffset + "px";
    overlay.style.width = boundingRect.width + "px";
    overlay.style.height = boundingRect.height + "px";
    overlay.style.backgroundColor = colorString
    document.body.appendChild(overlay);
}
/*function calculateOverlaySelector(element, parentRange){
    //Find parent tags
    var parentTags = "";
    var parentClasses = "";
    var parent = element;
    for(let i = 0; i < parentRange && parent.parentElement; i++){
        parent = parent.parentElement;
        parentClasses = "";
        parent.classList.forEach(parentClass => {
            parentClasses += "." + parentClass;
        });
        parentTags = parent.tagName.toLowerCase() + parentClasses + " " + parentTags;
    }
    var selector = "";
    for(let i = 0; i < element.classList.length; i++){
        selector += parentTags + element.tagName.toLowerCase + " " + element.classList[i];
        if(i < element.classList.length -1){
            selector += ", ";
        }
    }
    if(element.classList.length == 0){
        selector = parentTags + element.tagName.toLowerCase();
    }
    console.log("Selector " + selector);
    return selector;
}*/
function removeOverlay(className){
    let currentOverlays = document.body.querySelectorAll(`.${className}`);
    if(currentOverlays){
        currentOverlays.forEach(overlay => {
            document.body.removeChild(overlay);
        });
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
            let selectedElements = document.body.querySelectorAll(subject.selector);
            sendResponse(createResponseElements(selectedElements));
        }
        //Add overlay
        else if(request.subject == "addOverlay"){
            createOverlayFromSelector(request.selector, request);
        }
        //Remove overlay
        else if(request.subject == "removeOverlay"){
            removeOverlay(request.className);
        }
        //Select element
        if(request.subject == "selectElement"){
           callbackId = request.callbackId;
           elementClass = "element" + callbackId;
           removeOverlay(elementClass);
           document.body.addEventListener("click", mouseClicked);
           document.body.addEventListener("mousemove", mouseMoved);
        }

    }
)
function createResponseElements(elements){
    let responseElements = [];
    elements.forEach(element => {
        responseElements.push(createResponseElement(element));
    });
    return {elements: responseElements};
}
function createResponseElement(element){
    //Count parents
    let parentSelectors = [];
    let parent = element;
    while(parent.parentElement && parent != document.body){
        parent = parent.parentElement;
        parentSelectors.push(createSelectorString(parent));
    }
    return {text: element.textContent, selector: createSelectorString(element), tag: element.tagName, parentSelectors: parentSelectors};
}
function createSelectorString(element){
    let selector = element.tagName.toLowerCase();
    element.classList.forEach(elementClass => {
        selector += "." + elementClass;
    });
    return selector;
}
