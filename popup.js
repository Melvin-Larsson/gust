let startToolButton = document.getElementById("startToolButton");
startToolButton.addEventListener('click', e =>{
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        chrome.tabs.sendMessage(tabs[0].id, {subject: "createToolWindow"})
    });
})