/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

function i18nParse() {
    i18nParseRegular();
    i18nParseTooltips();
    i18nParseImageAlt();
}

function i18nParseRegular() {
    const elements = document.querySelectorAll('[data-i18n]');
    for (const e of elements) {
        const placeholders = [];

        if (e.dataset.i18nPlaceholders) {
            for (const placeholder of e.dataset.i18nPlaceholders.split(',')) {
                placeholders.push(
                    browser.i18n.getMessage(placeholder.trim())
                );
            }
        }

        e.textContent = browser.i18n.getMessage(e.dataset.i18n, placeholders);
    }
}

function i18nParseTooltips() {
    const elements = document.querySelectorAll('[data-i18n-tooltip]');
    for (const e of elements) {
        const placeholders = [];

        if (e.dataset.i18nPlaceholders) {
            for (const placeholder of e.dataset.i18nTooltipPlaceholders.split(',')) {
                placeholders.push(
                    browser.i18n.getMessage(placeholder.trim())
                );
            }
        }

        e.title = browser.i18n.getMessage(e.dataset.i18nTooltip, placeholders);
    }
}

function i18nParseImageAlt() {
    const elements = document.querySelectorAll('[data-i18n-alt]');
    for (const e of elements) {
        const placeholders = [];

        if (e.dataset.i18nPlaceholders) {
            for (const placeholder of e.dataset.i18nAltPlaceholders.split(',')) {
                placeholders.push(
                    browser.i18n.getMessage(placeholder.trim())
                );
            }
        }

        e.alt = browser.i18n.getMessage(e.dataset.i18nAlt, placeholders);
    }
}