"use strict";

(function () {

    var animationElements = Array.prototype.slice.call(document.querySelectorAll('[data-animation-start]'));

    animationElements.forEach( function (element) {
        element.setAttribute("data-animation-start", "false");
        element.addEventListener("animationstart", function testAnimationStart() {
            element.setAttribute("data-animation-start", "true");
            this.removeEventListener("animationstart", testAnimationStart);
        }, false);
    });

})();
