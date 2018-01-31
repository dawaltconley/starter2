---
---

{% unless jekyll.environment == "development" %}
(function () {
{% endunless %}

    var page = document.querySelector(".parallax-page");
    var win = page;

    if (!page || window.getComputedStyle(page).getPropertyValue("perspective") == "none") {
        page = getScrollableChild(document.documentElement);
        win = window;
    }

/*
 * General-purpose functions
 */

    function toArray(collection) {
        return Array.prototype.slice.call(collection);
    };

    function getScrollableChild(element) {
        var maxDepth = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 2;
        var currentDepth = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

        if (element.scrollHeight > element.clientHeight) {
            return element;
        }
        for (var i = 0; i < element.children.length && maxDepth > currentDepth; i++) {
            var child = element.children[i];
            var childMatch = getScrollableChild(child, maxDepth, currentDepth += currentDepth);
            if (childMatch) {
                return childMatch;
            }
        }
        return null;
    };

    function pushState(hash) {
        window.history.pushState({ hasFocus: hash}, hash.slice(1), hash);
    };

/*
 * Scrolling
 */

    var pageScrollBehavior = window.getComputedStyle(page).getPropertyValue("scroll-behavior");
    var smoothLinks = toArray(document.querySelectorAll("[data-smooth-scroll]"));
    // make objects

    zenscroll.setup(500, 0);

    function receivesSmoothScroll(element) {
        for (var i=0; i < smoothLinks.length; i++) {
            var link = smoothLinks[i];
            var linkTarget = document.querySelector(link.hash);
            if (element === linkTarget) {
                return true;
            }
        }
        return false;
    };

    function smoothScrollToHref(link) {
        var dur = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
        var offset = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
        var hash = link.hash;
        var target = document.querySelector(hash);
        pushState(hash);
        zenscroll.to(target, dur, offset);
    };

/*
 * Fullscreen
 */

    var fullscreenElements = toArray(document.querySelectorAll("[data-force-fullscreen]"));

    function forceFullscreen(element) {
        var viewHeight = window.innerHeight;
        if (element.clientHeight != viewHeight) {
            if (element.classList.contains("screen-height") || element.classList.contains("screen-size")) {
                element.style.height = viewHeight.toString() + "px";
            } else if (element.classList.contains("screen-height-min") || element.classList.contains("screen-size-min")) {
                element.style.minHeight = viewHeight.toString() + "px";
            }
        }
    };

    function forceFullscreenAll() {
        fullscreenElements.forEach(function (element) {
            forceFullscreen(element);
        });
    };

/*
 * Object Fit Fallback
 */

    var objectFitElements = toArray(document.querySelectorAll('[class*="object-fit"]'));
    var objectFitObjects = [];

    objectFitElements.forEach(function (element) {
        var newObjectFit = new ObjectFit(element);
        objectFitObjects.push(newObjectFit);
    });

    function ObjectFit(element) {
        this.container = element;
        this.img = getChildBySelector(element, "img", 1);
    }

    ObjectFit.prototype.fallback = function () {
        if (this.img) {
            this.container.style.backgroundImage = "url(" + this.img.src + ")";
            this.img.parentNode.removeChild(this.img);
        }
    }

    function objectFitFallback() {
        objectFitObjects.forEach(function (object) {
            object.fallback();
        });
    }

/*
 * Event Listeners
 */

    var passive = false;

    try {
        var options = Object.defineProperty({}, "passive", {
            get: function() {
                passive = { passive: true };
            }
        });

        window.addEventListener("test", null, options);
    } catch(err) {}

    function addSmoothScrollListeners() {
        smoothLinks.forEach(function (link) {
            link.addEventListener("click", function (event) {
                event.preventDefault();
                smoothScrollToHref(link);
            });
        });
        window.addEventListener("popstate", function (event) {
            event.preventDefault();
            if (event.state) {
                var target = document.querySelector(event.state.hasFocus);
                if (receivesSmoothScroll(target)) {
                    zenscroll.to(target);
                }
            } else {
                zenscroll.toY(0);
            }
        });
    };

    function addOrientationChangeListener() {
        var initOrientation = window.innerHeight > window.innerWidth;
        if (fullscreenElements.length > 0) {
            window.addEventListener("resize", function () {
                var newOrientation = window.innerHeight > window.innerWidth;
                if (newOrientation != initOrientation) {
                    forceFullscreenAll();
                }
                initOrientation = newOrientation;
            }, passive);
        }
    };

    var elementsToHideOnScroll = toArray(document.querySelectorAll("[data-hide-on-scroll]"));

    function addHideOnScrollListener() {
        win.addEventListener("scroll", function hideOnScroll() {
            var stop = this.removeEventListener.bind(this, "scroll", hideOnScroll, false);
            if (elementsToHideOnScroll.length == 0) {
                stop();
            } else {
                elementsToHideOnScroll.forEach(function (element, i) {
                    if (element.getBoundingClientRect().bottom < 0) {
                        element.style.display = "none";
                        elementsToHideOnScroll.splice(i, 1);
                    }
                });
            }
        }, passive);
    }

    if (smoothLinks.length > 0 && pageScrollBehavior != "smooth") {
        addSmoothScrollListeners();
    }

    if (fullscreenElements.length > 0) {
        addOrientationChangeListener();
        forceFullscreenAll();
    }

    if (objectFitObjects.length > 0 && window.getComputedStyle(objectFitObjects[0].img).getPropertyValue("object-fit") == "") {
        objectFitFallback();
    }

    if (elementsToHideOnScroll.length > 0) {
        addHideOnScrollListener();
    }

{% unless jekyll.environment == "development" %}
})();
{% endunless %}
