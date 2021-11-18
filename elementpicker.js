let pickElement = document.getElementById("pickElementButton");
let exportButton = document.getElementById("exportButton");
let hoverId = "hover";

//Pick element butotn
pickElement.addEventListener("click", async() => {
    console.log("Click!");

    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: setupListener,
    });
});
//Export button
exportButton.addEventListener("click", async() => {

});
function setupListener(){
    let selectedElements = [];
    document.body.addEventListener('mousemove', mouseMoved);
    document.body.addEventListener('click', mouseClicked);
    function mouseMoved(e){
      //Remove last overlay
      removeOverlay("hover");
      //Add overlay
      let element = document.elementFromPoint(e.x, e.y);
      createOverlay(element, "hover");
    }
    function mouseClicked(e){
      //Remove last overlay
      removeOverlay("hover");
      //Query for elements similar to the clicked
      let element = document.elementFromPoint(e.x, e.y);
      let tag = element.tagName.toLowerCase();
      let classList = element.classList;
      let selector = "";
      if(classList.length > 0){
        classList.forEach(c => {
          selector += tag + "." + c;
        });
      }else{
        selector = tag;
      }
      let newElements document.querySelectorAll(selector);
      //selectedElements.push(newElements);

      //Put overlay above the similar elements
      newElements.forEach(element => {
        createOverlay(element, "element", "rgba(247, 250, 67, 0.5)");
      });
    }
    function createOverlay(element, className, colorString = "rgba(72, 159, 240, 0.5)"){
      let boundingRect = element.getBoundingClientRect();
      let overlay = document.createElement("div");
      //Style
      overlay.className = className;
      overlay.style.position = "fixed";
      overlay.style.top = boundingRect.y + "px";
      overlay.style.left = boundingRect.x + "px";
      overlay.style.width = boundingRect.width + "px";
      overlay.style.height = boundingRect.height + "px";
      overlay.style.backgroundColor = colorString
      document.body.appendChild(overlay);
    }
    function removeOverlay(className){
      let currentOverlay = document.body.querySelector(`.${className}`);
      if(currentOverlay){
        document.body.removeChild(currentOverlay);
      }
    }
}
