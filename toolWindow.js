let ignoredElements = [];
class ToolWindow{
    constructor(){
        this.offset = {y:0,x:0};
        this.pickers = [];
        //Somehow adds toolWindow to page
        console.log(chrome.runtime.getURL("/close.png"))
        fetch(chrome.runtime.getURL('/toolWindow.html')).then(r => r.text()).then(html => {
            document.body.insertAdjacentHTML('beforeend', html);
            this.setUpWindow();
        });
    }
    setUpWindow(){
        this.windowElement = document.querySelector('.gustWindow');
        let toolWindowHeader = this.windowElement.querySelector('header');
        toolWindowHeader.onmousedown = this.dragMouseDown.bind(this);
        //Close window button
        let closeWindowButton = document.getElementById("closeWindowButton");
        closeWindowButton.onclick = function(){
            document.body.removeChild(this.windowElement);
        }.bind(this);

        //Export
        let exportButton = document.getElementById("exportButton");
        exportButton.onclick = this.onExportButtonPressed.bind(this);
        //Format
        this.formatString = document.getElementById("formatString");
        let formatButton = document.getElementById("formatButton");
        formatButton.onclick = this.onFormatButtonPressed.bind(this);
        //Remove single element
        this.removeSingleElementButton = document.getElementById("removeSingleElementButton");
        this.removeSingleElementButton.onclick = this.onRemoveSingleElementButtonPressed.bind(this);
        //Add element picker
        this.addElementPickerButton = document.getElementById("addElementPicker");
        this.addElementPickerButton.onclick = this.onAddElementPicker.bind(this);
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
            selectors.push({id: unusedPickers[i].idPicker.value, selector: unusedPickers[i].calculateSelector()});
            for(let j = i + 1; j < unusedPickers.length; j++){
                if(unusedPickers[j].idPicker.value == unusedPickers[i].idPicker.value){
                    selectors[i].selector += ", " + unusedPickers[j].calculateSelector();
                    unusedPickers.splice(j, 1);
                }
            }
        }
        //Fetch elements and create totalSelector
        selectors.forEach(selector =>{
            let tempElements = document.querySelectorAll(selector.selector);
            elements.push({currentPosition: 0, id: selector.id, elements: tempElements});
            totalSelector += selector.selector + ", ";
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
                  if(elementList.elements[elementList.currentPosition] == orderedElement){
                    if(j == 0){
                        ids.forEach(id =>{
                            currentString = currentString.replaceAll(`{${id}}`, "");
                        });
                        let resultElement = document.createElement("p");
                        resultElement.innerText = currentString;
                        resultContainer.appendChild(resultElement);
                        currentString = format;
                    }
                    //Ignore if in ignoredElements list
                    if(!ignoredElements.includes(orderedElement)){
                        currentString = currentString.replaceAll(`{${elementList.id}}`, elementList.elements[elementList.currentPosition].innerText + `<br>{${elementList.id}}`);
                    }
                    elementList.currentPosition++;
                  }
                }
        }
    }
    onRemoveSingleElementButtonPressed(){
        let picker = new ElementPicker(this.windowElement);
        picker.setOnElementSelectedListener(function(element, x, y){
            //Remove all overlays
            let pattern = /element\d+/
            let topElement = element;
            while(topElement.classList.length == 1 && topElement.classList[0].match(pattern)){
                topElement.parentElement.removeChild(topElement);
                topElement = document.elementFromPoint(x,y);
            }
            //Add element to ignored list
            ignoredElements.push(topElement);
            
        });
        picker.selectElement();
    }
    onAddElementPicker(){
        let pickerIds = this.getIds(this.formatString.value);
        let newPicker = new ElementGroupPicker(pickerIds, document.getElementById("pickElement"), this.windowElement)
        newPicker.setOnRemovedListener(this.removePicker.bind(this));
        this.pickers.push(newPicker);
    }
    removePicker(removedPicker){
        let index = this.pickers.indexOf(removedPicker);
        this.pickers.splice(index, 1);
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
class ElementOverlay{
    constructor(colorString = "rgba(72, 159, 240, 0.5)"){
        this.className = "element" + lastElementId;
        lastElementId++;
        this.colorString = colorString;
    }
    removeOverlay(){
        let currentOverlays = document.body.querySelectorAll(`.${this.className}`);
        if(currentOverlays){
            currentOverlays.forEach(overlay => {
                document.body.removeChild(overlay);
            });
        }
    }
    createOverlay(element){
        let boundingRect = element.getBoundingClientRect();
        let overlay = document.createElement("div");
        //Style
        overlay.className = this.className;
        overlay.style.position = "absolute";
        overlay.style.top = boundingRect.top + window.pageYOffset + "px";
        overlay.style.left = boundingRect.left + window.pageXOffset + "px";
        overlay.style.width = boundingRect.width + "px";
        overlay.style.height = boundingRect.height + "px";
        overlay.style.backgroundColor = this.colorString
        document.body.appendChild(overlay);
    }
    createOverlayFromSelector(selector){
        let elements = document.body.querySelectorAll(selector);
        elements.forEach(element => {
            this.createOverlay(element);
        });
    }
}

class ElementPicker{
    constructor(excludedElement = null){
        this.excludedElement = excludedElement;
        this.overlay = new ElementOverlay();
        this.listener = null;
    }
    setOnElementSelectedListener(listener){
        this.listener = listener;
    }
    selectElement(){
        this.overlay.removeOverlay();
        document.body.onmousedown = this.mouseClicked.bind(this);
        document.body.onmousemove = this.mouseMoved.bind(this);
    }
    mouseClicked(e){
        if(!this.excludedElement || (this.excludedElement != e.target && !this.excludedElement.contains(e.target))){
            //Create overlay
            this.overlay.removeOverlay();
            //Remove listeners
            document.body.onmousedown = null;
            document.body.onmousemove = null;
            //Callback
            if(this.listener){
                this.listener(document.elementFromPoint(e.x, e.y), e.x, e.y);
            }
        }
    }
    mouseMoved(e){
        if(!this.excludedElement || (this.excludedElement != e.target && !this.excludedElement.contains(e.target))){
            this.overlay.removeOverlay();
            //Add overlay
            let element = document.elementFromPoint(e.x, e.y);
            this.overlay.createOverlay(element);
        }
    }
}

class ElementGroupPicker{
    constructor(idOptions, parent, excludedElement = null){
        this.overlayClass = "element" + lastElementId;
        this.elementSelectionAccuracy = 0;
        this.excludedElement = excludedElement;
        this.elementPicker = new ElementPicker(excludedElement);
        this.elementPicker.setOnElementSelectedListener(this.onElementSelected.bind(this));
        this.overlay = new ElementOverlay()
        this.singleElementsIds = [];
        this.removedListener = null;
        //Create elementpicker
        //Container
        let container = document.createElement("div");
        container.classList.add("elementPicker");
        this.container = container;
        parent.appendChild(container);
        //Id picker
        this.idPicker = document.createElement("select");
        container.appendChild(this.idPicker);
        this.setAvailiableIds(idOptions);
        //Pick element button
        let pickElementButton = document.createElement("button");
        pickElementButton.innerText = "Pick an element";
        pickElementButton.addEventListener("click", e =>{
            this.elementPicker.selectElement();
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
        //Remove button
        let removeButton = document.createElement("button");
        removeButton.innerText = "-";
        removeButton.onclick = this.removePicker.bind(this);
        this.container.appendChild(removeButton);
        //Add single element
        let addSingleElementButton = document.createElement("button")
        addSingleElementButton.innerText = "Add single element";
        addSingleElementButton.onclick = this.onAddSingleElementButtonPressed.bind(this);
        container.appendChild(addSingleElementButton);
    }
    setOnRemovedListener(onRemovedListener){
        this.removedListener = onRemovedListener;
    }
    removePicker(){
        this.container.parentElement.removeChild(this.container);
        if(this.removedListener){
            this.removedListener(this);
        }
    }
    onAddSingleElementButtonPressed(){
        let picker = new ElementPicker(this.excludedElement);
        picker.setOnElementSelectedListener(function(element){
            if(!element.id){
                element.id = "singleElement" + this.singleElementsIds.length
            }
            this.singleElementsIds.push(element.id);
            //Refresh overlay
            this.overlay.createOverlay(element);
        }.bind(this));
        picker.selectElement();
    }
    onElementSelected(element){
        this.overlay.removeOverlay();
        this.element = this.createResponseElement(element);
        this.selector = this.calculateSelector();
        this.overlay.createOverlayFromSelector(this.selector);
        //Setup range
        this.range.style.visibility = "visible";
        this.range.style.max = this.element.parentSelectors.length;
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
        this.overlay.removeOverlay();
        this.selector = this.calculateSelector();
        this.overlay.createOverlayFromSelector(this.selector);
    }
    calculateSelector(){
        let selector = "";
        //Add single picked elements
        for(let i = 0; i < this.singleElementsIds.length; i++){
            selector += "#" + this.singleElementsIds[i] + ", ";
        }
        //Add other elements
        if(this.element){
            selector = this.element.selector + ", " + selector;
            for (let i = 0; i < this.range.value && i < this.element.parentSelectors.length; i++){
                selector = this.element.parentSelectors[i] + ">" + selector;
            }  
        }
        selector = selector.substring(0, selector.length - 2);
        return selector;
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
//Listen for request to add tool window
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse){
        if(request.subject === "createToolWindow"){
            new ToolWindow();
        }
    }
)
