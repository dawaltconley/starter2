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

/*
 * Scrolling
 */

    const pageScrollBehavior = window.getComputedStyle(page).getPropertyValue("scroll-behavior");
    const smoothLinks = toArray(document.querySelectorAll('[data-scroll="smooth"]'));

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
        const hash = link.hash;
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
            if (element.classList.contains("fullscreen-fixed")) {
                element.style.height = viewHeight.toString() + "px";
            } else if (element.classList.contains("fullscreen")) {
                element.style.minHeight = viewHeight.toString() + "px";
            }
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

    addSmoothScrollListeners();
    addPopStateListener();
    addPageScrollListener();
    forceFullscreenAll();

})();
