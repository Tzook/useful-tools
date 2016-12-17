// usage:
// runBeforeFunctions(function(scope, path, fnName, args) {
//     // and do anything in this callback
//     var newPath = path.slice();
//     newPath.push(fnName); 
//     console.info(newPath.join("."), args);
// }, [console]);

function runBeforeFunctions(cb, skipObjects, intialScope) {
    var functionsHandled = new Map();
    
    handleFunctions(skipObjects);
    
    return functionsFiller(intialScope || window, [], cb);

    function handleFunctions(objects) {
        for (var i in objects) {
            functionsHandled.set(objects[i], 1);
        }
    }

    function functionsFiller(scope, basePath, callback) {
        var TYPE_OBJECT   = "[object Object]",
            TYPE_FUNCTION = "[object Function]";

        loopOnObject(scope, basePath, [scope]);

        function loopOnObject(scope, path, objectsPath) {
            var newPath, newObjectsPath;
            for (var key in scope) {
                try {
                    if (isLooping(scope[key], objectsPath) || functionsHandled.has(scope[key])) {
                        continue;
                    }
                    var type = Object.prototype.toString.call(scope[key]);
                    
                    if (type === TYPE_OBJECT || type === TYPE_FUNCTION) {
                        newPath = path.slice(); // create a new array with same path
                        newPath.push(key); // add the newest object name as the last in the path
                        newObjectsPath = objectsPath.slice();
                        newObjectsPath.push(scope[key]);
                        loopOnObject(scope[key], newPath, newObjectsPath);   
                    }
                    if (type === TYPE_FUNCTION) {
                        insertCallbackToFunction(scope, path, key);
                    }
                } catch (e) {} // Some variables throw errors when trying to access them (iframe window's 'screenLeft' in IE for example)
            }
            return 1;
        }

        function isLooping(obj, path) {
            for (var i in path) {
                if (path[i] === obj) {
                    return true;
                }
            }
        }


        function insertCallbackToFunction(scope, path, key) {
            var realFunc = scope[key]; // keep the old prototype
            scope[key] = function () {
                callback(scope, path, key, arguments);
                return realFunc.apply(this, arguments); // call the real function with the arguments that it was called
            };
            
            copyAllChildren(realFunc, scope[key]);
            
            handleFunctions([scope[key]]);
        }

        function copyAllChildren(from, to) {
            to.prototype = from.prototype;
            for (var i in from) {
                to[i] = from[i];
            }
        }
    }
}
