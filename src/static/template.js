const Valerian = new (class Valerian {
	constructor() {
		this.files = {
		};

		this.SharedStorage = {}

		this.DynamicHook = class DynamicHook {
			constructor(className) {
				this.className = className;
			}

			update(value) {
				const element = document.getElementsByClassName(this.className);
				// FIXME:
				if (element.length) {
					element[0].innerHTML = value;
				}
			}
		}

		this.DynamicVariable = class DynamicVariable {
			constructor(value) {
				this.value = value;
				this.hooks = [];
			}

			__addHook(hook) {
				this.hooks.push(hook);
				window.addEventListener('load', (event) => {
					this.update(this.value);
				});
			}

			update(value = undefined) {
				if (value !== undefined) {
					this.value = value;
				}
				for (let i = 0; i < this.hooks.length; i++) {
					this.hooks[i].update(this.value);
				}
			}
		}

		this.Module = class Module {
			constructor(parent, filename, moduleName) {
				/*this.__valerian = {
					__hooks: []
				}*/
				this.shared = parent.SharedStorage;
				const file = parent.files[filename];
				let variables = file.variables;
				for (let i = 0; i < variables.length; i++) {
					const _type = variables[i][2];
					if (_type == 0) {
						this[variables[i][0]] = variables[i][1];
					} else if (_type == 1) {
						this[variables[i][0]] = new parent.DynamicVariable(variables[i][1]);
					} else if (_type == 2) {
						this[variables[i][0]] = () => { return; };
					} else if (_type == 3) {
						if (this.shared[variables[i][0]] !== undefined) {
							this.shared[variables[i][0]].value = variables[i][1];
							continue;
						}
						this.shared[variables[i][0]] = new parent.DynamicVariable(variables[i][1]);
					} else if (_type == 4) {
						// Do nothing - this is shared import
					} 
				}
				let hooks = file.hooks;
				for (let i = 0; i < hooks.length; i++) {
					if (hooks[i][2]) {
						if (this.shared[hooks[i][1]] === undefined) {
							this.shared[hooks[i][1]] = new parent.DynamicVariable(undefined);
						} 
						this.shared[hooks[i][1]].__addHook(new parent.DynamicHook(moduleName + hooks[i][0]));
						continue;
					}
					this[hooks[i][1]].__addHook(new parent.DynamicHook(moduleName + hooks[i][0]));
				}
			}
	
			extend(callback) {
				return callback(this);
			}
		} 
	}

	recall(filename, name = "__manual") {
		return new this.Module(this, filename, name);
	}
})();