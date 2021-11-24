//Somehow adds toolWindow to page
console.log(chrome.runtime.getURL('/toolWindow.html'))
fetch(chrome.runtime.getURL('/toolWindow.html')).then(r => r.text()).then(html => {
    document.body.insertAdjacentHTML('beforeend', html);
    setUpWindow();
});
function setUpWindow(){
    var offset = {x: 0, y: 0};
    var toolWindow = document.querySelector('.gustWindow');
    var toolWindowHeader = toolWindow.querySelector('header');
    toolWindowHeader.onmousedown = dragMouseDown;

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
}