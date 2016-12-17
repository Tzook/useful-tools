(function (namespace) {
    'use strict';

    var TAB_KEY_CODE = 9;
    var ESC_KEY_CODE = 27;
    var FOCUS_CLASS = 'tab_focus';

    /***********************************
     Tabs highlighter
     Adds a class to the body when
        tab is clicked.
     Removes the class when the mouse
        moves.
     ***********************************/
    namespace.Highlighter = function () {
        var _$body,
            _document;

        /**
         * Listens to keyup and calls a function when clicked
         */
        function setListener() {
            _$body.on('keyup', attachIfTab);
        }

        /**
         * Performs the class attachment if the key pressed was tab, and stops listening for it
         * @param {KeyboardEvent} event
         */
        function attachIfTab(event) {
            if (event.which === TAB_KEY_CODE) {
                attach();
                _$body.off('keyup', attachIfTab);
            }
        }

        /**
         * Listens to see if user clicking escape.
         * If he did - blur and detach
         * @param {KeyboardEvent} e
         */
        function blurIfEsc(e) {
            if (e.which === ESC_KEY_CODE) {
                _document.activeElement.blur();
                detach();
            }
        }


        /**
         * Adds the focus class to body, and waits for mouse movement to remove the class
         */
        function attach() {
            _$body.addClass(FOCUS_CLASS);
            _$body.on('mousemove', detach);
            _$body.on('keyup', blurIfEsc);
        }

        /**
         * Removes the class from body, stops listening for mouse movement and start listening for keyboard clicks
         */
        function detach() {
            _$body.off('mousemove', detach);
            _$body.off('keyup', blurIfEsc);
            _$body.removeClass(FOCUS_CLASS);
            setListener();
        }

        /***************
         Public interface
         ***************/

        /**
         * @usage
         * var highlighter = new accesibility.Highlighter(jQuery('body'), document)
         * highlighter.init();
         * 
         * And then in the css add:
         *   .tab_focus *:focus {
         *       box-shadow: 0 0 4px 2px rgba(0, 0, 0, 0.3);
         *   }
         * @param {Object} $body
         * @param {Document} doc
         */
        this.init = function ($body, doc) {
            _$body = $body;
            _document = doc;
            setListener();
        };
    };
})(window.accesibility = window.accesibility || {});
