const Valerian = new (class Valerian {
	constructor() {
		this.files = {
		};

		this.DynamicHook = class DynamicHook {
			constructor(className) {
				this.className = className;
			}

			update(value) {
				const element = document.getElementsByClassName(this.className);
				element[0].innerHTML = value;
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

			update(value) {
				this.value = value;
				for (let i = 0; i < this.hooks.length; i++) {
					this.hooks[i].update(value);
				}
			}
		}

		this.Module = class Module {
			constructor(parent, filename) {
				/*this.__valerian = {
					__hooks: []
				}*/
				const file = parent.files[filename];
				let variables = file.variables;
				for (let i = 0; i < variables.length; i++) {
					if (variables[i][2] == 0) {
						this[variables[i][0]] = variables[i][1];
					} else if (variables[i][2] == 1) {
						this[variables[i][0]] = new parent.DynamicVariable(variables[i][1]);
					} else {
						this[variables[i][0]] = () => { return; };
					}
				}
				let hooks = file.hooks;
				for (let i = 0; i < hooks.length; i++) {
					this[hooks[i][1]].__addHook(new parent.DynamicHook(hooks[i][0]));
				}
			}
	
			extend(callback) {
				return callback(this);
			}
		} 
	}

	recall(filename) {
		return new this.Module(this, filename);
	}
})();