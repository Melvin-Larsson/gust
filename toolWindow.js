class ToolWindow{
    constructor(){
        this.offset = {y:0,x:0};
        this.pickers = [];
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
        //Export
        let exportButton = document.getElementById("exportButton");
        exportButton.onclick = this.onExportButtonPressed.bind(this);
        //Format
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
        //Update current pickers with the new ids
        this.pickers.forEach(picker =>{
            picker.setAvailiableIds(pickerIds);
        });
        //Add new pickers while there are more pickerIds than pickers
        while(pickerIds.length > this.pickers.length){
            this.pickers.push(new ElementPicker(pickerIds, document.getElementById("pickElement"), this.windowElement));

        }
    }
    onExportButtonPressed(){
        this.windowElement.querySelector('.container').style.overflowY = "scroll"; //setting this property in css causes lag for some reason
        const format = this.formatString.value;
        let ids = this.getIds(this.formatString.value);
        let elements = [];
        let minLength = Number.MAX_SAFE_INTEGER;
        let totalSelector = "";
        //Merge selectors from pickers that use the same placeholder id
        let selectors = [];
        let unusedPickers = [...this.pickers];
        for(let i = 0; i < unusedPickers.length; i++){
            selectors.push(unusedPickers[i].calculateSelector());
            for(let j = i + 1; j < unusedPickers.length; j++){
                if(unusedPickers[j].idPicker.value == unusedPickers[i].idPicker.value){
                    selectors[i] += ", " + unusedPickers[j].calculateSelector();
                    unusedPickers.splice(j, 1);
                }
            }
        }
        console.log(selectors[0]);
        //Fetch elements and create totalSelector
        selectors.forEach(selector =>{
            let tempElements = document.querySelectorAll(selector);
            let tempElementTexts = [];
            tempElements.forEach(element =>{
                tempElementTexts.push(element.innerText);
            });
            elements.push({currentPosition: 0, elements: tempElementTexts});
            totalSelector += selector + ", ";
        });
        //Remove last ", " from totalSelector
        totalSelector = totalSelector.substring(0, totalSelector.length - 2);

        let currentString = format;
        let orderedElements = document.body.querySelectorAll(totalSelector);
        let resultContainer = document.getElementById("result");
        for (let i = 0; i < orderedElements.length; i++) {
            let orderedElement = orderedElements[i];
            for (let j = 0; j < elements.length; j++) {
              let elementList = elements[j];
              if(elementList.elements[elementList.currentPosition] == orderedElement.innerText){
                if(j == 0){
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
let lastElementId = 0;
class ElementPicker{
    static get HOVER_CLASS(){
        return 'hover';
    }

    constructor(idOptions, parent, excludedElement = null){
        this.overlayClass = "element" + lastElementId;
        this.elementSelectionAccuracy = 0;
        this.excludedElement = excludedElement;
        //Create elementpicker
        //Container
        let container = document.createElement("div");
        container.classList.add("elementPicker");
        parent.appendChild(container);
        //Id picker
        this.idPicker = document.createElement("select");
        container.appendChild(this.idPicker);
        this.setAvailiableIds(idOptions);
        //Pick element button
        let pickElementButton = document.createElement("button");
        pickElementButton.innerText = "Pick an element";
        pickElementButton.addEventListener("click", e =>{
          this.selectElement();
        });
        container.appendChild(pickElementButton);
        //Range label
        let rangeId = "range" + lastElementId;
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
        //Increase lastElementId
        lastElementId++;
    }
    setAvailiableIds(idOptions){
        let currentId = this.idPicker.value;
        //Remove old options
        while(this.idPicker.options.length > 0){
            this.idPicker.remove(0);
        }
        //Add new options
        let option;
        for(let i = 0; i < idOptions.length; i++){
            option = document.createElement("option");
            option.text = idOptions[i];
            this.idPicker.add(option);
        }
        //Set selected value to old selected value if possible
        if(idOptions.includes(currentId)){
            this.idPicker.value = currentId;
        }
    }
    onRangeMoved(){
        this.rangeLabel.innerText = parseInt(this.range.value) + 1;
        //Update overlays
        this.removeOverlay(this.overlayClass);
        this.selector = this.calculateSelector();
        this.createOverlayFromSelector(this.selector, this.overlayClass);
    }
    selectElement(){
        this.removeOverlay(this.overlayClass);
        console.log(this.overlayClass);
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
        this.selector = this.calculateSelector();
        this.createOverlayFromSelector(this.selector, this.overlayClass);
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
    calculateSelector(){
        if(this.element){
            let selector = this.element.selector;
            for (let i = 0; i < this.range.value && i < this.element.parentSelectors.length; i++){
                selector = this.element.parentSelectors[i] + ">" + selector;
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
    /*getSelectedStrings(){
        let selector = this.calculateSelector(this.range.value);
        let elements = document.body.querySelectorAll(selector);
        let strings = [];
        for(let i = 0; i < elements.length; i++){
            strings.push(elements[i].innerText);
        }
        return strings;
    }*/
}
new ToolWindow();
