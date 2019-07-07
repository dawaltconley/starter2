/*
 * Background Image Testing
 */

var bgTestingObjects = toArray(document.querySelectorAll("[data-background-images]")).map(function (e) {
    return new BgSelect(e);
});

function BgSelect(element) {
    var menuContainer = element;
    var computedStyle = window.getComputedStyle(element);
    var position = computedStyle.getPropertyValue("position");
    var initialImage = {"name": "initial"};

    if (element.tagName == "IMG") { // use element.src?
        var replaceImgWithDiv = function (img, replacement) {
            updateObj(replacement.style, { width: img.width + "px", height: img.height + "px" });
            img.parentNode.replaceChild(replacement, img);
        };

        initialImage.path = element.src;
        initialImage.size = computedStyle.getPropertyValue("object-fit") == "contain" ? "contain" : "cover";
        initialImage.position = computedStyle.getPropertyValue("object-position");

        var divImg = document.createElement("div");
        divImg.setAttribute("data-background-images", element.getAttribute("data-background-images"));
        divImg.classList = element.classList;
        divImg.classList.add("bg-img");
        updateObj(divImg.style, { backgroundImage: "url('" + initialImage.path + "')", backgroundSize: initialImage.size, backgroundPosition: initialImage.position });
        menuContainer = divImg;

        if (element.complete) {
            replaceImgWithDiv(element, divImg);
        } else {
            element.onload = replaceImgWithDiv.bind(null, element, divImg);
        }

        element = divImg;
    } else {
        initialImage.path = computedStyle.getPropertyValue("background-image").replace(/.*\s?url\([\'\"]?/, '').replace(/[\'\"]?\).*/, '');
        initialImage.size = computedStyle.getPropertyValue("background-size");
        initialImage.position = computedStyle.getPropertyValue("background-position");
    }

    if (position == "static" ) {
        element.style.position = "relative";
    } else if (position == "absolute") {
        menuContainer = element.parentElement;
    }

    this.element = element;
    this.controls = document.createElement("div");
    updateObj(this.controls.style, { position: "absolute", bottom: "0", left: "0", zIndex: "999" });
    this.menu = document.createElement("select");
    this.slider = document.createElement("input");
    this.slider.type = "range";
    this.slider.value = "50";

    this.images = JSON.parse(element.getAttribute("data-background-images"));
    this.images.unshift(initialImage);

    for (var i=0; i < this.images.length; i++) {
        var image = this.images[i];
        var imageName = image["name"] ? image["name"] : "image " + i;
        var opt = document.createElement("option");
        opt.textContent = imageName;
        this.menu.appendChild(opt);
    }

    this.controls.appendChild(this.menu);
    this.controls.appendChild(this.slider);
    menuContainer.appendChild(this.controls);
}

BgSelect.prototype.setBg = function (trigger) {
    var image = this.images[this.menu.selectedIndex];
    var imagePath = image["path"] ? image["path"] : image;
    if (trigger == "menu" && image["slider"]) { this.slider.value = image["slider"]; }
    var lightness = ((Number(this.slider.value) - 50) / 50).toString();

    if (lightness >= 0) {
        this.element.style.backgroundImage = "linear-gradient(rgba(255, 255, 255, " + lightness + "), rgba(255, 255, 255, " + lightness + ")), url('" + imagePath + "')";
        console.log("image: %s\nlightness: %s\nslider: %s", imagePath, lightness, Number(this.slider.value));
    } else {
        var darkness = Math.abs(lightness);
        this.element.style.backgroundImage = "linear-gradient(rgba(0, 0, 0, " + darkness + "), rgba(0, 0, 0, " + darkness + ")), url('" + imagePath + "')";
        console.log("image: %s\ndarkness: %s\nslider: %s", imagePath, darkness, Number(this.slider.value));
    }

    image["size"] ? this.element.style.backgroundSize = image["size"] : this.element.style.backgroundSize = null;
    image["position"] ? this.element.style.backgroundPosition = image["position"] : this.element.style.backgroundPosition = null;
}

bgTestingObjects.forEach(function (obj) {
    obj.element.removeAttribute("data-background-images");
    obj.menu.onchange = obj.setBg.bind(obj, "menu");
    obj.slider.onchange = obj.setBg.bind(obj);
    obj.slider.ondblclick = function () {
        obj.slider.value = 50;
        obj.setBg();
    }
});
