class ToolWindow{
    constructor(){
        this.offset = {y:0,x:0};
        //Somehow adds toolWindow to page
        fetch(chrome.runtime.getURL('/toolWindow.html')).then(r => r.text()).then(html => {
            document.body.insertAdjacentHTML('beforeend', html);
            this.setUpWindow();
        });
    }
    setUpWindow(){
        this.windowElement = document.querySelector('.gustWindow');
        var toolWindowHeader = this.windowElement.querySelector('header');
        toolWindowHeader.onmousedown = this.dragMouseDown.bind(this);

        let exportButton = document.getElementById("exportButton");
        exportButton.onclick = this.onExportButtonPressed.bind(this);
        this.formatString = document.getElementById("formatString");
        let formatButton = document.getElementById("formatButton");
        formatButton.onclick = this.onFormatButtonPressed.bind(this);
    }
    dragMouseDown(e){
        var rect = this.windowElement.getBoundingClientRect();
        this.offset.x = e.x - rect.x;
        this.offset.y = e.y - rect.y;
        document.onmouseup = this.closeDragElement.bind(this);
        document.onmousemove = this.elementDrag.bind(this);
    }
    elementDrag(e){
        this.windowElement.style.left = e.x - this.offset.x + "px";
        this.windowElement.style.top = e.y - this.offset.y + "px";
    }
    closeDragElement(){
        document.onmouseup = null;
        document.onmousemove = null;
    }
    onFormatButtonPressed(){
        let pickerIds = this.getIds(this.formatString.value);
        this.pickers = [];
        pickerIds.forEach(id => {
            this.pickers.push(new ElementPicker(id, document.getElementById("pickElement"), this.windowElement));
        });
    }
    onExportButtonPressed(){
        this.windowElement.style.overflowY = "scroll"; //setting this property in css causes lag for some reason
        let ids = this.getIds(this.formatString.value);
        let elements = [];
        let minLength = Number.MAX_SAFE_INTEGER;
        let totalSelector = "";
        const format = this.formatString.value;
        this.pickers.forEach(picker =>{
            elements.push({currentPosition: 0, elements: picker.getSelectedStrings()});
            totalSelector += picker.selector;
            if(picker != this.pickers[this.pickers.length - 1]){
              totalSelector += ", ";
            }
            if(elements[elements.length - 1].length < minLength){
                minLength = elements[elements.length - 1].length;
            }
        });
        let currentString = format;
        let lastPicker = 0;
        let orderedElements = document.body.querySelectorAll(totalSelector);
        let resultContainer = document.getElementById("result");
        for (var i = 0; i < orderedElements.length; i++) {
            let orderedElement = orderedElements[i];
            for (var j = 0; j < elements.length; j++) {
              let elementList = elements[j];
              if(elementList.elements[elementList.currentPosition] == orderedElement.innerText){
                if(j < lastPicker){
                    ids.forEach(id =>{
                        currentString = currentString.replaceAll(`{${id}}`, "");
                    });
                    let resultElement = document.createElement("p");
                    resultElement.innerText = currentString;
                    resultContainer.appendChild(resultElement);
                    currentString = format;
                }
                //console.log(`{${ids[j]}}`);
                currentString = currentString.replaceAll(`{${ids[j]}}`, elementList.elements[elementList.currentPosition] + `<br>{${ids[j]}}`);
                //rconsole.log(elementList.elements[elementList.currentPosition]);
                elementList.currentPosition++;
                lastPicker = j;
              }
            }
        }
    }
    //Returns all unique placeholder string e.g. {0} and {4}
    getIds(string){
        let pattern = /{(\d+)}/g;
        let result = string.matchAll(pattern);
        let uniq = [...new Set(result)];
        //Extract ids (e.g. Turn {53} to 53)
        for(let i = 0; i < uniq.length; i++){
            uniq[i] = uniq[i][1];
        }
        return uniq;
    }
}
class ElementPicker{
    static get HOVER_CLASS(){
        return 'hover';
    }
    constructor(id, parent, excludedElement = null){
        this.id = id;
        this.elementSelectionAccuracy = 0;
        this.excludedElement = excludedElement;
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
        this.selector = this.calculateSelector(this.range.value);
        this.createOverlayFromSelector(this.selector, this.elementClass);
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
    if(!this.excludedElement || (this.excludedElement != e.target && !this.excludedElement.contains(e.target))){
        //Create overlay
        this.removeOverlay(ElementPicker.HOVER_CLASS);
        this.element = this.createResponseElement(document.elementFromPoint(e.x, e.y));
        this.selector = this.calculateSelector(this.range.value);
        this.createOverlayFromSelector(this.selector, this.elementClass);
        //Setup range
        this.range.style.visibility = "visible";
        this.range.max = this.element.parentSelectors.length;
        //Remove listeners
        document.body.onmousedown = null;
        document.body.onmousemove = null;
      }
    }
    mouseMoved(e){
    if(!this.excludedElement || (this.excludedElement != e.target && !this.excludedElement.contains(e.target))){
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
    getSelectedStrings(){
        let selector = this.calculateSelector(this.range.value);
        let elements = document.body.querySelectorAll(selector);
        let strings = [];
        for(let i = 0; i < elements.length; i++){
            strings.push(elements[i].innerText);
        }
        return strings;
    }
}
new ToolWindow();
