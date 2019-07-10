---
---

"use strict";

{% unless jekyll.environment == "development" %}
(function () {
{% endunless %}

    var page = document.querySelector(".parallax-page");
    var win = page;

    if (!page || window.getComputedStyle(page).getPropertyValue("perspective") === "none") {
        page = document.scrollingElement ? document.scrollingElement : getScrollableChild(document.documentElement);
        win = window;
    }

    var jekyllEnv = "{{ jekyll.environment }}";
    var hasGoogleAnalytics = "{{ site.google_analytics }}";

/*
 * General-purpose functions
 */

    function toArray(collection) {
        return Array.prototype.slice.call(collection);
    }

    function getScrollableParent(element) {
        var maxDepth = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;
        var ancestor = element;
        while (ancestor !== document.documentElement && maxDepth !== 0) {
            ancestor = ancestor.parentElement;
            if (ancestor.scrollHeight > ancestor.clientHeight) {
                return ancestor;
            }
            maxDepth -= 1;
        }
        return null;
    }

    function getScrollableChild(element) {
        var maxDepth = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 2;
        var currentDepth = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

        if (element.scrollHeight > element.clientHeight) {
            return element;
        }
        for (var i = 0; element.children && i < element.children.length && maxDepth > currentDepth; i++) {
            var child = element.children[i];
            var childMatch = getScrollableChild(child, maxDepth, currentDepth += currentDepth);
            if (childMatch) {
                return childMatch;
            }
        }
        return null;
    }

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
            for (var i = 0; i < tProperty.length; i++) {
                if (property === tProperty[i] || tProperty[i] === "all" || property === "all") {
                    var dur = Number(tDur[i].replace("s", ""));
                    var delay = Number(tDelay[i].replace("s", ""));
                    durSet.push((dur + delay) * 1000);
                }
            }
        });
        return Math.max.apply(null, durSet);
    }

    function scrollBottom(element) {
        //opposite of .scrollTop: measures dist between bottom of view and bottom of element
        var elementBottom = element.scrollHeight;
        var viewBottom = element.scrollTop + element.clientHeight;
        return elementBottom - viewBottom;
    }

    function getRelativeClientRect(child, parent) {
        var cRect = child.getBoundingClientRect();
        var pRect = parent.getBoundingClientRect();
        var rRect = {
            top: cRect.top - pRect.top,
            bottom: cRect.bottom - pRect.top,
            left: cRect.left - pRect.left,
            right: cRect.right - pRect.left
        }
        if (parent.offsetHeight < parent.scrollHeight) {
            rRect.top = rRect.top + parent.scrollTop;
            rRect.bottom = rRect.bottom + parent.scrollTop;
            rRect.left = rRect.left + parent.scrollLeft;
            rRect.right = rRect.right + parent.scrollLeft;
        }
        return rRect;
    }

    function pagePos(element) {
        return getRelativeClientRect(element, page);
    }

    function updateDescendentIds(element, string) {
        var position = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "suffix";
        var maxDepth = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : undefined;
        if (element.id && position === "suffix") {
            element.id = element.id + string;
        } else if (element.id && position === "prefix") {
            element.id = string + element.id;
        }
        for (var i = 0; element.children && i < element.children.length && maxDepth !== 0; i++) {
            updateDescendentIds(element.children[i], string, position, maxDepth - 1);
        }
    }

    function getHash(element) { // for getting hash of an anchor, regardless of whether it is an HTML or SVG anchor
        var elementClass = Object.prototype.toString.call(element);
        if (elementClass === "[object SVGAElement]") {
            var link = element.href.baseVal;
            return link.slice(link.search("#"));
        } else if (elementClass === "[object HTMLAnchorElement]") {
            return element.hash;
        } else {
            return null;
        }
    }

    function clearClass(string, elements) {
        var className = string.charAt(0) === "." ? string.slice(1) : string;
        var elements = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : document.querySelectorAll("." + className);
        toArray(elements).forEach(function (element) {
            element.classList.remove(className);
        });
    }

    function contentWidth(element) {
        var elementStyle = window.getComputedStyle(element);
        var elementPadding = parseInt(elementStyle.getPropertyValue("padding-left")) + parseInt(elementStyle.getPropertyValue("padding-right"));
        return element.clientWidth - elementPadding;
    }

    function contentHeight(element) {
        var elementStyle = window.getComputedStyle(element);
        var elementPadding = parseInt(elementStyle.getPropertyValue("padding-top")) + parseInt(elementStyle.getPropertyValue("padding-bottom"));
        return element.clientHeight - elementPadding;
    }

    function marginWidth(element) {
        var elementStyle = window.getComputedStyle(element);
        var elementMargin = parseInt(elementStyle.getPropertyValue("margin-left")) + parseInt(elementStyle.getPropertyValue("margin-right"));
        return element.clientWidth + elementMargin;
    }

    function marginHeight(element) {
        var elementStyle = window.getComputedStyle(element);
        var elementMargin = parseInt(elementStyle.getPropertyValue("margin-top")) + parseInt(elementStyle.getPropertyValue("margin-bottom"));
        return element.clientHeight + elementMargin;
    }

    function pushHash(hash) {
        window.history.pushState({ hasFocus: hash }, hash.slice(1), hash);
    }

    function pushQuery(q) {
        var query = q instanceof URLSearchParams ? q.toString() : q.replace(/^\?/, "");
        window.history.pushState({ queryString: "?" + query }, query, window.location.pathname + "?" + query);
    }

    function executeQueue(array, time) {
        window.setTimeout(function () {
            while (array.length > 0) {
                array.shift().call();
            }
        }, time);
    }

    function insertAfter(referenceNode, newNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    }

    function parseBoolean(string) {
        if (string === "true") {
            return true;
        } else {
            return false;
        }
    }

    function distToBottom(element) {
        return Math.floor(element.getBoundingClientRect().bottom - window.innerHeight);
    }

    function onScroll(direction, callback) {
        var scroller = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : win;
        var oldPos = page.scrollTop;
        var removeListener = scroller.removeEventListener.bind(scroller, "scroll", scrolling, passive);

        function scrolling() {
            var newPos = page.scrollTop;
            if ((newPos < oldPos && direction === "up") || (newPos > oldPos && direction === "down")) {
                callback();
            }
            oldPos = newPos;
        }

        scroller.addEventListener("scroll", scrolling, passive);
        return removeListener;
    }

    var onScrollUp = onScroll.bind(null, "up");
    var onScrollDown = onScroll.bind(null, "down");

    function onScrollEnd(callback) {
        var buffer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 100;
        var scroller = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : win;
        var removeListener = scroller.removeEventListener.bind(scroller, "scroll", scrolling, passive);
        var doneScrolling;

        function scrolling() {
            window.clearTimeout(doneScrolling);
            doneScrolling = window.setTimeout(function () {
                removeListener();
                callback();
            }, buffer);
        }

        scroller.addEventListener("scroll", scrolling, passive);
        return function () {
            removeListener();
            window.clearTimeout(doneScrolling);
        };
    }

    function updateObj(obj, newObj) {
        for (var key in newObj) {
            obj[key] = newObj[key];
        }
    }

    function getData(path, callback) {
        var request = new XMLHttpRequest();
        request.open("GET", path);
        request.onload = function () {
            if (this.status >= 200 && this.status < 400) {
                callback(this.response);
            } else {
                // server error
                callback(undefined);
            }
        }

        request.onerror = function () {
            // error handling
            callback(undefined);
        }

        request.send();
    }

/*
 * DOM Manipulation
 */

    function imgLoaded(img) {
        return img.complete && img.naturalHeight !== 0;
    }

    function afterImageLoad(img, cb) {
        if (imgLoaded(img)) {
            return cb();
        } else {
            return img.addEventListener("load", cb);
        }
    }

    var lazyImages = toArray(document.querySelectorAll("img[data-lazy]"));
    for (var i = 0; i < lazyImages.length; i++) {
        lazyImages[i] = new LazyImage(lazyImages[i]);
    }

    function LazyImage(img) {
        if (imgLoaded(img)) {
            this.alreadyLoaded = true;
        } else {
            var attributes = ["src", "srcset"];
            this.element = img;
            this.assets = {};
            ["src", "srcset"].forEach(function (a) {
                var asset = img.getAttribute(a);
                this.assets[a] = asset ? asset : "";
                img.setAttribute(a, "");
            }.bind(this));
        }
    }

    LazyImage.prototype.load = function () {
        if (!this.alreadyLoaded) {
            for (var attribute in this.assets) {
                this.element.setAttribute(attribute, this.assets[attribute]);
            }
        }
    };

    window.addEventListener("load", function () {
        lazyImages.forEach(function (e) {
            e.load();
        });
    });

    function removeChildren(e) {
        var child = e.lastChild;
        while (child) {
            e.removeChild(child);
            child = e.lastChild;
        }
    }

    var shuffleChildren = toArray(document.querySelectorAll("[data-shuffle-children]"));
    shuffleChildren.forEach(function (e) {
        var shuffled = e.cloneNode(false);
        var children = toArray(e.children);
        while (children.length > 0) {
            var i = Math.floor(Math.random() * children.length);
            shuffled.appendChild(children.splice(i, 1)[0]);
        }
        e.parentNode.replaceChild(shuffled, e);
    });

    var now = new Date();
    var currentYear = now.getFullYear().toString();
    var yearsToUpdate = toArray(document.querySelectorAll("[data-current-year]"));
    yearsToUpdate.forEach(function (y) {
        y.innerText = currentYear;
    });

/*
 * Classes
 */

    var classRemoveElements = toArray(document.querySelectorAll("[data-class-rm]"));
    var classAddElements = toArray(document.querySelectorAll("[data-class-add]"));

    classRemoveElements.forEach(function (element) {
        element.getAttribute("data-class-rm")
            .split(" ").forEach(function (c) {
                element.classList.remove(c);
            });
    });

    classAddElements.forEach(function (element) {
        element.getAttribute("data-class-add")
            .split(" ").forEach(function (c) {
                element.classList.add(c);
            });
    });

/*
 * Scrolling
 */

    var smoothScroller = zenscroll;
    smoothScroller.setup(500, 0);

    var pageScrollBehavior = window.getComputedStyle(page).getPropertyValue("scroll-behavior");
    var smoothLinks = {};
    toArray(document.querySelectorAll("[data-smooth-scroll]")).forEach(function (e) {
        smoothLinks[e.hash] = new SmoothLink(e);
    });

    function SmoothLink(link) {
        this.element = link;
        this.hash = link.hash;
        this.target = document.querySelector(link.hash);

        link.addEventListener("click", function (event) {
            event.preventDefault();
            pushHash(this.hash);
            this.scroll();
        }.bind(this));
    }

    SmoothLink.prototype.scroll = function () {
        var dur = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
        var offset = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
        if (fixedHeader) fixedHeader.hide();
        smoothScroller.to(this.target, dur, offset);
    };

    function addSmoothScrollListeners() {
        window.addEventListener("popstate", function () {
            if (event.state) {
                var hash = event.state.hasFocus;
                if (smoothLinks[hash]) smoothLinks[hash].scroll();
            } else {
                smoothScroller.toY(0);
            }
        }, passive);
    }

/*
 * Fixed Headers
 */

    function FixedHeader(header) {
        var e = header.cloneNode(true);
        this.element = e;
        this.headerRef = header;
        this.pos = page.scrollTop;
        this.refPos = pagePos(header);

        this.scrollListener = this.scroll.bind(this);
        this.slideUp = this.slide.bind(this, "up");
        this.slideDown = this.slide.bind(this, "down");

        this.matchRef();
        updateObj(this.element.style, { position: "fixed", top: -this.height.toString() + "px", zIndex: "999", display: "none" });
        updateDescendentIds(e, "-fixed");
        document.body.insertBefore(this.element, document.body.firstChild);
    }

    FixedHeader.prototype.hideHeaderRef = function () {
        this.headerRef.setAttribute("aria-hidden", "true");
        this.headerRef.setAttribute("role", "presentation");
    };

    FixedHeader.prototype.showHeaderRef = function () {
        this.headerRef.removeAttribute("aria-hidden");
        this.headerRef.removeAttribute("role");
    };

    FixedHeader.prototype.scroll = function () {
        var f = this;
        var e = this.element;
        var pos = page.scrollTop;
        var scrollDiff = pos - f.pos;
        window.clearTimeout(f.doneScrolling);
        f.doneScrolling = window.setTimeout(function () {
            f.interruptSlide = false;
        }, 50);
        if (e.style.display !== "none" && pos > f.refPos.top || e.style.display === "none" && pos > f.refPos.bottom) {
            e.style.display = "";
            f.hideHeaderRef();
            f.interruptSlide = true;
            var top = parseInt(e.style.top);
            if (scrollDiff < 0 && top < 0 || scrollDiff > 0 && top > -f.height) {
                top = Math.min(Math.max(top - scrollDiff, -f.height), 0);
                e.style.top = top.toString() + "px";
                f.setShadow(top + f.height);
                f.doneScrolling = window.setTimeout(function () {
                    requestAnimationFrame(f.slideDown.bind(f));
                }, 500);
            }
        } else if (e.style.display !== "none") {
            f.showHeaderRef();
            updateObj(e.style, { display: "none", top: -f.height.toString() + "px" });
            f.setShadow();
        }
        f.pos = pos;
    };

    FixedHeader.prototype.disableScroll = function () {
        win.removeEventListener("scroll", this.scrollListener, passive);
    };

    FixedHeader.prototype.enableScroll = function () {
        this.pos = page.scrollTop;
        win.addEventListener("scroll", this.scrollListener, passive);
    };

    FixedHeader.prototype.hide = function () {
        fixedHeader.disableScroll();
        onScrollEnd(fixedHeader.enableScroll.bind(fixedHeader));
        fixedHeader.slideUp();
        if (fixedHeader.menu && fixedHeader.menu.state === "open") {
            fixedHeader.menu.close();
        }
    };

    FixedHeader.prototype.matchRef = function () {
        this.refPos = pagePos(this.headerRef);
        this.height = this.headerRef.clientHeight;
        updateObj(this.element.style, { width: this.headerRef.clientWidth.toString() + "px", height: this.height.toString() + "px" });
    };

    FixedHeader.prototype.resize = function () {
        this.disableScroll();
        this.matchRef();
        window.clearTimeout(this.doneResizing);
        this.doneResizing = window.setTimeout(this.enableScroll(), 100);
    };

    FixedHeader.prototype.slide = function (direction) {
        var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function () {};
        var t = parseInt(this.element.style.top);
        var b = t + this.height;
        if (this.interruptSlide) { return null; } // run callback?
        if (direction === "down" && t < 0 || direction === "up" && b > 0) {
            var dist = direction === "down" ? Math.min(t/5, -1) : Math.max(b/5, 1);
            this.element.style.top = (t - dist).toString() + "px";
            window.clearTimeout(callback);
            requestAnimationFrame(this.slide.bind(this, direction, callback));
        }
        this.setShadow(b);
        window.setTimeout(callback, 50);
    };

    FixedHeader.prototype.setShadow = function () {
        var b = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : parseInt(this.element.style.top) + this.height;
        this.element.style.boxShadow = "0 " + (b/32).toString() + "px " + (b/16).toString() + "px 0 rgba(0, 0, 0, 0.2)";
    };

    FixedHeader.prototype.addListeners = function () {
        win.addEventListener("scroll", this.scrollListener, passive);
        window.addEventListener("resize", this.resize.bind(this), passive);
    };

    var fixedHeader = document.querySelector("[data-fixed-header]");

    if (fixedHeader) {
        fixedHeader = new FixedHeader(fixedHeader);
    }

/*
 * Collapsible Menus
 */

    var collapsibleMenus = toArray(document.querySelectorAll("[data-menu]")).map(function (e) {
        var o = new CollapsibleMenu(e)
        if (fixedHeader && fixedHeader === e) {
            fixedHeader.menu = o;
        }
        return o;
    });

    function CollapsibleMenu(element) {
        this.element = element;
        this.buttons = {
            "open" : toArray(element.querySelectorAll('[data-menu-button="open"]')),
            "close" : toArray(element.querySelectorAll('[data-menu-button="close"]')),
            "toggle" : toArray(element.querySelectorAll('[data-menu-button="toggle"],[data-menu-button=""]'))
        };
        this.links = element.querySelector('[data-menu-links]');
        this.state = "closed";
    }

    collapsibleMenus.forEach(function (menu) {
        menu.buttons.open.forEach(function (button) {
            if (button.hash && location.hash === button.hash) {
                location.href = location.href.replace(/#.*$/, "");
            }
        });
    });

    CollapsibleMenu.prototype.open = function () {
        this.links.style.maxHeight = this.links.scrollHeight.toString() + "px";
        this.buttons.open.forEach(function (button) {
            button.classList.add("hidden");
        });
        this.buttons.close.forEach(function (button) {
            button.classList.remove("hidden");
        });
        this.state = "open";
        this.removeListener = onScrollDown(function () {
            if (this.element.getBoundingClientRect().top <=0) {
                this.close();
                this.removeListener();
            }
        }.bind(this));
    };

    CollapsibleMenu.prototype.close = function () {
        this.links.style.maxHeight = "";
        this.buttons.close.forEach(function (button) {
            button.classList.add("hidden");
        });
        this.buttons.open.forEach(function (button) {
            button.classList.remove("hidden");
        });
        this.state = "closed";
        this.removeListener();
    };

    CollapsibleMenu.prototype.toggle = function () {
        if (this.state === "closed") {
            this.open();
        } else if (this.state === "open") {
            this.close();
        }
    };

    CollapsibleMenu.prototype.addListeners = function () {
        for (var method in this.buttons) {
            if (this.buttons[method]) {
                this.buttons[method].forEach(function (button) {
                    button.classList.remove("target-hide", "target-display");
                    button.addEventListener("click", function (event) {
                        event.preventDefault();
                        this[method]();
                    }.bind(this));
                }.bind(this));
            }
        }
    };

/*
 * Animations
 */

    var animatedElements = toArray(document.querySelectorAll(".animate"));

    animatedElements.forEach(function (element) {
        var hasStarted = parseBoolean(element.getAttribute("data-animation-start"));
        if (!hasStarted) {
            element.classList.remove("animate");
        } else {
            console.log("Page load was too late for " + element.id + " animation.");
        }
    });

    function playAnimations() {
        animatedElements.forEach(function (element) {
            element.classList.add("animate", "animate-js");
        });
    }

/*
 * Slideshows
 */

    function Slideshow(e) {
        this.frame = e;

        this.slides = toArray(e.querySelectorAll("[data-slide]"));
        for (var i = 0; i < this.slides.length; i++) {
            this.slides[i] = new Slide(this.slides[i]);
        }
        this.slides = this.slides.sort(function (a, b) { return a.order - b.order; });
        this.slides.forEach(function (slide, i) {
            slide.index = i;
            if (i === 0) {
                slide.element.style.opacity = "1";
            } else {
                slide.element.style.opacity = "0";
            }
        });
        this.arrange(0);

        var timing = e.getAttribute("data-slideshow").split(":").map(function (t) {
            return Number(t) * 1000;
        });
        this.cycle = timing[0] ? timing[0] : 10000;
        this.fadeTime = timing.length > 1 && timing[1] ? timing[1] : this.cycle / 4;
        this.now = 0;

        this.controls = toArray(e.querySelectorAll("[data-button]"));
        this.controls.forEach(function (c) {
            var action = c.getAttribute("data-button").split(":");
            var clickTime = action.length > 1 && action[1] ? Number(action[1])*1000 : this.fadeTime;
            action = action[0].trim().toLowerCase();
            if (action === "next") {
                action = this.fadeToNext.bind(this, clickTime);
            } else if (action === "prev") {
                action = this.fadeToPrev.bind(this, clickTime);
            } else {
                action = function () {};
            }
            c.addEventListener("click", function () {
                action();
                window.clearTimeout(this.timeout);
                this.timePaused = this.now;
                this.paused = true;
            }.bind(this));
        }.bind(this));
    }

    function Slide(e) {
        var slideNum = Number(e.getAttribute("data-slide"));
        this.element = e;
        this.order = slideNum ? slideNum : undefined;
    }

    Slide.prototype.fadeOut = function (dur) {
        var slide = this.element;
        var initOpacity = parseInt(slide.style.opacity);
        if (initOpacity) {
            var start = performance.now();
            var frame = requestAnimationFrame(function fade() {
                var elapsed = (performance.now() - start) / dur;
                elapsed = Math.min(elapsed, 1);
                slide.style.opacity = ((1 - elapsed) / initOpacity).toString();
                if (elapsed < 1) {
                    frame = requestAnimationFrame(fade);
                }
            });
            window.setTimeout(cancelAnimationFrame.bind(window, frame), dur);
        }
    };

    Slideshow.prototype.arrange = function (i) {
        this.current = this.slides[i];
        for (var j = 0; j < this.slides.length; j++) {
            var style = this.slides[j].element.style;
            if (j === i) {
                style.zIndex = "0";
            } else {
                style.zIndex = "-1";
            }
        }
    };

    Slideshow.prototype.fadeTo = function (i) {
        if (!this.fading) {
            var dur = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.fadeTime;
            var last = this.current;
            var next = this.slides[i];
            this.fading = true;
            this.start = performance.now();
            next.element.style.opacity = "1";
            last.fadeOut(dur);
            window.setTimeout(function () {
                this.arrange(i);
                this.fading = false;
            }.bind(this), dur + 100);
        }
    };

    Slideshow.prototype.fadeToNext = function () {
        var dur = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;
        var next = this.current.index + 1;
        if (next >= this.slides.length) {
            next = 0;
        }
        this.fadeTo(next, dur);
    };

    Slideshow.prototype.fadeToPrev = function () {
        var dur = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;
        var prev = this.current.index - 1;
        if (prev < 0) {
            prev = this.slides.length - 1;
        }
        this.fadeTo(prev, dur);
    };

    Slideshow.prototype.play = function () {
        var s = this;
        s.paused = false;
        s.start = performance.now();
        requestAnimationFrame(function next() {
            s.now = performance.now();
            window.clearTimeout(s.timeout);
            s.timeout = window.setTimeout(function () {
                s.timePaused = s.now;
                s.frameTimedOut = true;
            }, 100);
            if (s.frameTimedOut) {
                s.start = s.now - (s.timePaused - s.start);
                s.frameTimedOut = false;
            }
            if (s.now - s.start >= s.cycle) {
                s.fadeToNext();
            }
            if (!s.paused) {
                requestAnimationFrame(next);
            }
        });
    };

    var slideshows = toArray(document.querySelectorAll("[data-slideshow]")).map(function (e) {
        return new Slideshow(e);
    });

    window.addEventListener("load", function () {
        slideshows.forEach(function (s) {
            s.play();
        });
    }, passive);

/*
 * Fullscreen
 */

    var fullscreenElements = toArray(document.querySelectorAll("[data-force-fullscreen]"));

    function forceFullscreen(element) {
        if (element.clientHeight !== viewHeight) {
            var p = element.getAttribute("data-force-fullscreen");
            var p = p === "min" || p === "max" ? p + "Height" : "height";
            element.style[p] = window.innerHeight.toString() + "px";
        }
    }

    function forceFullscreenAll() {
        fullscreenElements.forEach(function (element) {
            forceFullscreen(element);
        });
    }

/*
 * Search
 */

    var searchOptions = {
        "/posts.json": {
            id: "id",
            shouldSort: true,
            threshold: 0.3,
            location: 0,
            distance: 2400,
            keys: [ "title", "author", "categories", "tags", "url", "excerpt", "imageCaption" ]
        }
    };

    var searchObjects = toArray(document.querySelectorAll("[data-search]")).map(function (e) {
        return new Search(e);
    });

    function Search(form) {
        this.form = form;
        this.field = form.elements["search"];
        this.file = form.getAttribute("data-search");
        this.options = searchOptions[this.file];
        this.outputContainer = document.querySelector('[data-search-items="' + this.file + '"]') || document.querySelector("[data-search-items]");
        this.items = toArray(this.outputContainer.children);
        this.info = document.querySelector('[data-search-info="' + this.file + '"]') || document.querySelector("[data-search-info]");
        if (this.info) this.info.style.display = "none";
    }

    Search.prototype.configure = function () {
        var cb = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function () {};
        var self = this;
        getData(this.file, function (r) {
            self.data = JSON.parse(r);
            self.fuse = new Fuse(self.data, self.options);
            cb();
        });
    };

    Search.prototype.dateSearch = function (query) {
        if (!this.data[0].date) return null;
        if (!this.months || !this.fuseMonth || this.dateKeys) {
            this.months = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
            this.fuseMonth = new Fuse(this.months, { threshold: 0.3, distance: 2 });
            this.dateKeys = [
                {
                    name: "year",
                    convert: function (q) { return 999 < q && parseInt(q) },
                },
                {
                    name: "month",
                    convert: function (q) { return isNaN(q) && q.length > 2 && this.fuseMonth.search(q)[0] + 1 }.bind(this),
                },
                {
                    name: "month",
                    convert: function (q) { return 0 < q && q < 13 && parseInt(q); }, // can make this run conditionally with a second arg
                },
                {
                    name: "day",
                    convert: function (q) { return 0 < q && q < 32 && parseInt(q) },
                }
            ]
        }
        var queries = query.replace(/-/g, " ").replace(/\//g, " ").split(" ");
        var data = this.data;
        for (var j = 0; j < this.dateKeys.length; j++) {
            var k = this.dateKeys[j];
            for (var i = 0; i < queries.length; i++) {
                var q = k.convert(queries[i]);
                if (!q) continue;
                var match = data.filter(function (d) {
                    return q === d.date[k.name];
                })
                if (match.length) {
                    data = match;
                    break;
                }
            }
        }
        return data === this.data ? [] : data.map(function (r) { return r.id; });
    };

    Search.prototype.search = function () {
        var query = this.field.value;
        if (!query) return null;
        if (!this.fuse) return this.configure(this.search.bind(this));

        var dateResults = this.dateSearch(query);
        var results = dateResults && dateResults.length ? dateResults : this.fuse.search(query);
        var items = this.items;
        var matches = document.createDocumentFragment();
        results.forEach(function (id) {
            for (var i = 0; i < items.length; i++) {
                if (items[i].id === id) {
                    matches.appendChild(items[i]);
                    break;
                }
            }
        });
        if (this.info) {
            var n = results.length;
            this.info.innerText = "Search returned " + n + " result" + (n > 1 ? "s" : "") + " for '" + query + "'.";
            this.info.style.display = "";
        }
        removeChildren(this.outputContainer);
        this.outputContainer.appendChild(matches);
    };

    Search.prototype.searchQueryString = function () {
        var qs = new URLSearchParams(window.location.search);
        this.field.value = qs.get(this.field.name);
        this.search();
    };

    Search.prototype.setQueryString = function () {
        var qs = new URLSearchParams;
        qs.set(this.field.name, this.field.value);
        pushQuery(qs);
    };

    Search.prototype.addListeners = function () {
        this.form.addEventListener("submit", function(event) {
            event.preventDefault();
            this.search();
            this.setQueryString();
        }.bind(this))
        window.addEventListener("popstate", this.searchQueryString.bind(this));
    };

    searchObjects.forEach(function (obj) {
        obj.searchQueryString();
        obj.addListeners();
    });

/*
 * Analytics
 */

    var analyticsObjects = toArray(document.querySelectorAll("[data-analytics-category][data-analytics-action][data-analytics-label]"));
    analyticsObjects = analyticsObjects.map(function (e) {
        return new AnalyticsEventObj(e);
    });

    function AnalyticsEventObj(element) {
        this.element = element;
        this.category = element.getAttribute("data-analytics-category");
        this.action = element.getAttribute("data-analytics-action");
        this.label = element.getAttribute("data-analytics-label");
        this.new_tab = element.getAttribute("target") === "_blank";
    }

    if (jekyllEnv === "production") {
        AnalyticsEventObj.prototype.send = function () {
            var callback = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function () {};
            ga("send", "event", this.category, this.action, this.label, {
                "hitCallback": callback
            });
        };
    } else {
        AnalyticsEventObj.prototype.send = function (callback) {
            var cbString = callback ? ', {\n    "hitCallback": ' + callback + '\n}' : '';
            console.log('Google Analytics Event: ga("send", "event", "%s", "%s", "%s"%s)', this.category, this.action, this.label, cbString);
            callback ? callback() : undefined;
        };
    }

    AnalyticsEventObj.prototype.addListener = function () {
        if (this.element instanceof HTMLIFrameElement && this.action === "click") {
            this.listener = iFrameClickEventListener.bind(null, this);
            window.addEventListener("blur", this.listener, passive);
        } else if (this.action === "click") {
            this.listener = linkClickEventListener.bind(null, this);
            this.element.addEventListener("click", this.listener);
        } else if (this.action === "view") {
            this.listener = scrollToViewEventListener.bind(null, this);
            win.addEventListener("scroll", this.listener, passive);
        }
    };

    function linkClickEventListener(eventObj, event) {
        if (window.origin == eventObj.element.origin || eventObj.new_tab) {
            eventObj.send();
        } else {
            event.preventDefault();
            var linkFollowed = false;
            var followLink = function () {
                if (!linkFollowed) {
                    linkFollowed = true;
                    window.open(eventObj.element.href, eventObj.element.target);
                }
            };
            window.setTimeout(followLink, 1000);
            eventObj.send(followLink);
        }
    }

    function scrollToViewEventListener(eventObj) {
        if (distToBottom(eventObj.element) <= 0) {
            eventObj.send();
            win.removeEventListener("scroll", eventObj.listener, passive);
        }
    }

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

    function addCollapsibleMenuListeners() {
        collapsibleMenus.forEach(function (menu) {
            menu.addListeners();
        });
    }

    function addOrientationChangeListener() {
        var initOrientation = window.innerHeight > window.innerWidth;
        if (fullscreenElements.length > 0) {
            window.addEventListener("resize", function () {
                var newOrientation = window.innerHeight > window.innerWidth;
                if (newOrientation !== initOrientation) {
                    forceFullscreenAll();
                }
                initOrientation = newOrientation;
            }, passive);
        }
    }

    var elementsToHideOnScroll = toArray(document.querySelectorAll("[data-hide-on-scroll]"));

    function addHideOnScrollListener() {
        win.addEventListener("scroll", function hideOnScroll() {
            var stop = this.removeEventListener.bind(this, "scroll", hideOnScroll, false);
            if (elementsToHideOnScroll.length === 0) {
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

    objectFitImages();
    if (fixedHeader) fixedHeader.addListeners();
    addCollapsibleMenuListeners();

    if (Object.keys(smoothLinks).length && pageScrollBehavior !== "smooth") {
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
            if (object.action === "view") {
                window.addEventListener("load", function () {
                    if (distToBottom(object.element) > 0) {
                        object.addListener();
                    }
                });
            } else {
                object.addListener();
            }
        });
    }

{% unless jekyll.environment == "development" %}
})();
{% endunless %}
