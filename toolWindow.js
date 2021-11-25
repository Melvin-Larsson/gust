//Somehow adds toolWindow to page
console.log(chrome.runtime.getURL('/toolWindow.html'))
fetch(chrome.runtime.getURL('/toolWindow.html')).then(r => r.text()).then(html => {
    document.body.insertAdjacentHTML('beforeend', html);
    setUpWindow();
});
var toolWindow;
var offset = {x: 0, y: 0};
function setUpWindow(){
    toolWindow = document.querySelector('.gustWindow');
    var toolWindowHeader = toolWindow.querySelector('header');
    toolWindowHeader.onmousedown = dragMouseDown;

    let exportButton = document.getElementById("exportButton");
    let picker1 = new ElementPicker("1", document.getElementById("pickElement"));
    let picker2 = new ElementPicker("2", document.getElementById("pickElement"));
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
    static get HOVER_CLASS(){
        return 'hover';
    }
    constructor(id, parent){
        this.id = id;
        this.elementSelectionAccuracy = 0;
        //Create elementpicker
        //Container
        let container = document.createElement("div");
        parent.appendChild(container);
        //Pick element button
        let pickElementButton = document.createElement("button");
        pickElementButton.innerText = "Pick an element";
        pickElementButton.addEventListener("click", e =>{
          this.selectElement();
        });
        container.appendChild(pickElementButton);
        //Range label
        let rangeId = "range" + id;
        let rangeLabel = document.createElement("label");
        rangeLabel.htmlFor = rangeId;
        rangeLabel.innerText = 0;
        this.rangeLabel = rangeLabel;
        container.appendChild(rangeLabel);
        //Range
        let range = document.createElement("input");
        range.id = rangeId;
        range.type = "range";
        range.min = 0;
        range.max = 10;
        range.value = this.elementSelectionAccuracy;
        range.style.visibility = "hidden";
        range.addEventListener('input', this.onRangeMoved.bind(this));
        this.range = range;
        container.appendChild(range);
    }
    onRangeMoved(){
        this.rangeLabel.innerText = parseInt(this.range.value) + 1;
        //Update overlays
        this.removeOverlay(this.elementClass);
        let selector = this.calculateSelector(this.range.value);
        this.createOverlayFromSelector(selector, this.elementClass);
    }

    selectElement(){
        this.elementClass = "element" + this.id;
        this.removeOverlay(this.elementClass);
        console.log(this.elementClass);
        document.body.onmousedown = this.mouseClicked.bind(this);
        document.body.onmousemove = this.mouseMoved.bind(this);
    }
    removeOverlay(className){
        let currentOverlays = document.body.querySelectorAll(`.${className}`);
        if(currentOverlays){
            currentOverlays.forEach(overlay => {
                document.body.removeChild(overlay);
            });
        }
    }
    mouseClicked(e){
      if(toolWindow != e.target && !toolWindow.contains(e.target)){
        //Create overlay
        this.removeOverlay(ElementPicker.HOVER_CLASS);
        this.element = this.createResponseElement(document.elementFromPoint(e.x, e.y));
        let selector = this.calculateSelector(this.range.value);
        this.createOverlayFromSelector(selector, this.elementClass);
        //Setup range
        this.range.style.visibility = "visible";
        this.range.max = this.element.parentSelectors.length;
        //Remove listeners
        document.body.onmousedown = null;
        document.body.onmousemove = null;
      }
    }
    mouseMoved(e){
      if(toolWindow != e.target && !toolWindow.contains(e.target)){
        this.removeOverlay(ElementPicker.HOVER_CLASS);
        //Add overlay
        let element = document.elementFromPoint(e.x, e.y);
        this.createOverlay(element, ElementPicker.HOVER_CLASS);
      }
    }
    calculateSelector(parentRange){
        if(this.element){
            let selector = this.element.selector;
            for (let i = 0; i < parentRange && i < this.element.parentSelectors.length; i++){
                selector = this.element.parentSelectors[i] + " " + selector;
            }
            return selector;
        }
    }
    createOverlayFromSelector(selector, className, colorString = "rgba(72, 159, 240, 0.5)"){
        let elements = document.body.querySelectorAll(selector);
        elements.forEach(element => {
            this.createOverlay(element, className, colorString);
        });
    }
    createOverlay(element, className, colorString = "rgba(72, 159, 240, 0.5)"){
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
    createResponseElements(elements){
        let responseElements = [];
        elements.forEach(element => {
            responseElements.push(this.createResponseElement(element));
        });
        return {elements: responseElements};
    }
    createResponseElement(element){
        //Count parents
        let parentSelectors = [];
        let parent = element;
        while(parent.parentElement && parent != document.body){
            parent = parent.parentElement;
            parentSelectors.push(this.createSelectorString(parent));
        }
        return {text: element.textContent, selector: this.createSelectorString(element), tag: element.tagName, parentSelectors: parentSelectors};
    }
    createSelectorString(element){
        let selector = element.tagName.toLowerCase();
        element.classList.forEach(elementClass => {
            selector += "." + elementClass;
        });
        return selector;
    }

}
//Export button
function exportButtonListener(){

}
//Returns all unique placeholder string e.g. {0} and {4}
function getPlaceHolderStrings(string){
    let pattern = /{\d}/g;
    let result = string.match(pattern);
    let uniq = [...new Set(result)];
    console.log(uniq);
}
