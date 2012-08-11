"use strict";

//(function () {

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
 * Tree Class
 */
function Tree (order, parent) {
	Object.defineProperties(this, {
		$order    : { value : order,     writable : true, enumerable : false, configurable : false },
		$parent   : { value : parent,    writable : true, enumerable : false, configurable : false },
		$children : { value : [],        writable : true, enumerable : false, configurable : false },
		$siblings : { value : [],        writable : true, enumerable : false, configurable : false },
		$nextTree : { value : undefined, writable : true, enumerable : false, configurable : false }
	});
}

Object.defineProperties(Tree.prototype, {
	order : {
		get : function () {
			if (this.$order == undefined) {
				return -1;
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
			return this.$parent
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
			return this.$children;
		},

		set : function (newChildren) {
			this.$children = this.$children.concat(newChildren).sort(
				function (a, b) { return a.order > b.order; }
			);
		},

		configurable : false
	},

	siblings : {
		get : function () {
			return this.$siblings;
		},

		set : function (newSiblings) {
			this.$siblings = this.$siblings.concat(newSiblings).sort(
				function (a, b) { return a.order > b.order; }
			);
		},

		configurable : false
	},

	nextTree : {
		get : function () {
			return this.$nextTree;
		},

		set : function (e) {
			this.$nextTree = e;
		},

		configurable : false
	},

	nextSibling : {
		get : function () {
			var self = this;
			var candidates = this.siblings.filter(
				function (s) { return s.order > self.order; }
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
				else if ( self.nextTree != null ) {
					return self.nextTree;
				}
				else {
					return null;
				}
			}(this));
		},

		configurable : false
	}
});

/*
 * Step Class
 */

function Step (obj, name, parent) {
	Tree.call(this, undefined, parent);

	Object.defineProperties( this, {
		obj   : { value : obj,   writable : true,  configurable : false },
		name  : { value : name,  writable : false, configurable : false },
		//type  : { value : undefined writable : false, configurable : false },

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

Step.prototype = Object.create(Tree.prototype);
Step.prototype.constructor = Step;

/*
 * Slide Class
 */
function Slide (order, elem, parent) {
	Tree.call(this, order, parent);

	Object.defineProperties( this, {
		$elem     : { value : elem,      writable : false, configurable : false },
		$steps    : { value : undefined, writable : true,  configurable : false },

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
	arrayify(elem.childNodes).filter( function (child) {
		return child.tagName != "SECTION";
	}).forEach( function (child) {
		self.body.appendChild(child.cloneNode(true));
	}); 
}

Slide.prototype = Object.create(Tree.prototype);
Slide.prototype.constructor = Slide;

Object.defineProperties(Slide.prototype, {
	steps : {
		get : function () {
			function containedDirectlyNodes (selector, node) {
				var children = arrayify( $$(selector, node) );

				var DESCENDANT = Node.DOCUMENT_POSITION_FOLLOWING | Node.DOCUMENT_POSITION_CONTAINED_BY;
				return children.filter( function (child) {
					return children.every( function (c) {
						 return c.compareDocumentPosition(child) != DESCENDANT;
					});
				});
			}

			function getSlideSteps (elem, parent) {
				var step = new Step(elem, elem.getAttribute("action"), parent);

				step.children = containedDirectlyNodes("div.step", elem).map(
					function (e) { return getSlideSteps(e, step); }
				);

				return step;
			}

			if (this.$steps == undefined) {
				this.$steps = containedDirectlyNodes("div.step", this.body).map(
					function (e) { return getSlideSteps(e, null); }
				);
			}

			return this.$steps;
		},

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
	init : function () {
		if ( byId("serzone") == null ) {
			throw new Error("Don't have element which has id=serzone");
		}
	},

	slideParser : function () {
		function parseSlides (section, order, parent) {
			parent = parent || null;

			var current    = new Slide(order, section, parent);
			
			var children = arrayify(section.childNodes).filter(
				function (child) {
					return child.tagName == "SECTION";
				}
			).map(
				function (child, i) {
					var o = parseSlides(child, order+1, current);
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
				var order     = (i == 0 ? 0 : $$("section", serzoneChildren[i-1]).length + 1);
				var slideTree = parseSlides(section, order).slides;
				
				return slideTree;
			}
		).map(
			function (s, i, slides) {
				if (i < slides.length - 1) {
					s.nextTree = slides[i+1];
				}

				s.siblings = slides.slice(0, i);
				s.siblings = slides.slice(i + 1);

				return s;
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
function Spike (steps) {
	Object.defineProperties(this, {
		steps : { value : steps, writable : false, configurable : false },
		count : { value : 0,     writable : true,  configurable : false },
		history : { value : [], writable : true, configurable : false },

		next : {
			value : function (e) {
				if (this.count < this.history.length - 1) {
					document.body.removeChild(this.history[this.count]);
					this.count++;
					document.body.insertBefore(this.history[this.count], byId("serzone"));
				}
			},
			configurable : false
		},

		previous : {
			value : function (e) {
				if (this.count > 0) {
					document.body.removeChild(this.history[this.count]);
					this.count--;
					document.body.insertBefore(this.history[this.count], byId("serzone"));
				}
			},
			configurable : false
		},

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
	this.history.push( Canvas.cloneNode(true) );

	var self = this;
	this.steps.forEach( function (e, idx, steps) {
		e.fire();

		if (idx < steps.length - 1) {
			steps[idx+1].init();
		}
		self.history.push( Canvas.cloneNode(true) );
	});

	document.body.insertBefore(self.history[self.count], byId("serzone"));
}

Spike.prototype = {
	init : function () {
		// next
		var self = this;
		this.eventType.next.mouse.forEach(
			function (e) {
				document.body.addEventListener(e, function () {
					self.next();
				});
			}
		);

		document.body.addEventListener("keypress", function(e) {
			if (self.eventType.next.keycode.indexOf(e.keyCode) > -1) {
				self.next();
			}
		});
	}
};

Serzone.init = function () {
	Serzone.parser = new Parser;
	Serzone.parser.parse();

	Serzone.slides = Serzone.parser.slides;
	Serzone.steps  = Serzone.parser.steps;

	Serzone.spike  = new Spike(Serzone.steps);
	Serzone.spike.init();

	document.body.insertBefore(Canvas, byId("serzone"));
};

//}());
