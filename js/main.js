---
---

{% unless jekyll.environment == "development" %}
(function () {
{% endunless %}

    var page = document.querySelector(".parallax-page");
    var win = page;

    if (!page || window.getComputedStyle(page).getPropertyValue("perspective") == "none") {
        page = document.scrollingElement ? document.scrollingElement : getScrollableChild(document.documentElement);
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

    function getTransitionTime(element) {
        var dur = 0;
        var transition = window.getComputedStyle(element).getPropertyValue("transition").split(", ");

        for (var _len = arguments.length, properties = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            properties[_key - 1] = arguments[_key];
        }

        if (properties.length > 0) {
            properties.forEach(function (property) {
                transition.forEach(function (transitionSet) {
                    var propertyMatch = new RegExp("(\\s|^)" + property + "(\\s|$)");
                    if (transitionSet.search(propertyMatch) >= 0) {
                        transitionSet.split(" ").forEach(function (value) {
                            if (value.search(/\ds$/) >= 0) {
                                var seconds = Number(value.replace("s", ""));
                                dur += seconds;
                            }
                        });
                    }
                });
            });
        } else {
            var durElement = void 0,
                durSet = [];
            transition.forEach(function (transitionSet) {
                durElement = 0;
                transitionSet.split(" ").forEach(function (value) {
                    if (value.search(/\ds$/) >= 0) {
                        var seconds = Number(value.replace("s", ""));
                        durElement += seconds;
                    }
                });
                durSet.push(durElement);
            });
            dur = Math.max.apply(null, durSet);
        }
        return dur * 1000;
    };

    function scrollBottom(element) {
        //opposite of .scrollTop: measures dist between bottom of view and bottom of element
        var elementBottom = element.scrollHeight;
        var viewBottom = element.scrollTop + element.clientHeight;
        return elementBottom - viewBottom;
    };

    function pagePos(element) {
        var posTop = element.getBoundingClientRect().top + page.scrollTop;
        var posLeft = element.getBoundingClientRect().left + page.scrollLeft;
        return { top: posTop, left: posLeft };
    };

    function getParentBySelector(element, selector) {
        var maxDepth = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;
        var ancestor = element;
        while (ancestor != document.documentElement && maxDepth !== 0) {
            ancestor = ancestor.parentElement;
            if (Sizzle.matchesSelector(ancestor, selector)) {
                return ancestor;
            }
            maxDepth -= 1;
        }
        return null;
    };

    function getChildBySelector(element, selector) {
        var maxDepth = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;
        for (var i = 0; i < element.children.length; i++) {
            var child = element.children[i];
            if (Sizzle.matchesSelector(child, selector)) {
                return child;
            } else if (child.children.length && maxDepth !== 1) {
                var childMatch = getChildBySelector(child, selector, maxDepth - 1);
                if (childMatch) {
                    return childMatch;
                }
            }
        }
        return null;
    };

    function getChildrenBySelector(element, selector) {
        var maxDepth = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;
        var matches = [];
        for (var i = 0; i < element.children.length; i++) {
            var child = element.children[i];
            if (Sizzle.matchesSelector(child, selector)) {
                matches.push(child);
            }
            if (child.children.length && maxDepth !== 1) {
                var childMatch = getChildrenBySelector(child, selector, maxDepth - 1);
                if (childMatch) {
                    childMatch.forEach(function (match) {
                        matches.push(match);
                    });
                }
            }
        }
        if (matches.length) {
            return matches;
        } else {
            return null;
        }
    };

    function clearClass(string, elements) {
        var className, allOfClass;
        if (string.charAt(0) === ".") {
            className = string.slice(1);
        } else {
            className = string;
        }
        if (elements === undefined) {
            allOfClass = toArray(document.querySelectorAll("." + className));
        } else {
            allOfClass = toArray(elements);
        }
        allOfClass.forEach(function (element) {
            element.classList.remove(className);
        });
    };

    function contentWidth(element) {
        var elementStyle = window.getComputedStyle(element);
        var elementPadding = parseInt(elementStyle.getPropertyValue("padding-left")) + parseInt(elementStyle.getPropertyValue("padding-right"));
        return element.clientWidth - elementPadding;
    };

    function contentHeight(element) {
        var elementStyle = window.getComputedStyle(element);
        var elementPadding = parseInt(elementStyle.getPropertyValue("padding-top")) + parseInt(elementStyle.getPropertyValue("padding-bottom"));
        return element.clientHeight - elementPadding;
    };

    function marginWidth(element) {
        var elementStyle = window.getComputedStyle(element);
        var elementMargin = parseInt(elementStyle.getPropertyValue("margin-left")) + parseInt(elementStyle.getPropertyValue("margin-right"));
        return element.clientWidth + elementMargin;
    };

    function marginHeight(element) {
        var elementStyle = window.getComputedStyle(element);
        var elementMargin = parseInt(elementStyle.getPropertyValue("margin-top")) + parseInt(elementStyle.getPropertyValue("margin-bottom"));
        return element.clientHeight + elementMargin;
    };

    function pushState(hash) {
        window.history.pushState({ hasFocus: hash}, hash.slice(1), hash);
    };

    function executeQueue(array, time) {
        window.setTimeout(function () {
            while (array.length > 0) {
                array.shift().call();
            }
        }, time);
    }

    function parseBoolean(string) {
        if (string == "true") {
            return true;
        } else {
            return false;
        }
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
        zenscroll.to(target, dur, offset);
    };

/*
 * Fullscreen
 */

    var fullscreenElements = toArray(document.querySelectorAll("[data-force-fullscreen]"));

    function forceFullscreen(element) {
        var viewHeight = window.innerHeight;
        if (element.clientHeight != viewHeight) {
            if (element.getAttribute("data-force-fullscreen") === "min") {
                element.style.minHeight = viewHeight.toString() + "px";
            } else if (element.getAttribute("data-force-fullscreen") === "max") {
                element.style.maxHeight = viewHeight.toString() + "px";
            } else {
                element.style.height = viewHeight.toString() + "px";
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
            get: function get() {
                passive = { passive: true };
            }
        });

        window.addEventListener("test", null, options);
    } catch (err) {}

    function addSmoothScrollListeners() {
        smoothLinks.forEach(function (link) {
            link.addEventListener("click", function (event) {
                event.preventDefault();
                smoothScrollToHref(link);
            });
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

    if (objectFitObjects.length > 0 && !CSS.supports("object-fit", "cover")) {
        objectFitFallback();
    }

    if (elementsToHideOnScroll.length > 0) {
        addHideOnScrollListener();
    }

{% unless jekyll.environment == "development" %}
})();
{% endunless %}
