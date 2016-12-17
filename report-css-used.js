/**
 * Marks all the css rules that are used in given stylesheets.
 * This helps detect unused rules that can then be removed.
 * This will go over the given stylesheets, and each time one of the rules applies it will add it to the set. 
 *  Thus, in order to have the best results it is better to use this script before the wanted DOM parts are painted.
 * 
 * @param {RegExp} sheetsToCheckRegex The stylesheets that their url matches the RegExp
 * @param {Document=} document
 * @returns {Set<string>} List of css rules that are in use
 */
function findCssUsed (sheetsToCheckRegex, document) {
    // rules: we hold only the last part of the selector as the key, and the full selector as an array list. FOR EXAMPLE => the selector "body .temp img" the object will look like {img: ["body .temp img"]}
    var rules = {},
        result = new Set(),
        obs = new MutationObserver(obsCallback);

    createRulesFromStylesheets(document.styleSheets);

    // tell the observer to watch for any DOM changes that include: add, remove, class or id
    obs.observe(document, {
        childList: true,
        attributeFilter: ["class", "id"],
        subtree: true
    });

    return result;

    /**
     * Creates the rules object from the stylesheets.
     * The rules object is an object that each selector ("body .title" for example) will be in an array, and the key will be the last selector.
     * For example, it might look like this: rules: { "title": ["body .title", "div .title"] }
     * @param {Array} sheets List of the stylesheets in the document
     */
    function createRulesFromStylesheets(sheets) {
        for (var i in sheets) {
            if (!(sheets[i].href && sheets[i].href.match(sheetsToCheckRegex))) { // we don't want to check any non-related stylesheet
                continue;
            }
            loopOnRulesAndAddEachRule(sheets[i].cssRules);
        }

        /**
         * @param {Array} rules For example: ["body, .title img, a", "div"]
         */
        function loopOnRulesAndAddEachRule(rules) {
            for (var i in rules) {
                addRuleToRules(rules[i]);
            }
        }

        /**
         * If it's a media rule, loop again on the rules of the media.
         * If it's a normal style rule, split the rule by comas, and loop over the selectors that result
         * @param {Object} rule For example, "body, .title img, a"
         */
        function addRuleToRules(rule) {
            if (!rule.selectorText) { // a media or a font or a keyframe rule
                if (rule.cssRules) { // is a media
                    loopOnRulesAndAddEachRule(rule.cssRules);
                }
                return;
            }
            loopOnSelectors(rule.selectorText.split(', ')); // split selectors, for example: ".body a, .body div.class#id" => [".body a", ".body div.class#id"]
        }

        /**
         * @param {Array} selectors For example: ["body", ".title img", "a"]
         */
        function loopOnSelectors(selectors) {
            for (var i in selectors) { // loop over all selectors
                addSelectorToRules(selectors[i]);
            }
        }

        /**
         * Split the selector's last part and add each one to the rules list
         * @param {String} selector String For example: ".title img.class#id"
         */
        function addSelectorToRules(selector) {
            var selectorPath = selector.split(' '); // split the selector to parts, for example: ".body div.class#id" => [".body", "div.class#id"]
            var lastSelector = selectorPath[selectorPath.length - 1]; // only the last part of the selectors path
            if (selectorPath.length > 1 || lastSelector.match(/[.#]/)) { // skip tags only, like "div" or "a" - they are obviously used
                var classes = lastSelector.split(/[.#]/); // get only the name of the selector, for example: "div.class#id" => ["div", "class", "id"]
                for (var i in classes) {
                    addClassToRules(classes[i], selector);
                }
            }
        }

        /**
         * Validates the given name, and adds to the list
         * For example: ".title img.class#id" will get this function called 3 times, and it will add {img: ".title img.class#id"}, then {class: ".title img.class#id"} and then {id: ".title img.class#id"}
         * @param {String} className The name of one of the tag/class/id of the element. For example: "img".
         * @param {String} selector The full rule. For example
         */
        function addClassToRules(className, selector) {
            if (className && !className.match(/[:\*]/)) { // ignore empties and : (after and such)
                if (!rules[className]) { // if there is not list yet for the name, create one
                    rules[className] = [];
                }
                rules[className].push(selector); // for example: rules = { "div": [".body div.class#id"], "class": [".body div.class#id"], "id": [".body div.class#id"] }
            }
        }
    }


    /**
     * The function to run whenever the observer sees a change
     * @param {Array} mutations List of the changes
     */
    function obsCallback(mutations) {
        for (var i in mutations) {
            if (mutations[i].attributeName) { // class or id has changed
                writeNodeClasses(mutations[i].target);
            } else { // might have added a node!
                for (var j in mutations[i].addedNodes) {
                    addNodeClasses(mutations[i].addedNodes[j]);
                }
            }
        }

    }

    /**
     * Writes a node's Classes, ID and tag names to the object Rules, if they apply to the element
     * @param node
     */
    function writeNodeClasses(node) {
        for (var i in node.classList) { // classes
            addSelectorIfNodeMatchesRule(node, node.classList[i]);
        }
        addSelectorIfNodeMatchesRule(node, node.id); // id
        addSelectorIfNodeMatchesRule(node, node.localName); // tag name
    }

    /**
     * If the key is defined, check for each rule in the list of the rules for the given name (for example "body").
     * If a rule applies, add it to the result list
     * @param {Object} node DOM element
     * @param {String} key id/class/tag of the element
     */
    function addSelectorIfNodeMatchesRule(node, key) {
        if (key && rules[key]) { // only if the key exists in the node
            for (var i = 0; i < rules[key].length; i++) {
                if (node.matches(rules[key][i])) {
                    result.add(rules[key][i]);
                }
            }
        }
    }

    /**
     * Tries to add the classes/id/tag of the element if there are rules that apply to it.
     * Then it iterates on the children of the node, and checks each one recursively.
     * @param {Object} node The target element
     */
    function addNodeClasses(node) {
        writeNodeClasses(node);
        for (var i in node.children) { // recursively write classes of each child
            addNodeClasses(node.children[i]);
        }
    }
}
