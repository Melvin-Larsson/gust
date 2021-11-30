let startToolButton = document.getElementById("startToolButton");
startToolButton.addEventListener('click', e =>{
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        let tab = tabs[0];
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['toolWindow.js'],
        });
    })
})