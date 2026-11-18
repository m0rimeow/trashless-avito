// ==UserScript==
// @name         Trashless Avito
// @namespace    https://estradiol.rocks/
// @author       Mori
// @description  Hides reserved and dims viewed items, hides empty ad slots
// @description:ru Убирает объявления с "Забронировано" и затемняет объявления с "Просмотрено", убирает пустые места
// @updateURL    https://raw.githubusercontent.com/m0rimeow/trashless-avito/main/avito-without-trash.user.js
// @downloadURL  https://raw.githubusercontent.com/m0rimeow/trashless-avito/main/avito-without-trash.user.js
// @include       http://avito.ru/*
// @include       https://avito.ru/*
// @include       http://*.avito.ru/*
// @include       https://*.avito.ru/*
// @grant        none
// @run-at       document-idle
// @noframes
// @version      1.1
// @license      MIT
// ==/UserScript==

(function () {
    "use strict";

    // ---------- settings ----------
    const HIDE_RESERVED = true; // hide "Забронировано" listings
    const DIM_VIEWED = true; // dim "Просмотрено" listings
    const DIM_OPACITY = 0.1; // lower = more faded (viewed cards light up on hover)
    const HIDE_ADS = true; // hide ad cells in the listings grid
    const HIDE_TOP_BANNER = true; // hide the promo bar at the top of the page
    const HIDE_CATEGORY_TILES = true; // big category grid on the homepage
    const HIDE_BUSINESS_BLOCK = true; // "Всё для бизнеса" box on the right
    const HIDE_HEADER_LINKS = true; // "Карьера в Авито" and "#яПомогаю" in the top nav

    // ---------- constants ----------
    const RESERVED_TEXT = "Забронировано";
    const VIEWED_TEXT = "Просмотрено";
    const HIDE_ATTR = "data-mori-hidden";
    const DIM_ATTR = "data-mori-dim";

    // outer boxes of listing cards (search, homepage recommendations)
    const CARD_SELECTORS = ['[data-marker="item"]', '[data-marker="bx-recommendations-block-item"]'].join(", ");

    // grid cell that wraps a card on the homepage
    const CELL_SELECTOR = '[class*="compactGridItem"]';

    const BANNER_CLOSE = '[data-marker="top-banner/close-button"]';

    // ---------- CSS (does the actual hiding, so React can't easily undo it) ----------
    const css = [
        `[${HIDE_ATTR}] { display: none !important; }`,
        `[${DIM_ATTR}] { opacity: ${DIM_OPACITY}; transition: opacity .15s; }`,
        `[${DIM_ATTR}]:hover { opacity: 1; }`,
    ];
    if (HIDE_ADS) {
        css.push('[class*="compactGridItem"][class*="adv-"] { display: none !important; }');
    }
    if (HIDE_TOP_BANNER) {
        // hide the element that directly contains the banner's close button
        css.push(`div:has(> span > ${BANNER_CLOSE}) { display: none !important; }`);
    }
    if (HIDE_CATEGORY_TILES) {
        css.push('[data-marker="visual-rubricator"] { display: none !important; }');
    }
    if (HIDE_BUSINESS_BLOCK) {
        css.push('[data-marker="side-block"] { display: none !important; }');
        // also collapse the right-hand column, so it doesn't leave an empty strip
        css.push('[class*="sideContent_main"]:has([data-marker="side-block"]) { display: none !important; }');
    }
    if (HIDE_HEADER_LINKS) {
        const nav = '[data-marker="header/navbar"]';
        css.push(`
    /* normal nav: hide the whole <li> so no empty gap is left */
    ${nav} li:has(> a[href*="career.avito.com"]),
    ${nav} li:has(> a[href*="avito-care"]),
    /* copies inside the "Ещё" dropdown: hide the link itself */
    ${nav} a[href*="career.avito.com"],
    ${nav} a[href*="avito-care"] { display: none !important; }
  `);
    }

    const style = document.createElement("style");
    style.textContent = css.join("\n");
    document.head.appendChild(style);

    // ---------- listings ----------
    function badgeTexts(card) {
        return Array.from(card.querySelectorAll('[class*="textBadgeContent"]')).map((b) => b.textContent.trim());
    }

    function setAttr(el, name, on) {
        if (on && !el.hasAttribute(name)) el.setAttribute(name, "");
        else if (!on && el.hasAttribute(name)) el.removeAttribute(name);
    }

    function updateListings() {
        document.querySelectorAll(CARD_SELECTORS).forEach((card) => {
            const target = card.closest(CELL_SELECTOR) || card;
            const badges = badgeTexts(card);
            setAttr(target, HIDE_ATTR, HIDE_RESERVED && badges.includes(RESERVED_TEXT));
            setAttr(target, DIM_ATTR, DIM_VIEWED && badges.includes(VIEWED_TEXT));
        });
    }

    // ---------- top banner ----------
    // also "click" the close button so Avito knows it was dismissed
    const clickedButtons = new WeakSet();

    function dismissTopBanner() {
        if (!HIDE_TOP_BANNER) return;
        const btn = document.querySelector(BANNER_CLOSE);
        if (!btn || clickedButtons.has(btn)) return;
        clickedButtons.add(btn);
        const target = btn.closest("span") || btn;
        target.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    }

    // ---------- main loop ----------
    function update() {
        // each part is wrapped, so a failure in one never stops the others
        try {
            updateListings();
        } catch (e) {
            console.warn("[Trashless Avito] listings:", e);
        }
        try {
            dismissTopBanner();
        } catch (e) {
            console.warn("[Trashless Avito] banner:", e);
        }
    }

    update();

    // re-run whenever the page changes (infinite scroll, filters, lazy blocks)
    let scheduled = false;
    new MutationObserver(() => {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
            scheduled = false;
            update();
        });
    }).observe(document.body, { childList: true, subtree: true });
})();
