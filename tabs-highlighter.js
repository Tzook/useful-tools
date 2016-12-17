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


// SPEC:
describe('accessibility package - Highlighter', function () {
    var highlighter,
        $body,
        doc;

    beforeEach(function () {
        $body = jQuery('<div></div>');
        doc = {activeElement: jasmine.createSpyObj('activeElement', ['blur'])};
        highlighter = new window.accessibility.Highlighter();
        highlighter.init($body, doc);
    });

    describe('init', function () {
        it('should not do anything to body if on init', function() {
            expect($body[0].className).toBe('');
        });
        it('should add class to body on focus', function () {
            $body.trigger(jQuery.Event('keyup', {which: 9}));
            expect($body[0].className).toBe('tab_focus');
        });

        it('should remove the class after mouse movement', function() {
            $body.trigger(jQuery.Event('keyup', {which: 9}));
            $body.mousemove();
            expect($body[0].className).toBe('');
        });

        it('should add the class again after mouse movement and clicking tab', function() {
            $body.trigger(jQuery.Event('keyup', {which: 9}));
            $body.mousemove();
            $body.trigger(jQuery.Event('keyup', {which: 9}));
            expect($body[0].className).toBe('tab_focus');
        });

        it('should still have the class after clicking tab multiple times', function() {
            $body.trigger(jQuery.Event('keyup', {which: 9}));
            $body.trigger(jQuery.Event('keyup', {which: 9}));
            expect($body[0].className).toBe('tab_focus');
        });

        it('should blur when clicking esc', function() {
            $body.trigger(jQuery.Event('keyup', {which: 9}));
            $body.trigger(jQuery.Event('keyup', {which: 27}));
            expect(doc.activeElement.blur).toHaveBeenCalled();
            expect($body[0].className).toBe('');
        });
    });
});
