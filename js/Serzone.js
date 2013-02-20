(function () {
"use strict";

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
				return c.compareDocumentPosition(child) !== DESCENDANT;
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
			if (this.$order === undefined) {
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
			return ( this.$parent !== undefined ? this.$parent : null );
		},

		set : function (parent) {
			this.$parent = parent;
		},

		configurable : false
	},

	depth : {
		get : function () {
			return (function getDepth(self, depth) {
					if (self.parent === null) {
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
			var candidates = this.siblings.filter(
					function (s) { return s.order >= this.order; }, this
				);

			return (candidates.length !== 0 ? candidates[0] : null);
		},

		configurable : false
	},

	nextNode : {
		get : function () {
			if (this.children.length !== 0) {
				return this.children[0];
			}

			return (function findNext (self) {
				if ( self.nextSibling !==  null ) {
					return self.nextSibling;
				}
				else if ( self.parent !== null ) {
					return findNext(self.parent);
				}
				else {
					return null;
				}
			}(this));
		},

		configurable : false
	},

	previousNode : {
		get : function () {
			var candidate = this.siblings.filter( function (e) {
				return e.order < this.order;
			}, this).pop();

			if (candidate === undefined) {
				return this.parent;
			} else if (candidate.nextNode === this) {
				return candidate;
			} else {
				var d = candidate.descendants.pop();
				return (d !== undefined ? d : null);
			}
		}
	}
});

/*
 * Step Class
 */

var id = 0;
function Step (obj, name, parent) {
	var self = this;

	Tree.call(this, null, parent);

	Object.defineProperties( this, {
		$id    : { value : id++,   writable : true,  configurable : false },
		$obj   : { value : obj,   writable : true,  configurable : false },
		$name  : { value : name,  writable : false, configurable : false },
		$type  : { value : Serzone.action[name].type, writable : false, configurable : false },
		$flag1 : { value : false, writable : true, configurable : false },
		$flag2 : { value : false, writable : true, configurable : false },

		obj  : {
			get : function () {
				if (this.$obj instanceof HTMLElement) {
					var inCanvas = $("#step-" + this.order)[0];

					if (inCanvas !== undefined) {
						this.$obj = inCanvas;
					}
				}

				return this.$obj;
			}
		},

		next : {
			value : {
				init : function (event) {
					self.$flag1 = true;

					if (Serzone.action.always !== undefined && Serzone.action.always.next !== undefined) {
						Serzone.action.always.next.init(self.obj, self, event);
					}

					return Serzone.action[name].next.init(self.obj, self, event);
				},

				fire : function (event) {
					if (self.$flag1) {
						if (Serzone.action.always !== undefined && Serzone.action.always.next !== undefined) {
							Serzone.action.always.next.fire(self.obj, self, event);
						}

						self.$flag2 = true;
						return Serzone.action[name].next.fire(self.obj, self, event);
					} else {
						return this.init(event);
					}
				},
			},
			writable : false,
			configurable : false
		},

		back : {
			value : {
				init : function (event) {
					if (Serzone.action.always !== undefined && Serzone.action.always.back !== undefined) {
						Serzone.action.always.back.init(self.obj, self, event);
					}

					self.$flag1 = false;

					return Serzone.action[name].back.init(self.obj, self, event);
				},

				fire : function (event) {
					if (self.$flag2) {
						if (Serzone.action.always !== undefined && Serzone.action.always.back !== undefined) {
							Serzone.action.always.back.fire(self.obj, self, event);
						}

						self.$flag2 = false;

						return Serzone.action[name].back.fire(self.obj, self, event);
					} else {
						return this.init(event);
					}
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
						return Serzone.action[e].type === "changeSlide"
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
			value : new Step(this, slideKey, (parent === null ? null : parent.$mine)),
			writable : true,
			configurable : false
		},

		body : {
			get : function () {
				var inCanvas = $("#slide-" + this.order)[0];

				if (inCanvas !== undefined) {
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

	arrayify(elem.childNodes).forEach( function (child) {
		this.body.appendChild(child.cloneNode(true));
	}, this); 
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
						return Serzone.action[e].type === "changeSlide"
					})[0];

			function getSlideSteps (elem, parent) {
				if (elem.tagName.toLowerCase() === slideKey) {
					var step = self.children[count].$mine;

					self.body.removeChild(elem);

					step.children = self.children[count++].steps;
				} else {
					var step = new Step(elem, elem.tagName.toLowerCase(), parent);

					step.children = containedDirectlyNodes(keys, elem).map(
						function (e) {
							var s = new Step(self.children[count], slideKey, step);

							if (e.tagName.toLowerCase() === slideKey) {
								s.children = self.children[count++].steps;

								return s;
							} else {
								return getSlideSteps(e, step);
							}
						});
					
					step.children.forEach( function (s, i, steps) {
						s.siblings = steps.slice(0, i);
						s.siblings = steps.slice(i + 1);
					});
				}

				return step;
			}

			if (this.$steps === undefined) {
				this.$steps = containedDirectlyNodes(keys, this.body).map(
					function (e) {
						return getSlideSteps(e, this.$mine);
					}, this);

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
		if ( byId("serzone") === null ) {
			throw new Error("Don't have element which has id=serzone");
		}
	},

	slideParser : function () {
		var slideKey = Object.keys(Serzone.action).filter(function (e) {
				return Serzone.action[e].type === "changeSlide"
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
				return Serzone.action[e].type === "changeSlide"
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
						if (i === 0) {
							sum += 1;
						} else {
							sum += c[i-1].descendants.length + 1;
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
			mouse   : undefined,
			keycode : [39, 40, 32, 13]
		},
		back : {
			mouse   : undefined,
			keycode : [37, 38]
		}
	},
	$slide : undefined, // Step Object
	$stack : [],
	$end   : [],

	refreshStack : function (event) {
		var self = this;

		this.$stack = (function rec (c) {
			if (c.$type === "inherit") {
				c.next.init(event);
				
				var r = [c];
				r = r.concat( c.children.reduce( (function (x, y) {
					return x.concat( rec(y) );
				}), []));

				return r;
			} else {
				return [ {
					next : {
						fire : function (event) {
							var t = c.next.fire(event);

							self.$stack = c.children.reduce(
								(function (x, y) { return x.concat( rec(y) ); }), []
							).concat(c).concat(self.$stack);

							return t;
						},
					},
					back : {
						fire :function (event) {
							var t = c.back.fire(event);

							self.$stack = self.$stack.filter(
								function (e) {
									return c.descendants.every( function (x) {
										return e instanceof Step ? e !== x : e.$o !== x;
									}) && (e instanceof Step ? e !== c : e.$o !== c);
								});

							return t;
						}
					},
					$o : c
				} ];
			}
		}(this.$slide));
	},

	next : function (e) {
		var step = this.$stack.shift();
		this.$end.unshift(step);

		if (step !== undefined) {
			var t = step.next.fire(e);
		}

		if (this.$stack.length <= 0) {
			if (this.$slide.nextSibling !== null) {
				this.$slide = this.$slide.nextSibling;

				this.refreshStack(e);
			}
		}

		return (step !== undefined ? t : Infinity);
	},

	back : function (e) {
		if (this.$end.length > 0) {
			var step = this.$end.shift();

			var t = step.back.fire(e)
			this.$stack.unshift(step);

			return t;
		} else {
			return Infinity;
		}
	},

	start : function (slide) {
		this.$slide = slide;
		this.refreshStack(undefined);

		var n = (document.location.hash ? Number(document.location.hash.replace("#", "")) : 1);
		var self = this;

		for (var i = 0; i < n; i++) {
			setTimeout(function () {
				self.next(undefined);
			}, 1);
		}
		this.setEvent(n);
	},

	setEvent : function (i) {
		var self = this;

		var input = [];
		
		var flag = true;
		function countTimes (e) {
			input.push(e);
		}

		function keyEvent (e) {
			if (self.$eventType.next.keycode.indexOf(e.keyCode) > -1) {
				var type = "next";
			} else if (self.$eventType.back.keycode.indexOf(e.keyCode) > -1) {
				var type = "back";
			} else {
				return;
			}

			var t = self[type](e) || 0;
			if (t === Infinity) { return; }

			type === "next" ? i++ : i--;
			document.location.hash = i;

			document.removeEventListener("keydown", keyEvent, false);
			document.addEventListener("keydown", countTimes, false);

			setTimeout( function () {
				document.removeEventListener("keydown", countTimes, false);

				if (input.length === 0) {
					document.addEventListener("keydown", keyEvent, false);
				} else {
					keyEvent( input.shift() );
				}
			}, t );
		}

		document.addEventListener("keydown", keyEvent, false);
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

