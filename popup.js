let pickElement = document.getElementById("pickElementButton");
let exportButton = document.getElementById("exportButton");
let resultContainer = document.getElementById("resultContainer");
//Pick element butotn
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