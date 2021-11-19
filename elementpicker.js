let array = [];
let array2 = ["B1", "B2", "B3"];
array = array.concat(array2);
console.log(array);

let selectedElements = [];
const hoverClass = "hover";
const elementClass = "element";
//Add message listener
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse){
        if(request.subject === "getElements"){
            console.log("Sending response " + selectedElements.length);
            let values = [];
            selectedElements.forEach(element => {
                values.push({text: element.textContent, classList: element.classList, tag: element.tagName});
            });
            sendResponse({elements: values});
        }
    }
)

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
    newElements.forEach(element => {
        selectedElements.push(element);
    });

    //Put overlay above the similar elements
    newElements.forEach(element => {
        createOverlay(element, elementClass, "rgba(247, 250, 67, 0.5)");
    });
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
