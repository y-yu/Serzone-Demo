var Serzone = Serzone || {};
Serzone.action = Serzone.action || {};

(function () {
	/*
	 * Utility functions
	 */
	function arrayify (e) {
		return Array.prototype.slice.call(e);
	}

	function byId (id, root) {
		root = root || document;
		return root.getElementById(id);
	}

	function $ (selecter, root) {
		root = root || document;
		return root.querySelector(selecter);
	}

	function $$ (selecter, root) {
		root = root || document;
		return arrayify( root.querySelectorAll(selecter) );
	}

	function validate (object, type) {
		if ( !(object instanceof type) ) {
			throw new Error("Expected " + type + ", but " + object.constructor);
		}
	}

	/*
	 * Initialize
	 */
	var Canvas = document.createElement("div");
	Canvas.classList.add("canvas");
	byId("serzone").insertBefore(Canvas, byId("serzone").firstChild);

	/*
	 * CSS Class
	 */
	function CSS (elem) {
		Object.defineProperties( this, {
			elem : { value : elem, writable : true },
			css  : { value : [],   writable : true }
		});
	}

	CSS.prototype = {
		get : function (num) {
			num = num || -1;

			return this.css[num];
		},

		set : function (obj) {
			for (var i in obj) {
				this.elem.style.setProperty(i, obj[i]);
			}

			this.css.push(this.elem.style);

			return true;
		},

		undo : function (num) {
			num = num || 1;

			elem.style = css[num];
			
			css.pop();

			return false;
		}
	};

	/*
	 * Step Class
	 */
	function Step (obj, name) {
		Object.defineProperties( this, {
			obj  : { value : obj,   writable : true  },
			name : { value : name,  writable : false },
			type : { value : Serzone.action[name].type, writable : false },
			init : {
				value : (function () {
					return function (other) {
						return Serzone.action[name].init(obj, Canvas, other);
					};
				})(),
				writable : false
			},
			fire : {
				value : (function (other) {
					return function (other) {
						return Serzone.action[name].fire(obj, Canvas, other);
					};
				})(),
				writable : false
			}
		});

		this.init(obj, Canvas);
	}

	/*
	 * Slide Class
	 */
	function Slide (order, elem, layer, parent) {
		//parent, children, siblings : Array.<Slide>
		Object.defineProperties( this, {
			order    : { value : order,  writable : false },
			elem     : { value : elem,   writable : false },
			layer    : { value : layer,  writable : false },
			parent   : { value : parent, writable : false },
			steps    : { value : [],     writable : false },

			children : (function () {
				var value = [];

				return {
					set : function (slide) {
						value = value.concat(slide).sort(
							function (a, b) {
								return a.order > b.order;
							}
						);
					},

					get : function () {
						return value;
					}
				};
			})(),

			siblings : (function () {
				var value = [];
				
				return {
					set : function (slide) {
						value = value.concat(slide).sort(
							function (a, b) {
								return a.order > b.order;
							}
						);
					},

					get : function () {
						return value;
					}
				};
			})(),

			css : {
				value : new CSS(elem),
				writable : true,
				configurable : true
			},
			body : {
				value : document.createElement("div"),
				writable : true,
				configurable : true
			}
		} );

		this.body.classList.add("slide");

		var self = this;
		arrayify(elem.childNodes).filter( function (child) {
			return child.tagName != "SECTION";
		} ).forEach( function (child) {
			if (child.className == "step") {
				self.steps.push( new Step( child, child.getAttribute("action") ) );
			}
			elem.removeChild(child);
			self.body.appendChild(child);
		});
	}

	Slide.prototype = {


	};

	/*
	 * Parser Class
	 */
	function Parser () {
		Object.defineProperties( this, {
			slides : { value : [], writable : true },
			steps  : { value : [], writable : true }
		});
	}

	Parser.prototype = {
		slideParser : function () {
			function parseSlides (section, order, layer, parent) {
				layer  = layer  || 0;
				parent = parent || undefined;

				var current = new Slide(order, section, layer, parent);
				
				var children = arrayify(section.childNodes).filter(
					function (child) {
						return child.tagName == "SECTION";
					}
				).map(
					function (child, i) {
						var o = parseSlides(child, order+1, layer+1, current);
						order = o.order;
		
						return o.children;
					}
				);

				children.forEach(
					function (child, i, children) {
						child.siblings = children.slice(0, i);
						child.siblings = children.slice(i + 1);
					}
				);

				current.children = children;

				return {
					order    : order,
					children : current,
				};
			}

			this.slides = arrayify(byId("serzone").childNodes).filter(
				function (child) {
					return child.tagName == "SECTION";
				}
			).map(
				function (section, i, serzone) {
					var order = (i == 0 ? 0 : $$("section", serzone[i-1]).length + 1);

					return parseSlides(section, order).children;
				}
			);
		},
		
		stepParser : function () {
			var self = this;

			function parseSteps (slide) {
				self.steps = self.steps.concat(slide.steps);
				self.steps.push( new Step(slide, "changeSlide") );

				slide.children.forEach(
					function (c) {
						parseSteps(c);
					}
				);
			}

			this.slides.forEach( function (e) { parseSteps(e); });
		},

		// beta edition
		parse : function () {
			this.slideParser();
			this.stepParser();
		}
	};

	// 初期化
	Serzone.parser = new Parser;
	Serzone.parser.parse();

	Serzone.slides = Serzone.parser.slides;
	Serzone.steps  = Serzone.parser.steps;
})();
