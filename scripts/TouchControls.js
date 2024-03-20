/**
 * Purpose: This file provides touch controls to the drag and drop game on the website
 * 
 * Author(s) / Work Done: Basel Allam - Added the touch controls to the game
 *                        ChatGPT - I uesd it to start getting ideas and where to look for documentation and examples like a better google search,
 *                                  also asked for code snippets but they were all wrong in the sense they didn't work with the rest of the code
 *                                  as I didnt give it enough context, but with drastic changes some stuff worked
 */

/*
Defining the module Touch Controls using an IIFE (Immediately invoked function expression) which is a function that is 
immediatly called after its defined
*/
let TouchControls;

(function (FuncTouchControls) {
    'use strict';

    /**
     * Define the Data Transfer Class to control data during dragging or dropping
     * Hold one or more different data types to be drag and dropped
     */
    let DataTransfer = (function () {
        function DataTransfer() {
            this._dropEffect = 'move';
            this._effectAllowed = 'all';
            this._data = {};
        }

        //Defining a getter and a setter for the drop effect
        Object.defineProperty(DataTransfer.prototype, "dropEffect", {
            get: function () {
                return this._dropEffect;
            },
            set: function (value) {
                this._dropEffect = value;
            },
            enumerable: true,
            configurable: true
        });

        //Defining a getter and a setter for the allowed effect
        Object.defineProperty(DataTransfer.prototype, "effectAllowed", {
            get: function () {
                return this._effectAllowed;
            },
            set: function (value) {
                this._effectAllowed = value;
            },
            enumerable: true,
            configurable: true
        });

        //Defining a getter for types
        Object.defineProperty(DataTransfer.prototype, "types", {
            get: function () {
                return Object.keys(this._data);
            },
            enumerable: true,
            configurable: true
        });

        /**
         * Defining a function to clear data in a give type
         * 
         * @param {*} type The type of data to remove
         */
        DataTransfer.prototype.clearData = function (type) {
            if (type !== null) {
                delete this._data[type.toLowerCase()];
            }
            else {
                this._data = {};
            }
        };

        /**
         * Defining a funciton to get the data of a given type
         * 
         * @param {*} type The type of data to get back
         * @returns The new data
         */
        DataTransfer.prototype.getData = function (type) {
            let lcType = type.toLowerCase(),
                data = this._data[lcType];
            if (lcType === "text" && data == null) {
                data = this._data["text/plain"];
            }
            return data || "";
        };

        /**
         * Defining a function to set the data of agiven type
         * 
         * @param {*} type The type of data to set to
         * @param {*} value The data to add to the type
         */
        DataTransfer.prototype.setData = function (type, value) {
            this._data[type.toLowerCase()] = value;
        };

        /**
         * Defining a function to set the image that is being dragged
         * 
         * @param {*} img The image being dragged
         * @param {*} offsetX The horizontal offset of the image being dragged
         * @param {*} offsetY The vertical offset of the image being dragged
         */
        DataTransfer.prototype.setDragImage = function (img, offsetX, offsetY) {
            let ddt = TouchControls._instance;
            ddt._imgCustom = img;
            ddt._imgOffset = { x: offsetX, y: offsetY };
        };
        return DataTransfer;
    }());

    FuncTouchControls.DataTransfer = DataTransfer;

    /**
     * Defining a touch controls class to convert HTML 5 drag and drop api calls and adds touch controls to them
     * The class listens to touch events inputted by the user and converts them to drag & drop events
     */
    let TouchControls = (function () {

        /**
         * Constructor for the touch controls graph
         */
        function TouchControls() {
            this._lastClick = 0;

            //Throwing an error to make sure we only have one touch control instance running at a time
            if (TouchControls._instance) {
                throw 'TouchControls instance already created.';
            }

            // Testing to see if the browser supports passive event listeners
            let supportsPassive = false;
            document.addEventListener('test', function () { }, {
                get passive() {
                    supportsPassive = true;
                    return true;
                }
            });

            //Adding the touch controls event listeners if the browser supports them
            if (navigator.maxTouchPoints) {
                let d = document,
                    ts = this._touchstart.bind(this),
                    tm = this._touchmove.bind(this),
                    te = this._touchend.bind(this),
                    opt = supportsPassive ? { passive: false, capture: false } : false;
                d.addEventListener('touchstart', ts, opt);
                d.addEventListener('touchmove', tm, opt);
                d.addEventListener('touchend', te);
                d.addEventListener('touchcancel', te);
            }
        }

        /**
         * A static method to get the instance of touch controls
         * 
         * @returns instance of touch controls
         */
        TouchControls.getInstance = function () {
            return TouchControls._instance;
        };

        /**
         * Defining a function to handle the event touch start
         * 
         * @param {*} e element to handle
         */
        TouchControls.prototype._touchstart = function (e) {
            let _this = this;
            if (this._shouldHandle(e)) {

                //Clearing all the data
                this._reset();

                //Finding the nearest draggable element
                let src = this._closestDraggable(e.target);
                if (src) {

                    if (!this._dispatchEvent(e, 'mousemove', e.target) &&
                        !this._dispatchEvent(e, 'mousedown', e.target)) {

                        this._dragSource = src;
                        this._ptDown = this._getPoint(e);
                        this._lastTouch = e;

                        setTimeout(function () {
                            if (_this._dragSource === src && _this._img === null) {
                                if (_this._dispatchEvent(e, 'contextmenu', src)) {
                                    _this._reset();
                                }
                            }
                        }, TouchControls._CTXMENU);
                        if (TouchControls._ISPRESSHOLDMODE) {
                            this._pressHoldInterval = setTimeout(function () {
                                _this._isDragEnabled = true;
                                _this._touchmove(e);
                            }, TouchControls._PRESSHOLDAWAIT);
                        }
                    }
                }
            }
        };

        /**
         * Defining a function to handle the event touch move
         * 
         * @param {*} e element to handle 
         */
        TouchControls.prototype._touchmove = function (e) {
            if (this._shouldCancelPressHoldMove(e)) {
                this._reset();
                return;
            }
            if (this._shouldHandleMove(e) || this._shouldHandlePressHoldMove(e)) {

                let target = this._getTarget(e);
                //Checking if the target is moving
                if (this._dispatchEvent(e, 'mousemove', target)) {
                    this._lastTouch = e;
                    e.preventDefault();
                    return;
                }

                //Starting the drag
                if (this._dragSource && !this._img && this._shouldStartDragging(e)) {
                    //If drag is cancelled stop it
                    if (this._dispatchEvent(this._lastTouch, 'dragstart', this._dragSource)) {
                        this._dragSource = null;
                        return;
                    }
                    this._createImage(e);
                    this._dispatchEvent(e, 'dragenter', target);
                }

                //Keep dragging if the drag countinues
                if (this._img) {
                    this._lastTouch = e;
                    //Preventing scrolling while dragging
                    e.preventDefault();
                    this._dispatchEvent(e, 'drag', this._dragSource);
                    if (target !== this._lastTarget) {
                        this._dispatchEvent(this._lastTouch, 'dragleave', this._lastTarget);
                        this._dispatchEvent(e, 'dragenter', target);
                        this._lastTarget = target;
                    }
                    this._moveImage(e);
                    this._isDropZone = this._dispatchEvent(e, 'dragover', target);
                }
            }
        };

        /**
         * Defing the function to handle the event touchend
         * 
         * @param {*} e element to handle
         */
        TouchControls.prototype._touchend = function (e) {
            if (this._shouldHandle(e)) {

                if (this._dispatchEvent(this._lastTouch, 'mouseup', e.target)) {
                    e.preventDefault();
                    return;
                }

                //If only a click happened without dragging click on the element
                if (!this._img) {
                    this._dragSource = null;
                    this._dispatchEvent(this._lastTouch, 'click', e.target);
                    this._lastClick = Date.now();
                }

                this._destroyImage();

                //Stop the drag
                if (this._dragSource) {
                    if (e.type.indexOf('cancel') < 0 && this._isDropZone) {
                        this._dispatchEvent(this._lastTouch, 'drop', this._lastTarget);
                    }
                    this._dispatchEvent(this._lastTouch, 'dragend', this._dragSource);
                    this._reset();
                }
            }
        };

        /**
         * Defining a function to ignore event that have more than one touch control like zooming in/out
         * 
         * @param {*} e element to be handled
         */
        TouchControls.prototype._shouldHandle = function (e) {
            return e &&
                !e.defaultPrevented &&
                e.touches && e.touches.length < 2;
        };


        /**
         * Defining a function to handle the situation of pressing and holding something
         * 
         * @param {*} e element to be handled
         */
        TouchControls.prototype._shouldHandleMove = function (e) {
            return !TouchControls._ISPRESSHOLDMODE && this._shouldHandle(e);
        };

        /**
         * Defining a function to hande the situation of multiple simulatneous presses and touches
         * 
         * @param {*} e element to be handled
         */
        TouchControls.prototype._shouldHandlePressHoldMove = function (e) {
            return TouchControls._ISPRESSHOLDMODE &&
                this._isDragEnabled && e && e.touches && e.touches.length;
        };


        /**
         * Defining a function to handle the situation of a drag happening without pressing on something
         * 
         * @param {*} e element to be handled
         */
        TouchControls.prototype._shouldCancelPressHoldMove = function (e) {
            return TouchControls._ISPRESSHOLDMODE && !this._isDragEnabled &&
                this._getDelta(e) > TouchControls._PRESSHOLDMARGIN;
        };


        /**
         * Defining a function to drag an element whenever a touch happens
         * 
         * @param {*} e element to be handled
         */
        TouchControls.prototype._shouldStartDragging = function (e) {
            let delta = this._getDelta(e);
            return delta > TouchControls._THRESHOLD ||
                (TouchControls._ISPRESSHOLDMODE && delta >= TouchControls._PRESSHOLDTHRESHOLD);
        }

        /**
         * Defining a function to clear all the data
         */
        TouchControls.prototype._reset = function () {
            this._destroyImage();
            this._dragSource = null;
            this._lastTouch = null;
            this._lastTarget = null;
            this._ptDown = null;
            this._isDragEnabled = false;
            this._isDropZone = false;
            this._dataTransfer = new DataTransfer();
            clearInterval(this._pressHoldInterval);
        };

        /**
         * Defining a function to get the coordinates of the touch
         * 
         * @param {*} e element to be handled
         * @param {*} page page the element is on
         */
        TouchControls.prototype._getPoint = function (e, page) {
            if (e && e.touches) {
                e = e.touches[0];
            }
            return { x: page ? e.pageX : e.clientX, y: page ? e.pageY : e.clientY };
        };

        /**
         * Defining a function to get the distance between this touch and the previous one
         * 
         * @param {*} e element to be handled
         */
        TouchControls.prototype._getDelta = function (e) {
            if (TouchControls._ISPRESSHOLDMODE && !this._ptDown) { return 0; }
            let p = this._getPoint(e);
            return Math.abs(p.x - this._ptDown.x) + Math.abs(p.y - this._ptDown.y);
        };

        /**
         * Defining a function to get the element of that is being touched
         * 
         * @param {*} e element to be handled
         */
        TouchControls.prototype._getTarget = function (e) {
            let pt = this._getPoint(e),
                el = document.elementFromPoint(pt.x, pt.y);
            while (el && getComputedStyle(el).pointerEvents == 'none') {
                el = el.parentElement;
            }
            return el;
        };

        /**
         * Defining a function to create a copy of the dragged element from its source element
         * 
         * @param {*} e element to be handled
         */
        TouchControls.prototype._createImage = function (e) {

            //Destroy the image if its corrupted
            if (this._img) {
                this._destroyImage();
            }

            //Creating the copy from the source element
            let src = this._imgCustom || this._dragSource;
            this._img = src.cloneNode(true);
            this._copyStyle(src, this._img);
            this._img.style.top = this._img.style.left = '-9999px';

            //Applying the offset and the opacity of the source element
            if (!this._imgCustom) {
                let rc = src.getBoundingClientRect(),
                    pt = this._getPoint(e);
                this._imgOffset = { x: pt.x - rc.left, y: pt.y - rc.top };
                this._img.style.opacity = TouchControls._OPACITY.toString();
            }

            //Adding the new copy to the document
            this._moveImage(e);
            document.body.appendChild(this._img);
        };

        /**
         * Defining a function to destroy an image
         */
        TouchControls.prototype._destroyImage = function () {
            if (this._img && this._img.parentElement) {
                this._img.parentElement.removeChild(this._img);
            }
            this._img = null;
            this._imgCustom = null;
        };

        /**
         * Defining a function to move the image element
         * 
         * @param {*} e element to be handled
         */
        TouchControls.prototype._moveImage = function (e) {
            let _this = this;
            requestAnimationFrame(function () {
                if (_this._img) {
                    let pt = _this._getPoint(e, true),
                        s = _this._img.style;
                    s.position = 'absolute';
                    s.pointerEvents = 'none';
                    s.zIndex = '999999';
                    s.left = Math.round(pt.x - _this._imgOffset.x) + 'px';
                    s.top = Math.round(pt.y - _this._imgOffset.y) + 'px';
                }
            });
        };

        /**
         * Defining a function to copy properties from one element to another
         * 
         * @param {*} dst destination
         * @param {*} src source
         * @param {*} props properties
         */
        TouchControls.prototype._copyProps = function (dst, src, props) {
            for (let i = 0; i < props.length; i++) {
                let p = props[i];
                dst[p] = src[p];
            }
        };

        /**
         * Defning a function to coppy the style from one element to another
         * 
         * @param {*} src source
         * @param {*} dst destination
         */
        TouchControls.prototype._copyStyle = function (src, dst) {

            //Removing any useless attributes
            TouchControls._rmvAtts.forEach(function (att) {
                dst.removeAttribute(att);
            });

            //Copying the content of the image
            if (src instanceof HTMLCanvasElement) {
                let cSrc = src,
                    cDst = dst;
                cDst.width = cSrc.width;
                cDst.height = cSrc.height;
                cDst.getContext('2d').drawImage(cSrc, 0, 0);
            }

            //Copying the style
            let cs = getComputedStyle(src);
            for (let i = 0; i < cs.length; i++) {
                let key = cs[i];
                if (key.indexOf('transition') < 0) {
                    dst.style[key] = cs[key];
                }
            }
            dst.style.pointerEvents = 'none';

            //Repeating the above for all children of the element
            for (let i = 0; i < src.children.length; i++) {
                this._copyStyle(src.children[i], dst.children[i]);
            }
        };

        /**
         * Defining a function to account for any misssing offsets or layering of an element
         * 
         * @param {*} e element to be handled
         * @param {*} target destination target
         */
        TouchControls.prototype._setOffsetAndLayerProps = function (e, target) {
            let rect = undefined;
            if (e.offsetX === undefined) {
                rect = target.getBoundingClientRect();
                e.offsetX = e.clientX - rect.x;
                e.offsetY = e.clientY - rect.y;
            }
            if (e.layerX === undefined) {
                rect = rect || target.getBoundingClientRect();
                e.layerX = e.pageX - rect.left;
                e.layerY = e.pageY - rect.top;
            }
        }

        /**
         * Defining a function to dispatch an event
         * 
         * @param {*} e element to be handled
         * @param {*} type type of the event
         * @param {*} target destination target
         */
        TouchControls.prototype._dispatchEvent = function (e, type, target) {
            if (e && target) {

                let evt = new Event(type, { bubbles: true, cancelable: true }),
                    touch = e.touches ? e.touches[0] : e;
                evt.button = 0;
                evt.which = evt.buttons = 1;
                this._copyProps(evt, e, TouchControls._kbdProps);
                this._copyProps(evt, touch, TouchControls._ptProps);
                this._setOffsetAndLayerProps(evt, target);
                evt.dataTransfer = this._dataTransfer;
                target.dispatchEvent(evt);
                return evt.defaultPrevented;
            }
            return false;
        };

        /**
         * Defining a function to to get the closest draggable element
         * 
         * @param {*} e element to be handled
         */
        TouchControls.prototype._closestDraggable = function (e) {
            for (; e; e = e.parentElement) {
                if (e.draggable) {
                    return e;
                }
            }
            return null;
        };
        return TouchControls;
    }());

    TouchControls._instance = new TouchControls();

    /*
    Defining constants for touch controls
    */

    //Amount of pixels required before a drag happens
    TouchControls._THRESHOLD = 5;

    //The opacity of the dragged image
    TouchControls._OPACITY = 0.5;

    //The maximum amount of milli seconds to distinguish a click from a double click
    TouchControls._DBLCLICK = 500;

    //The maximum amount of milli seconds before the context menu is called
    TouchControls._CTXMENU = 900;

    //A value to keep track if the user is pressing and holding
    TouchControls._ISPRESSHOLDMODE = false;

    //The amount of milli seconds to wait before a press and hold is detected   
    TouchControls._PRESSHOLDAWAIT = 400;

    //The maximum amount of "wiggle" allowed while pressing and holding
    TouchControls._PRESSHOLDMARGIN = 25;

    //The amount of pixels required to start the drag
    TouchControls._PRESSHOLDTHRESHOLD = 0;

    //Copying the styles and attributes from source element to the draggable element
    TouchControls._rmvAtts = 'id,class,style,draggable'.split(',');
    TouchControls._kbdProps = 'altKey,ctrlKey,metaKey,shiftKey'.split(',');
    TouchControls._ptProps = 'pageX,pageY,clientX,clientY,screenX,screenY,offsetX,offsetY'.split(',');
    FuncTouchControls.TouchControls = TouchControls;
})(TouchControls || (TouchControls = {}));
