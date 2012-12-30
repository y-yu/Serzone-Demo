"use strict";

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

function $ (selector, root) {
	root = root || document;
	return arrayify( root.querySelectorAll(selector) );
}

function containedDirectlyNodes (selector, node) {
	var children = $(selector, node);

	var DESCENDANT = Node.DOCUMENT_POSITION_FOLLOWING | Node.DOCUMENT_POSITION_CONTAINED_BY;

	return children.filter( function (child) {
		return children.every( function (c) {
				return c.compareDocumentPosition(child) != DESCENDANT;
			});
		});
}

/*
 * Initialize
 */

Serzone.canvas = document.createElement("div");
Serzone.canvas.classList.add("canvas");

/*
 * Tree Class
 */
function Tree (order, parent) {
	Object.defineProperties(this, {
		$order       : { value : order,     writable : true, enumerable : false, configurable : false },
		$parent      : { value : parent,    writable : true, enumerable : false, configurable : false },
		$children    : { value : [],        writable : true, enumerable : false, configurable : false },
		$siblings    : { value : [],        writable : true, enumerable : false, configurable : false },
	});
}

Object.defineProperties(Tree.prototype, {
	order : {
		get : function () {
			if (this.$order == undefined) {
				throw new Error("order property is not defined.");
			} else {
				return this.$order;
			}
		},

		set : function (order) {
			this.$order = order;
		},

		configurable : false
	},

	parent : {
		get : function () {
			return ( this.$parent != undefined ? this.$parent : null );
		},

		set : function (parent) {
			this.$parent = parent;
		},

		configurable : false
	},

	depth : {
		get : function () {
			return (function getDepth(self, depth) {
					if (self.parent == null) {
						return depth;
					} else {
						return getDepth(self.parent, depth+1);
					}
				}(this, 0));
		}
	},

	children : { 
		get : function () {
			return this.$children.sort(
				function (a, b) { return (a.order - b.order); }
			);
		},

		set : function (newChildren) {
			this.$children = this.$children.concat(newChildren);
		},

		configurable : false
	},

	siblings : {
		get : function () {
			return this.$siblings.sort(
				function (a, b) { return (a.order - b.order); }
			);
		},

		set : function (newSiblings) {
			this.$siblings = this.$siblings.concat(newSiblings);
		},

		configurable : false
	},

	descendants : {
		get : function () {
			return this.children.reduce( 
				(function (x, y) { return x.concat(y.descendants); }), this.children
			);
		},

		configurable : false
	},

	nextSibling : {
		get : function () {
			var self = this;
			var candidates = this.siblings.filter(
					function (s) { return s.order >= self.order; }
				);

			return (candidates.length != 0 ? candidates[0] : null);
		},

		configurable : false
	},

	next : {
		get : function () {
			if (this.children.length != 0) {
				return this.children[0];
			}

			return (function findNext (self) {
				if ( self.nextSibling !=  null ) {
					return self.nextSibling;
				}
				else if ( self.parent != null ) {
					return findNext(self.parent);
				}
				else {
					return null;
				}
			}(this));
		},

		configurable : false
	},

	previous : {
		get : function () {
			var self = this;
			var candidate = this.siblings.filter( function (e) {
				return e.order < self.order;
			}).pop();

			if (candidate == undefined) {
				return this.parent;
			} else if (candidate.next == this) {
				return candidate;
			} else {
				var d = candidate.descendants.pop();
				return (d != undefined ? d : null);
			}
		}
	}
});

/*
 * Step Class
 */

var id = 0;
function Step (order, obj, name, parent) {
	var self = this;

	Tree.call(this, order, parent);

	Object.defineProperties( this, {
		$id    : { value : id++,   writable : true,  configurable : false },
		$obj   : { value : obj,   writable : true,  configurable : false },
		$name  : { value : name,  writable : false, configurable : false },
		$type  : { value : Serzone.action[name].type, writable : false, configurable : false },
		$flag  : { value : false, writable : true, configurable : false },

		obj  : {
			get : function () {
				if (this.$obj instanceof HTMLElement) {
					var inCanvas = $("#step-" + this.order)[0];

					if (inCanvas != undefined) {
						this.$obj = inCanvas;
					}
				}

				return this.$obj;
			}
		},

		next : {
			value : {
				init : function (other) {
					self.$flag = true;

					if (Serzone.action.always != undefined && Serzone.action.always.next != undefined) {
						Serzone.action.always.next.init(self.obj, self);
					}

					return Serzone.action[name].next.init(self.obj, self);
				},

				fire : function (other) {
					if (self.$flag) {
						if (Serzone.action.always != undefined && Serzone.action.always.next != undefined) {
							Serzone.action.always.next.fire(self.obj, self);
						}

						return Serzone.action[name].next.fire(self.obj, self);
					} else {
						return self.next.init(self.obj, self);
					}
				},
			},
			writable : false,
			configurable : false
		},

		back : {
			value : {
				init : function (other) {
					if (Serzone.action.always != undefined && Serzone.action.always.back != undefined) {
						Serzone.action.always.back.init(self.obj, self);
					}

					return Serzone.action[name].back.init(self.obj, self);
				},

				fire : function (other) {
					if (Serzone.action.always != undefined && Serzone.action.always.back != undefined) {
						Serzone.action.always.back.fire(self.obj, self);
					}

					return Serzone.action[name].back.fire(self.obj, self);
				}
			},
			writable : false,
			configurable : false
		}
	});
}

Step.prototype = Object.create(Tree.prototype);
Step.prototype.constructor = Step;

Object.defineProperties(Step.prototype, {
	order : {
		set : function (n) {
			this.$order = n;

			if (this.$obj instanceof HTMLElement) {
				this.$obj.id = "step-" + n;
			}
		},

		get : function () {
			return this.$order;
		}
	}
});


/*
 * Slide Class
 */

function Slide (order, elem, parent) {
	Tree.call(this, order, parent);

	var slideKey = Object.keys(Serzone.action).filter(function (e) {
						return Serzone.action[e].type == "changeSlide"
					})[0];

	Object.defineProperties( this, {
		$elem     : { value : elem,      writable : false, configurable : false },
		$steps    : { value : undefined, writable : true,  configurable : false },

		$body : {
			value : document.createElement("div"),
			writable : true,
			configurable : false
		},

		$mine : {
			value : new Step(undefined, this, slideKey, (parent == null ? null : parent.$mine)),
			writable : true,
			configurable : false
		},

		body : {
			get : function () {
				var inCanvas = $("#slide-" + this.order)[0];

				if (inCanvas != undefined) {
					this.$body = inCanvas;
				}
				
				return this.$body;
			},
			set : function (e) {
				this.$body = e;
			}
		}
	} );

	this.body.classList.add("slide");
	this.body.id = "slide-" + order;

	var self = this;
	arrayify(elem.childNodes).forEach( function (child) {
		self.body.appendChild(child.cloneNode(true));
	}); 
}

Slide.prototype = Object.create(Tree.prototype);
Slide.prototype.constructor = Slide;

Object.defineProperties(Slide.prototype, {
	steps : {
		get : function () {
			var self     = this,
				count    = 0,
				keys     = Object.keys(Serzone.action).join(","),
				slideKey = Object.keys(Serzone.action).filter(function (e) {
						return Serzone.action[e].type == "changeSlide"
					})[0];

			function getSlideSteps (elem, parent, order) {
				if (elem.tagName.toLowerCase() == slideKey) {
					var step = self.children[count].$mine;

					self.body.removeChild(elem);

					step.children = self.children[count++].steps;
				} else {
					var step = new Step(order, elem, elem.tagName.toLowerCase(), parent);

					var t = containedDirectlyNodes(keys, elem).reduce(
							(function (x, e) {
								var steps = x[0],
									i     = x[1] + 1;

								var s = new Step(i, self.children[count], slideKey, step);

								if (e.tagName.toLowerCase() == slideKey) {
									s.children = self.children[count++].steps;

									return [ steps.concat(s), (s.descendants.length + i) ];
								} else {
									var r = getSlideSteps(e, step, i);

									return [ steps.concat(r[0]), (r[1] + i) ];
								}
							}), [[], order]
						);
					step.children = t[0];
					
					step.children.forEach( function (s, i, steps) {
						s.siblings = steps.slice(0, i);
						s.siblings = steps.slice(i + 1);
					});
				}

				return [step, step.descendants.length];
			}

			if (this.$steps == undefined) {
				var t = containedDirectlyNodes(keys, this.body).reduce(
					(function (x, e) {
						var steps = x[0],
							i     = x[1];

						var r = getSlideSteps(e, self.$mine, i);

						return [ steps.concat(r[0]), (i + r[1]) ];
					}), [[], 0]);

				this.$steps = t[0];

				this.$steps.forEach( function (s, i, steps) {
					s.siblings = steps.slice(0, i);
					s.siblings = steps.slice(i + 1);
				});
			}

			return this.$steps;
		},

		set : function (s) {
			this.$steps = s;
		}
	}
});

/*
 * Parser Class
 */
var Parser = {
	slides : [],
	steps  : [],

	init : function () {
		if ( byId("serzone") == null ) {
			throw new Error("Don't have element which has id=serzone");
		}
	},

	slideParser : function () {
		var slideKey = Object.keys(Serzone.action).filter(function (e) {
				return Serzone.action[e].type == "changeSlide"
			})[0];

		function parseSlides (section, order, parent) {
			parent = parent || null;

			var current = new Slide(order, section, parent);
			
			var children = containedDirectlyNodes(slideKey, section).map(
				function (child, i) {
					var o  = parseSlides(child, order + 1, current);
					order += o.descendants.length + 1;
	
					return o;
				}
			);

			children.forEach( function (child, i, children) {
				child.siblings = children.slice(0, i);
				child.siblings = children.slice(i + 1);
			});

			current.children = children;

			return current;
		}

		this.slides = containedDirectlyNodes(slideKey, byId("serzone")).map(
			function (section, n, roots) {
				var order = 0;
				for (var i = 0; i < n; i++) {
					order += $(slideKey, roots[i]).length + 1;
				}
				
				return parseSlides(section, order);
			}
		);

		this.slides.forEach( function (s, i, slides) {
			s.siblings = slides.slice(0, i);
			s.siblings = slides.slice(i + 1);
		});
	},
	
	stepParser : function () {
		var keys     = Object.keys(Serzone.action).join(","),
			slideKey = Object.keys(Serzone.action).filter(function (e) {
				return Serzone.action[e].type == "changeSlide"
			})[0];

		this.steps = this.slides.map( function (slide, i) { 
			var step = slide.$mine;

			slide.steps.forEach( function (s) {
				s.parent = step;
			});

			step.children = slide.steps;

			return step;
		});
		
		this.steps.forEach( function (step, i, steps) {
			step.siblings = steps.slice(0, i);
			step.siblings = steps.slice(i + 1);
		});

		function setOrder (step, n) {
			var sum = n;

			step.order = n;

			if (step.children.length > 0) {
				step.children.forEach(
					function (s, i, c) {
						if (i == 0) {
							sum += 1;
						} else {
							for (var j = 0; j < i; j++) {
								sum += c[j].descendants.length + 1
							}
						}

						setOrder(s, sum)
					});
			}
		}

		this.steps.forEach(
			function (s, i, c) {
				var sum = 0;

				for (var j = 0; j < i; j++) {
					sum += c[j].descendants.length + 1;
				}

				setOrder(s, sum)
			});
	},

	parse : function () {
		try {
			this.init();
			this.slideParser();
			this.stepParser();
		} catch (e) {
			throw e;
		}
	}
};

/*
 * Spike Class
 */
var Spike = {
	$eventType : {
		next : {
			mouse   : ["click"],
			keycode : [13, 32, 39]
		},
		previous : {
			mouse   : undefined,
			keycode : [37]
		}
	},
	$slide : undefined, // Step Object
	$stack : [],
	$end   : [],

	refreshStack : function () {
		var self = this;

		this.$stack = (function rec (c) {
			if (c.$type == "inherit") {
				c.next.init();
				
				var r = [c];
				r = r.concat( c.children.reduce( (function (x, y) {
					return x.concat( rec(y) );
				}), []));

				return r;
			} else {
				return [ {
					next : {
						fire : function () {
							c.next.fire();

							self.$stack = c.children.reduce(
								(function (x, y) { return x.concat( rec(y) ); }), []
							).concat(c).concat(self.$stack);
						},
					},
					back : {
						fire :function () {
							c.back.fire();
						}
					},
					$o : c
				} ];
			}
		}(this.$slide));
	},

	next : function (i) {
		var step = this.$stack.shift();
		this.$end.push(step);

		console.log(step);
		if (step != undefined) {
			step.next.fire();
		}

		if (this.$stack.length <= 0) {
			if (this.$slide.nextSibling != null) {
				this.$slide = this.$slide.nextSibling;

				this.refreshStack();
			}
		}
	},

	back : function () {
		var step = this.$end.pop();

		step.back.fire()

		this.$stack.push(step);
	},

	start : function (slide) {
		this.$slide = slide;
		this.refreshStack();

		var n = (document.location.hash ? Number(document.location.hash.replace("#", "")) : 1);
		var self = this;

		for (var i = 0; i < n; i++) {
			setTimeout(function () {
				self.next(i);
			}, 1);
		}
		this.setEvent(n);
	},

	setEvent : function (i) {
		// next
		var self = this;

		// this.$eventType.next.mouse.forEach(
		// 	function (e) {
		// 		document.body.addEventListener(e, function () {
		// 			self.next(i);
		// 			i++;
		// 			document.location.hash = i;
		// 		});
		// 	}
		// );

		document.body.addEventListener("keydown", function(e) {
			if (self.$eventType.next.keycode.indexOf(e.keyCode) > -1) {
				self.next(i);
				i++;
				document.location.hash = i;
			}
		});

		document.body.addEventListener("keydown", function(e) {
			if (self.$eventType.previous.keycode.indexOf(e.keyCode) > -1) {
				self.back(i)
				i--;
				document.location.hash = i;
			}
		});

	}
};

Serzone.start = function () {
	// make canvas
	document.body.insertBefore(this.canvas, byId("serzone"));

	// Parse
	Parser.init();
	Parser.parse();
	this.slides = Parser.slides;
	this.steps  = Parser.steps;
	this.spike  = Spike;

	this.spike.start(this.steps[0]);
};

}());
