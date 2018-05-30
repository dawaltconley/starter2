var menuContainers = toArray(document.querySelectorAll("[data-background-select]"));
var bgMenus = [];

menuContainers.forEach(function (element) {
    var newMenu = new bgMenu(element);
    bgMenus.push(newMenu);
});

function bgMenu(element) {
    this.bgElement = document.getElementById(element.getAttribute("data-background-element"));
    this.bgElement.classList.add("relative");
    this.menu = getChildBySelector(element, "select");
    this.slider = getChildBySelector(element, "input");
}

bgMenu.prototype.setBg = function() {
    var selection = this.menu.selectedOptions[0];
    var image = selection.value;
    var darkness = (Number(this.slider.value) / 100).toString();
    if (selection.hasAttribute("data-size")) {
        this.bgElement.style.backgroundSize = selection.getAttribute("data-size");
    }
    if (selection.hasAttribute("data-position")) {
        this.bgElement.style.backgroundPosition = selection.getAttribute("data-position");
    }
    this.bgElement.style.backgroundImage = "linear-gradient(rgba(0, 0, 0, " + darkness + "), rgba(0, 0, 0, " + darkness + ")), url('" + image + "')";
}

bgMenus.forEach(function (element) {
    element.menu.onchange = element.setBg.bind(element);
    element.slider.onchange = element.setBg.bind(element);
});
