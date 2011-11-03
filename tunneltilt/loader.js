/*
* Copyright (c) 2011 Research In Motion Limited.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

/**
 *  Load state just keeps track of a very basic XMLHttpRequest to load data.
 *  When the data is loaded, it calls the callback function with the response
 *  text received.
 */
LoadState = function (url, callback, loader) {
    this.url = url;
    this.request = new XMLHttpRequest();
    this.request.open("GET", url);
    this.callback = callback;
    var this_ = this;
    this.request.onreadystatechange = function() {
        if (this_.request.readyState == 4) {
            this_.loader.remove(this);
            this_.callback.call(undefined, this_.request.responseText);
        }
    };
    this.loader = loader;
};

/**
 *  LoadState prototype, with start method to kick off the request.
 */
LoadState.prototype = {
    constructor: LoadState,
    start: function() {
        this.request.send();
    }
};

/**
 *  Load state just keeps track of an image load request.
 *  When the image is loaded, it calls the callback function with the image.
 */
LoadImage = function (url, callback, loader) {
    this.url = url;
    this.image = new Image();
    this.callback = callback;
    var this_ = this;
    this.image.onload = function() {
        this_.loader.remove(this);
        this_.callback.call(undefined, this_.image);
    };
    this.loader = loader;
};

/**
 *  LoadImage prototype, with start method that starts the request by
 *  assigning the URL to the image.
 */
LoadImage.prototype = {
    constructor: LoadState,
    start: function() {
        this.image.src = this.url;
    }
};

/**
 *  The main loader object keeps track of how many requests are pending, 
 *  and provides methods to load text data and images.
 */
Loader = function () {
    this.pending = [];
};

/**
 *  The Loader prototype defines load and loadImage to make requests, and
 *  loaded to check if there are still pending requests. The remove method
 *  does not cancel a request - it's really meant to be used by the LoadState
 *  and LoadImage objects to remove themselves from the pending queue.
 */
Loader.prototype = {
    constructor: Loader,
    load: function (url, callback) {
        var obj = new LoadState(url, callback, this);
        obj.index = this.pending.length;
        this.pending.push(obj);
        obj.start();
    },
    loadImage: function (url, callback) {
        var obj = new LoadImage(url, callback, this);
        obj.index = this.pending.length;
        this.pending.push(obj);
        obj.start();
    },
    loaded: function () {
        if (this.pending.length > 0)
            return false;
        else
            return true;
    },
    remove: function (obj) {
        if (this.pending.length > 1)
            this.pending[obj.index] = this.pending[this.pending.length-1];
        this.pending.pop();
    }
};
