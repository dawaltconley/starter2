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

    jekyllEnv = "{{ jekyll.environment }}";
    hasGoogleAnalytics = "{{ site.google_analytics }}";

/*
 * General-purpose functions
 */

    function toArray(collection) {
        return Array.prototype.slice.call(collection);
    };

    function getScrollableParent(element) {
        var maxDepth = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;
        var ancestor = element;
        while (ancestor != document.documentElement && maxDepth !== 0) {
            ancestor = ancestor.parentElement;
            if (ancestor.scrollHeight > ancestor.clientHeight) {
                return ancestor;
            }
            maxDepth -= 1;
        }
        return null;
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
        var properties, durSet = [ 0 ];
        for (var _len = arguments.length, properties = Array(_len > 1 ? _len - 1 : "all"), _key = 1; _key < _len; _key++) {
            properties[_key - 1] = arguments[_key];
        }
        var computedStyle = window.getComputedStyle(element);
        var prefix = computedStyle.getPropertyValue("transition-duration") ? "" : "-webkit-";
        var tProperty = computedStyle.getPropertyValue(prefix + "transition-property").split(", ");
        var tDur = computedStyle.getPropertyValue(prefix + "transition-duration").split(", ");
        var tDelay = computedStyle.getPropertyValue(prefix + "transition-delay").split(", ");
        properties.forEach(function (property) {
            for (var i=0; i < tProperty.length; i++) {
                if (property == tProperty[i] || tProperty[i] == "all" || property == "all") {
                    var dur = Number(tDur[i].replace("s", ""));
                    var delay = Number(tDelay[i].replace("s", ""));
                    durSet.push((dur + delay) * 1000);
                }
            }
        });
        return Math.max.apply(null, durSet);
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

    function getHash(element) { // for getting hash of an anchor, regardless of whether it is an HTML or SVG anchor
        var elementClass = Object.prototype.toString.call(element);
        if (elementClass == "[object SVGAElement]") {
            var link = element.href.baseVal;
            return link.slice(link.search("#"));
        } else if (elementClass == "[object HTMLAnchorElement]") {
            return element.hash;
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
    };

    function parseBoolean(string) {
        if (string == "true") {
            return true;
        } else {
            return false;
        }
    };

    function distToBottom(element) {
        return Math.floor(element.getBoundingClientRect().bottom - window.innerHeight);
    };

/*
 * Scrolling
 */

    var pageScrollBehavior = window.getComputedStyle(page).getPropertyValue("scroll-behavior");
    var smoothLinks = [];

    toArray(document.querySelectorAll("[data-smooth-scroll]")).forEach(function (element) {
        smoothLinks.push(new SmoothLink(element));
    });

    zenscroll.setup(500, 0);

    function SmoothLink(link) {
        this.element = link;
        this.target = document.querySelector(link.hash);
    };

    SmoothLink.prototype.scroll = function () {
        var dur = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
        var offset = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
        zenscroll.to(this.target, dur, offset);
    };

    function receivesSmoothScroll(element) {
        for (var i=0; i < smoothLinks.length; i++) {
            var link = smoothLinks[i];
            if (element === link.target) {
                return true;
            }
        }
        return false;
    };

/*
 * Background Image Testing
 */

    bgTestingObjects = [];

    toArray(document.querySelectorAll("[data-background-images]")).forEach(function (element) {
        bgTestingObjects.push(new BgSelect(element));
    });

    function BgSelect(element) {
        var menuContainer = element;
        var computedStyle = window.getComputedStyle(element);
        var position = computedStyle.getPropertyValue("position");

        if (position == "static") {
            element.style.position = "relative";
        } else if (position == "absolute") {
            menuContainer = element.parentElement;
        }

        var initialImage = computedStyle.getPropertyValue("background-image");
        initialImage = initialImage.replace(/.*\s?url\([\'\"]?/, '').replace(/[\'\"]?\).*/, '');

        this.element = element;
        this.controls = document.createElement("div");
        this.controls.style.cssText = "position: absolute; top: 0; left: 0;";
        this.menu = document.createElement("select");
        this.slider = document.createElement("input");
        this.slider.type = "range";
        this.slider.value = "50";

        this.images = JSON.parse(element.getAttribute("data-background-images"));
        this.images.unshift({ "name": "initial", "path": initialImage});

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
 * Analytics
 */

    analyticsObjects = [];

    toArray(document.querySelectorAll("[data-analytics-category][data-analytics-action][data-analytics-label]")).forEach(function (element) {
        analyticsObjects.push(new AnalyticsEventObj(element));
    });

    function AnalyticsEventObj(element) {
        this.element = element;
        this.category = element.getAttribute("data-analytics-category");
        this.action = element.getAttribute("data-analytics-action");
        this.label = element.getAttribute("data-analytics-label");
    };

    if (jekyllEnv == 'production') {
        AnalyticsEventObj.prototype.send = function () {
            var callback = arguments.length > 0 && arguments[0] != undefined ? arguments[0] : function(){};
            ga("send", "event", this.category, this.action, this.label, {
                "hitCallback": callback
            });
        }
    } else {
        AnalyticsEventObj.prototype.send = function (callback) {
            var cbString = callback ? ', {\n    "hitCallback": ' + callback + '\n}' : '';
            console.log('Google Analytics Event: ga("send", "event", "%s", "%s", "%s"%s)', this.category, this.action, this.label, cbString);
            callback ? callback() : undefined;
        }
    }

    AnalyticsEventObj.prototype.addListener = function () {
        if (this.element instanceof HTMLIFrameElement && this.action == "click") {
            this.listener = iFrameClickEventListener.bind(null, this);
            window.addEventListener("blur", this.listener, passive);
        } else if (this.action == "click") {
            this.listener = linkClickEventListener.bind(null, this)
            this.element.addEventListener("click", this.listener);
        } else if (this.action == "view") {
            this.listener = scrollToViewEventListener.bind(null, this);
            window.addEventListener("scroll", this.listener, passive);
        }
    };

    function linkClickEventListener(eventObj, event) {
        if (document.origin == eventObj.element.origin) {
            eventObj.send();
        } else {
            event.preventDefault();
            var linkFollowed = false;
            function followLink() {
                if (!linkFollowed) {
                    linkFollowed = true;
                    window.open(eventObj.element.href, eventObj.element.target);
                }
            }
            window.setTimeout(followLink, 1000);
            eventObj.send(followLink);
        }
    };

    function scrollToViewEventListener(eventObj) {
        if (distToBottom(eventObj.element) <= 0) {
            eventObj.send();
            window.removeEventListener("scroll", eventObj.listener, passive);
        }
    };

    function iFrameClickEventListener(eventObj) {
        window.setTimeout(function () {
            if (document.activeElement === eventObj.element) {
                eventObj.send();
                eventObj.element.addEventListener("mouseout", function refocus() {
                    window.focus();
                    this.removeEventListener("mouseout", refocus, passive);
                }, passive);
                window.removeEventListener("blur", eventObj.listener, passive);
            }
        }, 0);
    };

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
            link.element.addEventListener("click", function (event) {
                event.preventDefault();
                link.scroll();
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
    };

    objectFitImages();

    if (smoothLinks.length > 0 && pageScrollBehavior != "smooth") {
        addSmoothScrollListeners();
    }

    if (fullscreenElements.length > 0) {
        addOrientationChangeListener();
        forceFullscreenAll();
    }

    if (elementsToHideOnScroll.length > 0) {
        addHideOnScrollListener();
    }

    if (analyticsObjects.length > 0 && hasGoogleAnalytics) {
        analyticsObjects.forEach(function (object) {
            object.addListener();
        });
    }

{% unless jekyll.environment == "development" %}
})();
{% endunless %}
