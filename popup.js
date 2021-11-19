let pickElement = document.getElementById("pickElementButton");
let exportButton = document.getElementById("exportButton");
let resultContainer = document.getElementById("resultContainer");
let elementParentRange = document.getElementById("elementParentRange");
let elementParentRangeLabel = document.getElementById("elementParentRangeLabel");
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

//Pick element button
pickElement.addEventListener("click", async() => {
    console.log("Click!");

    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['elementpicker.js'],
    });
});
//Export button
exportButton.addEventListener("click", async() => {
    /*chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
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
    });*/
});
//Element parent range
elementParentRange.addEventListener('input', function(){
    console.log("Input");
    elementParentRangeLabel.innerHTML = elementParentRange.value;
    //Update elementpicker selection
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        chrome.tabs.sendMessage(
                tabs[0].id,
                {subject: "setParentRange", parentRange: elementParentRange.value});
        });
});
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse){
        if(request.subject === "elementSelected"){
            request.elements.forEach(element => {
                let result = document.createElement("p");
                result.innerText = element.text;
                resultContainer.appendChild(result);
            });
        }
    }
)