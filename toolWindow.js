//Somehow adds toolWindow to page
console.log(chrome.runtime.getURL('/toolWindow.html'))
fetch(chrome.runtime.getURL('/toolWindow.html')).then(r => r.text()).then(html => {
    document.body.insertAdjacentHTML('beforeend', html);
    setUpWindow();
});
var toolWindow;
function setUpWindow(){
    var offset = {x: 0, y: 0};
    toolWindow = document.querySelector('.gustWindow');
    var toolWindowHeader = toolWindow.querySelector('header');
    toolWindowHeader.onmousedown = dragMouseDown;

    //let pickElement = document.getElementById("pickElementButton");
    let exportButton = document.getElementById("exportButton");
    //let resultContainer = document.getElementById("resultContainer");
    //let elementParentRange = document.getElementById("elementParentRange");
    //let elementParentRangeLabel = document.getElementById("elementParentRangeLabel");
    let picker1 = new ElementPicker("1", document.getElementById("pickElement"), createOverlayFromSelector, selectElement);
    let picker2 = new ElementPicker("2", document.getElementById("pickElement"), createOverlayFromSelector, selectElement);

}
function dragMouseDown(e){
  var rect = toolWindow.getBoundingClientRect();
  offset.x = e.x - rect.x;
  offset.y = e.y - rect.y;
  document.onmouseup = closeDragElement;
  document.onmousemove = elementDrag;
}
function elementDrag(e){
  toolWindow.style.left = e.x - offset.x + "px";
  toolWindow.style.top = e.y - offset.y + "px";
}
function closeDragElement(){
  document.onmouseup = null;
  document.onmousemove = null;
}
class ElementPicker{
    constructor(id, parent, elementSetListener, elementSetter){
        this.id = id;
        this.elementSetListener = elementSetListener;
        this.elementSetter = elementSetter;
        //Create elementpicker
        //Container
        let container = document.createElement("div");
        parent.appendChild(container);
        //Pick element button
        let pickElementButton = document.createElement("button");
        pickElementButton.innerText = "Pick an element";
        pickElementButton.addEventListener("click", e =>{
          this.elementSetter("element" + this.id, this.setElement.bind(this));
        });
        container.appendChild(pickElementButton);
        //Range label
        let rangeId = "range" + id;
        let rangeLabel = document.createElement("label");
        rangeLabel.htmlFor = rangeId;
        rangeLabel.innerText = 0;
        container.appendChild(rangeLabel);
        //Range
        let range = document.createElement("input");
        range.id = rangeId;
        range.type = "range";
        range.min = 0;
        range.max = 10;
        range.value = 1;
        range.addEventListener('input', function(){
            rangeLabel.innerText = range.value;
        });
        container.appendChild(range);
    }
    setElement(element){
      console.log("reciving end: " + this);
        this.element = element;
        let selector = this.calculateSelector(2);
        this.elementSetListener(selector, this)
    }
    calculateSelector(parentRange){
        if(this.element){
            let selector = this.element.selector;
            for (let i = 0; i < parentRange && i < this.element.parentSelectors.length; i++){
                selector = this.element.parentSelectors[i] + " " + selector;
            }
            console.log(selector);
            return selector;
        }
    }
}
//Fetch elements
/*chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
    chrome.tabs.sendMessage(
            tabs[0].id,
            {subject: "getClickedElements"},
            function(response){
                response.elements.forEach(element => {
                    let result = document.createElement("p");
                    result.innerText = element.text + "  " + element.parentCount;
                    resultContainer.appendChild(result);
                    elementParentRange.style.visibility = "visible";
                    elementParentRange.max = element.parentCount;
                });
            });
});*/
//Export button
function exportButtonListener(){

}
/*exportButton.addEventListener("click", async() => {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        chrome.tabs.sendMessage(
                tabs[0].id,
                {subject: "getElements"},
                function(response){
                    response.elements.forEach(element => {
                        let result = document.createElement("p");
                        result.innerText = element.text;
                        resultContainer.appendChild(result);
                    });
                });
    });
});*/
//Element parent range
/*elementParentRange.addEventListener('input', function(){
    console.log("Input");
    elementParentRangeLabel.innerHTML = elementParentRange.value;
    //Update elementpicker selection
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        chrome.tabs.sendMessage(
                tabs[0].id,
                {subject: "setParentRange", parentRange: elementParentRange.value});
        });
});*/
//Returns all unique placeholder string e.g. {0} and {4}
function getPlaceHolderStrings(string){
    let pattern = /{\d}/g;
    let result = string.match(pattern);
    let uniq = [...new Set(result)];
    console.log(uniq);
}
const hoverClass = "hover";
let elementClass = "";
let selectionCallback = null;
function mouseMoved(e){
  if(toolWindow != e.target && !toolWindow.contains(e.target)){
    removeOverlay(hoverClass);
    //Add overlay
    let element = document.elementFromPoint(e.x, e.y);
    createOverlay(element, hoverClass);
  }
}
function mouseClicked(e){
  if(toolWindow != e.target && !toolWindow.contains(e.target)){
    removeOverlay(hoverClass);
    let element = document.elementFromPoint(e.x, e.y);
    //Callback
    console.log("sent element " + element);
    sellectionCallback(createResponseElement(element));
    elementSelected();
  }
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
           removeOverlay(elementClass);
           document.body.addEventListener("click", mouseClicked);
           document.body.addEventListener("mousemove", mouseMoved);
        }
        //Add toolmenu
        if(request.subject == "addToolMenu"){
        }

    }
)
function selectElement(id, callback){
  elementClass = "element" + id;
  removeOverlay(elementClass);
  document.body.addEventListener("click", mouseClicked);
  document.body.addEventListener("mousemove", mouseMoved);
  sellectionCallback = callback;
  console.log("start selection: " + sellectionCallback);
}

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
