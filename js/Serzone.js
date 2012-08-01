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
	document.body.insertBefore(Canvas, byId("serzone"));

	/*
	 * CSS Class
	 */
	function CSS (elem) {
		Object.defineProperties( this, {
			elem : { value : elem, writable : true, configurable : false },
			css  : { value : [],   writable : true, configurable : false }
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
			obj  : { value : obj,   writable : true,  configurable : false },
			name : { value : name,  writable : false, configurable : false },
			type : { value : Serzone.action[name].type, writable : false },
			init : {
				value : function (other) {
					return Serzone.action[name].init(obj, Canvas, other);
				},
				writable : false
			},
			fire : {
				value : function (other) {
					return Serzone.action[name].fire(obj, Canvas, other);
				},
				writable : false
			}
		});
	}

	/*
	 * Slide Class
	 */
	function Slide (elem, order, layer, parent) {
		//parent, children, siblings : Array.<Slide>
		Object.defineProperties( this, {
			order    : { value : order,  writable : false, configurable : false },
			elem     : { value : elem,   writable : false, configurable : false },
			layer    : { value : layer,  writable : false, configurable : false },
			parent   : { value : parent, writable : false, configurable : false },
			steps    : { value : [],     writable : false, configurable : false },

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
					},
					
					configurable : false
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
					},

					configurable : false
				};
			})(),

			nextForestFirstSlide : (function () {
				var value = function () { return null; };

				return {
					get : function () {
						return value();
					},

					set : function (f) {
						value = f;
					}
				};
			})(),

		
			css : {
				value : new CSS(elem),
				writable : true,
				configurable : false
			},
			body : {
				value : document.createElement("div"),
				writable : true,
				configurable : false
			}
		} );

		this.body.classList.add("slide");

		var self = this;
		arrayify(elem.childNodes).filter(
			function (child) {
				return child.tagName != "SECTION";
			}
		).forEach(
			function (child) {
				if (child.className == "step") {
					self.steps.push( new Step( child, child.getAttribute("action") ) );
				}
				self.body.appendChild(child.cloneNode(true));
			}
		);
	}

	Object.defineProperties( Slide.prototype, {
		nextSibling : {
			get : function () {
				var candidates = this.siblings.filter( function (s) {
					return s.order > this.order;
				});

				return (sandidates.length != 0 ? candidates[0] : null);
			}
		},

		nextSlide : {
			get : function () {
				if (this.children.length != 0) {
					return this.children[0];
				}

				return (function findNextSlide (self) {
					if ( self.nextSibling !=  null ) {
						return self.nextSibling;
					}
					else if ( self.parent != null ) {
						return findNextSlide(self.parent);
					}
					else if ( self.nextForestFirstSlide != null ) {
						return self.nextForestFirstSlide;
					}
					else {
						return null;
					}
				})(this);
			}
		}
	});

	/*
	 * Parser Class
	 */
	function Parser () {
		Object.defineProperties( this, {
			slides : { value : [], writable : true, configurable : false },
			steps  : { value : [], writable : true, configurable : false }
		});
	}

	Parser.prototype = {
		slideParser : function () {
			function parseSlides (section, order, layer, parent) {
				layer  = layer  || 0;
				parent = parent || null;

				var current = new Slide(section, order, layer, parent);
				
				var children = arrayify(section.childNodes).filter(
					function (child) {
						return child.tagName == "SECTION";
					}
				).map(
					function (child, i) {
						var o = parseSlides(child, order+1, layer+1, current);
						order = o.order;
		
						return o.slides;
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
					slides   : current,
				};
			}

			var self = this;
			this.slides = arrayify(byId("serzone").childNodes).filter(
				function (child) {
					return child.tagName == "SECTION";
				}
			).map(
				function (section, i, serzoneChildren) {
					var order  = (i == 0 ? 0 : $$("section", serzoneChildren[i-1]).length + 1);
					
					var slideTree = parseSlides(section, order).slides;
					
					if (i < serzoneChildren.length - 1) {
						slideTree.nextForestFirstSlide = function () {
							return self.slides[i+1];
						};
					}

					return slideTree;
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

		parse : function () {
			this.slideParser();
			this.stepParser();
		}
	};

	/*
	 * Spike Class
	 */
	function Spike (steps) {
		Object.defineProperties(this, {
			steps : { value : steps, writable : false, configurable : false },
			count : { value : 0,     writable : true,  configurable : false },
			next  : {
				value : function (e) {
					this.steps[this.count].fire(e);
					this.count++;
					this.steps[this.count].init(e);
				},

				configurable : false
			},

			history : (function () {
				var value = [];

				return {
					get : function () {
						return value;
					},

					set : function (e) {
						value = value.concat(e);
					},

					configurable : false
				};
			})(),

			eventType : {
				value : {
					next : {
						mouse   : ["click"],
						keycode : [32, 39]
					},
					previous : {
						mouse   : undefined,
						keycode : [37]
					}
				},
				writable     : false,
				configurable : false
			}
		});
	
		this.steps[0].init();
	}

	Spike.prototype = {
		addEvent : function () {
			// next
			var self = this;
			this.eventType.next.mouse.forEach(
				function (e) {
					document.body.addEventListener(e, function () {
						self.next();
					});
				}
			);
		}
	};

	// 初期化
	Serzone.parser = new Parser;
	Serzone.parser.parse();

	Serzone.slides = Serzone.parser.slides;
	Serzone.steps  = Serzone.parser.steps;

	Serzone.spike  = new Spike(Serzone.steps);
	Serzone.spike.addEvent();
})();
