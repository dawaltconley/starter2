---
---

(function() {

    let page = document.querySelector(".parallax-page");
    let win = page;

    if (!page) {
        page = document.body;
        win = window;
    }

/*
 * General-purpose functions
 */

    const toArray = function (collection) {
        return Array.prototype.slice.call(collection);
    }

    const getTransitionTime = function (element, ...properties) {
        let dur = 0;
        const transition = window.getComputedStyle(element).getPropertyValue("transition").split(", ");
        if (properties.length > 0) {
            properties.forEach( function (property) {
                transition.forEach( function (transitionSet) {
                    let propertyMatch = new RegExp("(\\s|^)" + property + "(\\s|$)");
                    if (transitionSet.search(propertyMatch) >= 0) {
                        transitionSet.split(" ").forEach( function (value) {
                            if (value.search(/\ds$/) >= 0) {
                                const seconds = Number(value.replace("s", ""));
                                dur += seconds;
                            }
                        });
                    }
                });
            });
        } else {
            let durElement, durSet = [];
            transition.forEach( function (transitionSet) {
                durElement = 0;
                transitionSet.split(" ").forEach( function (value) {
                    if (value.search(/\ds$/) >= 0) {
                        const seconds = Number(value.replace("s", ""));
                        durElement += seconds;
                    }
                });
                durSet.push(durElement);
            });
            dur = Math.max.apply(null, durSet);
        }
        return dur * 1000;
    }

    const scrollBottom = function (element) { //opposite of .scrollTop: measures dist between bottom of view and bottom of element
        const elementBottom = element.scrollHeight;
        const viewBottom = element.scrollTop + element.clientHeight;
        return elementBottom - viewBottom;
    }

    const getParentBySelector = function (element, selector) {
        let ancestor = element;
        while (ancestor != document.body) {
            ancestor = ancestor.parentElement;
            if (Sizzle.matchesSelector(ancestor, selector)) {
                return ancestor;
            }
        }
        return null;
    }

    const getChildBySelector = function (element, selector) {
        for (var i = 0; i < element.children.length; i++) {
            const child = element.children[i];
            if (Sizzle.matchesSelector(child, selector)) {
                return child;
            } else if (child.children.length) {
                const childMatch = getChildBySelector(child, selector);
                if (childMatch) {return childMatch;}
            }
        }
        return null;
    }

    const getChildrenBySelector = function (element, selector) {
        let matches = [];
        for (var i = 0; i < element.children.length; i++) {
            const child = element.children[i];
            if (Sizzle.matchesSelector(child, selector)) {
                matches.push(child);
            }
            if (child.children.length) {
                const childMatch = getChildrenBySelector(child, selector);
                if (childMatch) {
                    childMatch.forEach( function (match) {
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
    }

    const clearClass = function (string) {
        let className;
        if (string.charAt(0) === ".") {
            className = string.slice(1);
        } else {
            className = string;
        }
        const allOfClass = toArray(document.querySelectorAll("." + className));
        allOfClass.forEach( function (element) {
            element.classList.remove(className);
        });
    }

    const contentWidth = function (element) {
        const elementStyle = window.getComputedStyle(element);
        const elementPadding = parseInt(elementStyle.getPropertyValue("padding-left")) + parseInt(elementStyle.getPropertyValue("padding-right"));
        return element.clientWidth - elementPadding;
    }

    const contentHeight = function (element) {
        const elementStyle = window.getComputedStyle(element);
        const elementPadding = parseInt(elementStyle.getPropertyValue("padding-top")) + parseInt(elementStyle.getPropertyValue("padding-bottom"));
        return element.clientHeight - elementPadding;
    }

    const parseBoolean = function (string) {
        if (string == "true") {
            return true;
        } else {
            return false;
        }
    }

/*
 * Scrolling
 */

    const pageScrollBehavior = window.getComputedStyle(page).getPropertyValue("scroll-behavior");
    const smoothLinks = toArray(document.querySelectorAll('[data-scroll="smooth"]'));

    const getHash = function (element) { //should remove, not using
        const elementClass = Object.prototype.toString.call(element);
        if (elementClass == "[object SVGAElement]") {
            const link = element.href.baseVal;
            return link.slice(link.search("#"));
        } else if (elementClass == "[object HTMLAnchorElement]") {
            return element.hash;
        } else {
            return null;
        }
    }

    const smoothScrollToTop = function () {
        win.scroll({
            top: 0,
            behavior: "smooth"
        });
    }

    const smoothScrollTo = function (element) {
        element.scrollIntoView({
            behavior: "smooth"
        });
    }

    const smoothScrollToLinkTarget = function (link) {
        const hash = getHash(link);
        const target = document.querySelector(hash);
        window.history.pushState({ hasFocus: hash }, hash.slice(1), hash);
        smoothScrollTo(target);
    }

/*
 * Fullscreen
 */

    const fullscreenElements = toArray(document.querySelectorAll('[data-script="force-fullscreen"]'));

    const forceFullscreen = function (element) {
        const viewHeight = window.innerHeight;
        if (element.clientHeight != viewHeight) {
            element.style.height = viewHeight;
            console.log("resizing");
        }
    }

    const forceFullscreenAll = function () {
        fullscreenElements.forEach( function (element) {
            forceFullscreen(element);
        });
    }


/*
 * Event Listeners
 */

    const addSmoothScrollListeners = function () {
        if (pageScrollBehavior == "smooth") {return false};
        smoothLinks.forEach( function (link) {
            link.addEventListener("click", function (event) {
                event.preventDefault();
                smoothScrollToLinkTarget(link);
            }, false);
        });
    }

    const addPopStateListener = function () {
        window.addEventListener("popstate", function () {
            if (event.state) {
                const target = document.querySelector(event.state.hasFocus);
                smoothScrollTo(target);
            } else {
                smoothScrollToTop();
            }
        }, { passive: true });
    }

    let elementsToHideOnScroll = toArray(document.querySelectorAll('[data-script="hide-on-scroll"]'));

    const addPageScrollListener = function () {
        win.addEventListener("scroll", function hideOnScroll() {
            const stop = this.removeEventListener.bind(this, "scroll", hideOnScroll, false);
            if (elementsToHideOnScroll.length == 0) {
                stop();
            } else {
                elementsToHideOnScroll.forEach( function (element, i) {
                    if (element.getBoundingClientRect().bottom < 0) {
                        element.style.display = "none";
                        elementsToHideOnScroll.splice(i, 1);
                    }
                });
            }
        }, { passive: true });
    }

    const addWindowResizeListener = function () {
        let initHeight = window.innerHeight;
        if (fullscreenElements.length > 0) {
            window.addEventListener("resize", function () {
                let newHeight = window.innerHeight;
                if (newHeight != initHeight) {
                    initHeight = newHeight;
                    forceFullscreenAll();
                    console.log(newHeight);
                }
            }, { passive: true });
        }
    }

    addSmoothScrollListeners();
    addPopStateListener();
    addPageScrollListener();
    forceFullscreenAll();
    addWindowResizeListener();

})();
