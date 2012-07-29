var Serzone = Serzone || {};
Serzone.view = Serzone.view || {};

(function () {
	/*
	 * Utility functions
	 */
	function arrayify (e) {
		return Array.prototype.slice.call(e);
	}

	function byId (id, root) {
		root = root | document;
		return root.getElementById(id);
	}

	function $ (selecter, root) {
		root = root | document;
		return root.querySelector(selecter);
	}

	function $$ (selecter, root) {
		root = root | document;
		return root.querySelectorAll(selecter);
	}

	/*
	 * CSS Class
	 */
	function CSS (elem) {
		this.css = [];

		this.css.push(elem.style);
		this.elem = elem;
	}

	CSS.prototype = {
		get : function (num) {
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
			// after

			return false;
		}
	}

	/*
	 * Step Class
	 */
	function Step (elem, name) {
		this.elem   = elem;
		this.name   = name || elem.getAttribute("action");
		this.action = Object.create(Serzone.view[name]);

		//this.action.init();
	}

	Step.prototype = {
		init : function () {
			return this.action.init(this.elem);
		},

		fire : function () {
			return this.action.fire(this.elem);
		}
	};

	/*
	 * Slide Class
	 */
	function Slide (order, elem, depth) {
		//parent, children, siblings : Array.<Slide>
		this.order  = order;
		this.elem   = elem;
		//this.layer  = layer;
		//this.parent = parent;
		this.css    = new CSS(elem);

		var body   = document.createElement("div");
		body.classList.add("slide");

		arrayify(elem.childNodes).filter( function (child) {
			return child.tagName != "SECTION";
		} ).forEach( function (child) {
			if (child.className == "step") {
				this.steps.push( new Step(child) );
			}
			elem.removeChild(child);
			body.appendChild(child);
		});
		this.body = body;

		this.children = [];
		this.siblings = [];
	}

	Slide.prototype = {
		getOrder : function () {
			return this.order;
		},

		getChildren : function () {
			return this.children;
		},

		setChild : function (slide) {
			// slide : Slide
			this.children.push(slide).sort(
				function (a, b) {
					return a.getOrder() < b.getOrder();
				}
			);
		},

		getParent : function () {
			return this.parent;
		},

		getNthChild : function (num) {
			return this.children[num];
		},

		getSiblings : function () {
			return this.siblings;
		},

		setSibling : function (slide) {
			// slide : Slide
			this.siblings.push(slide).sort(
				function (a, b) {
					return a.getOrder() < b.getOrder();
				}
			);
		},

		getSteps : function () {
			return this.steps;
		}
	}

	/*
	 * Parser Class
	 */
	function Parser () {
		this.slides = [];
		this.steps  = [];	// Array.<Step>
	}

	Parser.prototype = {
		//setOrder : function (canvas) {
		//	arrayify(canvas.getElementsByTagName).forEach(
		//		function (e, idx) {
		//		}
		//	);
		//},
		//
		//// 最下スライド（葉）が0となる。
		//parseSlides : function (section, layer) {
		//	// ある階層の子要素を検索
		//	var children = arrayify(section.childNodes).filter(
		//		function ( child ) {
		//			return child.tagName == "SECTION";
		//		}
		//	);

		//	// 深さの初期値
		//	layer = layer || -1;

		//	// 現在の要素の下にsectionがあれば
		//	if (children.length > 0) {
		//		layer = children.forEach(
		//			function (c) {
		//				return this.parseSlides(child, layer);
		//			}
		//		).sort(
		//			function (a, b) {
		//				return a < b;
		//			}
		//		).shift() || 0;
		//	}

		//	layer++;

		//	children.forEach(
		//		function ( childSection ) {
		//			var childSection = new Slide(idx, c, layer);
		//		}
		//	);

		//	return layer;
		//},

		//execute : function (serzone) {
		//	// after

		//	return {
		//		slides : "aa", // after
		//		steps  : "'''", // after
		//	};
		//},

		// beta edition
		parse : function () {
			var self = this;
			arrayify(document.getElementsByTagName("SECTION")).forEach(
				function (e, i) {
					self.slides.push(new Slide(i, e, 0));
					self.steps.push(new Step(e, "changeSlide"));
				}
			);
		},

		getSlides : function () {
			return this.slides;
		},

		getSteps  : function () {
			return this.steps;
		}
	}

	// 初期化
	Serzone.parser = new Parser;
	Serzone.parser.parse();

	Serzone.slides = Serzone.parser.getSlides();
	Serzone.steps  = Serzone.parser.getSteps();
})();
