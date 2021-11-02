const Valerian = new (class Valerian {
    constructor() {
        this.files = {
        };
    }

    Module = class Module {
        constructor(parent, scope, filename) {
            const file = parent.files[filename];
            let variables = file.variables;
            for (let i = 0; i < variables.length; i++) {
                this[variables[i][0]] = variables[i][1];
            }
            let hooks = file.variables;
            for (let i = 0; i < hooks.length; i++) {
                this._valerian_hooks[i] = new Proxy(scope, {
                    set: function (target, key, value) {
                        console.log(`${key} set to ${value}`);
                        target[key] = value;
                        return true;
                    },
                    get: function(target, property) {
                        console.log('getting ' + property + ' for ' + target);
                        // property is index in this case
                        return target[property];
                    }
                });
            }
        }

        extend(callback) {
            return callback(this);
        }
    } 

    recall(scope, filename) {
        return new this.Module(this, scope, filename);
    }
});