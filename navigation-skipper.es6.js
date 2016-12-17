const TAB_KEY_CODE = 9;
const ENTER_KEY_CODE = 13;
const SPACE_KEY_CODE = 32;
const ACTIVITY_NAME = 'Accessibility.SkipNavigationUsages';

/**
 * @name NavigationSkipper
 *
 * @description
 * Inserts a hidden button to the body, which will be shown as soon as someone clicks tab, as the first focus element.
 * If the user clicks on it - focus the first focusable element in the main section
 *
 * @usage
 *  let navigationSkipper = new NavigationSkipper(jQuery('body'), usageLogger);
 *  navigationSkipper.setMainContentSelector('#main_content');
 *  if (navigationSkipper.isEnabled()) {
 *     navigationSkipper.createSkipElement('button');
 *     navigationSkipper.setSkipText('Skip navigation');
 *     navigationSkipper.setSkipAttribute('id', 'skip_to_main');
 *     navigationSkipper.setSkipAttribute('tabindex', 1);
 *     navigationSkipper.attachEventsToElement();
 *     navigationSkipper.insertSkipElementToBody();
 *  }
 * 
 * And add the css rules as following:
 * 
 *  #skip_to_main {
 *      position: absolute;
 *      #{$start}: 4px;
 *      top: 4px;
 *      outline: 0;
 *      z-index: -1;
 *      opacity: 0;
 *      &::-moz-focus-inner {
 *          border: 0;
 *      }
 *  }
 *  #skip_to_main:focus {
 *      z-index: 1;
 *      opacity: 1;
 *  }
 */
export class NavigationSkipper {
    /**
     * @param {jQuery} $body
     * @param {Function} usageLogger
     */
    constructor($body, usageLogger) {
        this.$body = $body;
        this.usageLogger = usageLogger;
    }

    /**
     * Attaches the event to the skip element, and acts upon it
     */
    attachEventsToElement() {
        var focusFirstElement = () => {
            this.$skip.blur();
            let $firstItem = jQuery(`${this.mainContentSelector} :tabbable${this.selectorsToNotFocus || ''}`).first();
            if ($firstItem.length === 1) { // if found an element
                $firstItem[0].focus();
                this.$body.trigger(jQuery.Event('keyup', {which: TAB_KEY_CODE}));
            }
            this.usageLogger(ACTIVITY_NAME);
        };

        this.$skip
            .keyup(e => {
                if (e.which === ENTER_KEY_CODE || e.which === SPACE_KEY_CODE) {
                    focusFirstElement();
                }
            })
            .mouseup(focusFirstElement);
    }

    /**
     * Creates the skip button element
     */
    createSkipElement(tagName) {
        this.$skip = jQuery(`<${tagName}></${tagName}>`);
    }

    /**
     * Inserts the skip element to the body
     */
    insertSkipElementToBody() {
        this.$body.prepend(this.$skip);
    }

    /**
     * Sets an attribute on the skip element
     * @param {string} attribute
     * @param {string|int} value
     */
    setSkipAttribute(attribute, value) {
        this.$skip.attr(attribute, value);
    }

    /**
     * Sets the text on the skip element
     * @param {string} text
     */
    setSkipText(text) {
        this.$skip.text(text);
    }

    /**
     * Sets the selector of the main content
     * @param {string} selector '#main_content' for example
     */
    setMainContentSelector(selector) {
        this.mainContentSelector = selector;
    }

    /**
     * Sets the selectors that should not be focused when focusing the first element in main
     * @param {Array} selectors ['input', 'textarea'] for example
     */
    setSelectorsToNotFocus(selectors) {
        if (selectors.length > 0) {
            // will transform ['a', 'b'] to ':not(a):not(b)'
            this.selectorsToNotFocus = `:not(${selectors.join('):not(')})`;
        }
    }

    /**
     * Determines if the feature is open or not.
     * Only if the main content exists, it can focus on it.
     * @returns {boolean}
     */
    isEnabled() {
        return jQuery(this.mainContentSelector).length === 1;
    }
}
