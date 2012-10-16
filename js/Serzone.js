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
				function (a, b) { return a.order - b.order; }
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
				function (a, b) { return a.order - b.order; }
			);
		},

		configurable : false
	},

	descendants : {
		get : function () {
			var descendants = this.children;

			this.children.filter( function (c) {
				return c.descendants.length > 0;
			}).forEach( function (c) {
				descendants = descendants.concat(c.descendants);
			});

			return descendants;
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
	}
});

/*
 * Step Class
 */

function Step (order, obj, name, parent) {
	Tree.call(this, order, parent);

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
			function getSlideSteps (elem, parent, order) {
				var step = new Step(order, elem, elem.getAttribute("action"), parent);

				step.children = containedDirectlyNodes(".step", elem).map(
					function (e, i) { return getSlideSteps(e, step, i); }
				);

				step.children.forEach( function (s, i, steps) {
					s.siblings = steps.slice(0, i);
					s.siblings = steps.slice(i + 1);
				});

				return step;
			}

			if (this.$steps == undefined) {
				this.$steps = containedDirectlyNodes(".step", this.body).map(
					function (e, i) { return getSlideSteps(e, null, i); }
				);
				this.$steps.forEach( function (s, i, steps) {
					s.siblings = steps.slice(0, i);
					s.siblings = steps.slice(i + 1);
				});
			}

			return this.$steps;
		},

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
		function parseSlides (section, order, parent) {
			parent = parent || null;

			var current = new Slide(order, section, parent);
			
			var children = containedDirectlyNodes("section", section).map(
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

		this.slides = containedDirectlyNodes("section", byId("serzone")).map(
			function (section, i, serzoneChildren) {
				var order = (i == 0 ? 0 : $("section", serzoneChildren[i-1]).length + 1);
				
				return parseSlides(section, order);
			}
		);

		this.slides.forEach( function (s, i, slides) {
			s.siblings = slides.slice(0, i);
			s.siblings = slides.slice(i + 1);
		});
	},
	
	stepParser : function () {
		this.steps = this.slides.map( function (slide, i) { 
			var step      = new Step(i, slide, "changeSlide", null);

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
		$steps : { value : steps, writable : false, configurable : false },
		$count : { value : 0,     writable : true,  configurable : false },
		$history : { value : [], writable : true, configurable : false },

		next : {
			value : function (e) {
				if (this.$count < this.$history.length - 1) {
					document.body.removeChild(this.$history[this.$count]);
					this.$count++;
					document.body.insertBefore(this.$history[this.$count], byId("serzone"));
				}
			},
			configurable : false
		},

		previous : {
			value : function (e) {
				if (this.$count > 0) {
					document.body.removeChild(this.$history[this.$count]);
					this.$count--;
					document.body.insertBefore(this.$history[this.$count], byId("serzone"));
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
	this.$history.push( Canvas.cloneNode(true) );

	var self = this;
	this.steps.forEach( function (e, idx, steps) {
		e.fire();

		if (idx < steps.length - 1) {
			steps[idx + 1].init();
		}
		self.$history.push( Canvas.cloneNode(true) );
	});

	document.body.insertBefore(self.$history[self.$count], byId("serzone"));
}

Object.defineProperties(Spike.prototype, {
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
});

Serzone.init = function () {
	Parser.init();
	Parser.parse();
	Serzone.slides = Parser.slides;
	Serzone.steps  = Parser.steps;

	Serzone.spike  = new Spike(Serzone.steps);
	Serzone.spike.init();

	document.body.insertBefore(Canvas, byId("serzone"));
};

//}());
