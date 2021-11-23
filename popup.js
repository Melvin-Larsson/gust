class ElementPicker{
    constructor(id, parent){
        //Create elementpicker
        //Container
        let container = document.createElement("div");
        parent.appendChild(container);
        //Pick element button
        let pickElementButton = document.createElement("button");
        pickElementButton.innerText = "Pick an element";
        pickElementButton.addEventListener("click", e =>{
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
                chrome.tabs.sendMessage(
                    tabs[0].id,
                    {subject: "selectElement", callbackId: id});
            });
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
        //Setup on element selected message listener
        chrome.runtime.onMessage.addListener(
            function(request, sender, sendResponse){
                if(request.subject === "elementSelected" && request.callbackId === id){
                    console.log(request.element);
                }
            }
        )
    }
}

//let pickElement = document.getElementById("pickElementButton");
let exportButton = document.getElementById("exportButton");
//let resultContainer = document.getElementById("resultContainer");
//let elementParentRange = document.getElementById("elementParentRange");
//let elementParentRangeLabel = document.getElementById("elementParentRangeLabel");

chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
    let tab = tabs[0];
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['elementpicker.js'],
    });
});

let picker1 = new ElementPicker("1", document.getElementById("pickElement"));
let picker2 = new ElementPicker("2", document.getElementById("pickElement"));

//Fetch elements
chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
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
});
//Export button
exportButton.addEventListener("click", async() => {
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
});
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
/*chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse){
        if(request.subject === "elementSelected"){
            request.elements.forEach(element => {
                let result = document.createElement("p");
                result.innerText = element.text;
                resultContainer.appendChild(result);
            });
        }
    }
)*/
//Returns all unique placeholder string e.g. {0} and {4}
function getPlaceHolderStrings(string){
    let pattern = /{\d}/g;
    let result = string.match(pattern);
    let uniq = [...new Set(result)];
    console.log(uniq);   
}