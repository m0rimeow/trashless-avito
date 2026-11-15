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
// @version      1.0
// @license      MIT
// ==/UserScript==

(function () {
  'use strict';

  const RESERVED_TEXT = 'Забронировано';
  const VIEWED_TEXT = 'Просмотрено';
  const HIDE_ATTR = 'data-mori-hidden';
  const DIM_ATTR = 'data-mori-dim';
  const HIDE_ADS = true;
  const DIM_OPACITY = 0.4; // lower = more faded

  const CARD_SELECTORS = [
    '[data-marker="item"]',
    '[data-marker="bx-recommendations-block-item"]'
  ].join(', ');

  const CELL_SELECTOR = '[class*="compactGridItem"]';

  const style = document.createElement('style');
  style.textContent = `
    [${HIDE_ATTR}] { display: none !important; }
    [${DIM_ATTR}] { opacity: ${DIM_OPACITY}; transition: opacity .15s; }
    [${DIM_ATTR}]:hover { opacity: 1; }
    ${HIDE_ADS ? '[class*="compactGridItem"][class*="adv-"] { display: none !important; }' : ''}
  `;
  document.head.appendChild(style);

  // collect the badge texts of a card, e.g. ["Просмотрено", "Забронировано"]
  function badgeTexts(card) {
    return Array.from(card.querySelectorAll('[class*="textBadgeContent"]'))
      .map((b) => b.textContent.trim());
  }

  function setAttr(el, name, on) {
    if (on && !el.hasAttribute(name)) el.setAttribute(name, '');
    else if (!on && el.hasAttribute(name)) el.removeAttribute(name);
  }

  function update() {
    document.querySelectorAll(CARD_SELECTORS).forEach((card) => {
      const target = card.closest(CELL_SELECTOR) || card;
      const badges = badgeTexts(card);
      setAttr(target, HIDE_ATTR, badges.includes(RESERVED_TEXT));
      setAttr(target, DIM_ATTR, badges.includes(VIEWED_TEXT));
    });
  }

  update();

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