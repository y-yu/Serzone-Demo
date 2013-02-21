var Serzone = {};
Serzone.action = {};

(function (Serzone) {
	/*
	 * Utility
	 */
	function arrayify (e) {
		return Array.prototype.slice.call(e);
	}
	
	var translateMargin = {
		x : 30,
		y : 0,
	};

	var changeSlide = {
		$table : [ $("<table><tbody><tr></tr></tbody></table>") ],

		get currentTable ()  { return this.$table[0]; },
		set currentTable (t) { this.$table.unshift(t); },

		shiftTable : function () { 
			if (this.$table.length > 1) {
				var t = this.$table.shift(); 
				t.remove();
				return t;
			} else {
				return this.$table[0];
			}
		},

		initialize : function () {
			this.canvas = $(Serzone.canvas).append(this.currentTable);
			$("#serzone", this.canvas.parent()).remove();
		},

		addTable : function (slide, n) {
			var body = $("<td></td>").append(slide.body).hide("_default");

			if (slide.previousNode === null || slide.depth <= slide.previousNode.depth) {
				var tr = $("tbody:first > tr:last", this.currentTable);

				if ($("td", tr).length < n) {
					tr.append(body);
				} else {
					this.currentTable.find("tbody:first").append("<tr></tr>").find("tr:last").append(body);
				}
			} else {
				var table = $("<table><tbody><tr></tr></tbody>").find("tr").append(body).end();
				$(slide.parent.body).append(table);

				this.currentTable = table;
			}

			body.show("_default");

			return body;
		},

		rootSlide : function rootSlide(slide) {
			if (slide.parent !== null) {
				return rootSlide(slide.parent);
			} else {
				return slide;
			}
		},

		transformCanvas : function (x, y) {
			x -= translateMargin.x;
			y -= translateMargin.y;

			this.canvas.transition({
				x : "-=" + x,
				y : "-=" + y
			});
		}
	};

	var warp = true;
	function toggleAnimation (e) {
		if (e && e.shiftKey && !$.fx.off) {
			$.fx.off = true;
			$.fx.speeds._default = 0;

			return false;
		} else if (!warp) {
			$.fx.off = false;
			$.fx.speeds._default = 1000;

			return true;
		} else {
			return false;
		}
	}

	var always = (function () {
		var n = Number(document.location.hash.replace("#", "")) || 0;

		return function (i) {
			if (i >= n && $.fx.off) {
				warp = false;
				$.fx.off = false;
				$.fx.speeds._default = 1000;
			}
		};
	}());

	$.fx.off = true;
	$.fx.speeds._default = 0;

	/*
	 * Main
	 */
	Serzone.action = {
		always : (function () {
			var i = 0;

			return {
				next : {
					init : function () {
						//console.log("always next init")
						always(i++);
					},
					fire : function () {
						//console.log("always next fire")
						always(i++);
					}
				},
				back : {
					init : function () {
						//console.log("always back fire");
					},
					fire : function () {
						//console.log("always back fire");
					}
				}
			};
		}()),

		section : {
			type : "changeSlide",

			next : {
				init : function (slide, step, event) {
					var animation = toggleAnimation(event);

					if (slide.order === 0) {
						changeSlide.initialize();
					}

					var body = changeSlide.addTable(slide, 2).find("div:first");
					body.find("summary").hide();

					changeSlide.transformCanvas(body.position().left, body.position().top);

					toggleAnimation(event);

					console.log("section next init");

					return (animation ? 1000 : 0);
				},

				fire : function (slide) {
					var animation = toggleAnimation(event);

					if (slide.children.length > 0) {
						changeSlide.shiftTable();

						var pos = $(slide.body).position();
						slide.children.forEach( function (e) {
							$(e.body).hide("_default");
						});

						changeSlide.transformCanvas(pos.left, pos.top);
					}
					
					$(slide.body).find("summary").show("_default");

					toggleAnimation(event);

					console.log("section next fire");

					return (animation ? 1000 : 0);
				}
			},

			back : {
				init : function (slide, step, event) {
					var body  = $(slide.body),
						tr    = body.parent().parent();

					var animation = toggleAnimation(event);

					body.parent().remove();
					
					if (tr.find("td").length === 0) {
						tr.remove();
					}

					if (slide.depth === slide.previousNode.depth) {
						var pos = $(slide.previousNode.body).position();
					} else if (slide.depth < slide.previousNode.depth) {
						var pos = $( changeSlide.rootSlide(slide.previousNode).body ).position();
					} else {
						changeSlide.shiftTable();						
						var pos = $(slide.previousNode.body).position();
					}

					changeSlide.transformCanvas(pos.left, pos.top);

					toggleAnimation(event);

					console.log("section back init");

					return (animation ? 1000 : 100);
				},

				fire : function (slide, step, event) {
					var animation = toggleAnimation(event);

					$(slide.body).find("summary").hide(0);

					if (slide.children.length > 0) {
						this.currentTable = $(slide.body).find("table");

						slide.children.forEach(function (e) {
							$(e.body).show(0);
						});

						var last = slide.children.length - 1,
							pos  = $( slide.children[last].body ).position();

						changeSlide.transformCanvas(pos.left, pos.top);
					}

					console.log("section back fire");

					toggleAnimation(event);

					return (animation ? 1000 : 100);
				}
			}
		},

		appear : {
			type : "inherit",
			next : {
				init : function (body) {
					console.log("appear next init");
					$(body).hide();
				},
				fire : function (body, step, event) {
					var animation = toggleAnimation(event);
					
					console.log("appear next fire");
					$(body).show("_default");

					return (animation ? 1000 : 0);
				}
			},
			back : {
				init : function () {
					// none
					console.log("appear fire init");
				},
				fire : function (body, step, event) {
					var animation = toggleAnimation(event);

					$(body).hide("_default");
					console.log("appear fire fire");

					return (animation ? 1000 : 0);
				}
			}
		},

		hide : {
			type : "inherit",
			next : {
				init : function (body) {
					//none
					console.log("hide next init");
				},
				fire : function (body, step, event) {
					var animation = toggleAnimation(event);

					console.log("hide next fire");
					$(body).fadeOut("_default");

					return (animation ? 1000 : 0);
				}
			},
			back : {
				init : function () {
					// none
					console.log("hide fire init");
				},
				fire : function (body, step, event) {
					var animation = toggleAnimation(event);

					$(body).fadeIn("_default");
					console.log("hide fire fire");

					return (animation ? 1000 : 0);
				}
			}
		},

		mark : {
			type : "inherit",
			next : {
				init : function (body) {
					// none
					console.log("mark next init");
				},
				fire : function (body, step, event) {
					var t = $(body).attr("t");

					$(body).parent().find("m[t=" + t + "]").css({
						background : "#DDD",
						color      : "#007"
					});
					console.log("mark next fire");

					return 0;
				}
			},
			back : {
				init : function () {
					// none
					console.log("mark back init");
				},
				fire : function (body, step) {
					var t = $(body).attr("t");

					$(body).parent().find("m[t=" + t + "]").css({
						background : "",
						color      : ""
					});

					console.log("mark back fire");

					return 100;
				}
			}
		},

		src: {
			type : "inherit",
			next : {
				init : function (o) {
					$(o).hide(0);
					arrayify( o.querySelectorAll("pre code") ).filter(
						function (e) {
						return e.nodeType !== 3;
					}).forEach( function (e) {
						hljs.highlightBlock(e, '<span class="indent"></span>', false);
					})
	
					console.log("src next init");
				},
				fire : function (o, step, event) {
					var animation = toggleAnimation(event);

					$(o).show("_default");
					console.log("src next fire");

					return (animation ? 1000 : 0);
				}
			},
			back : {
				init : function () {
					console.log("src back init");
				},
				fire : function (o, step, event) {
					var animation = toggleAnimation(event);

					$(o).hide("_default");

					console.log("src back fire");

					return (animation ? 1000 : 0);
				}
			}
		},
	};
}(Serzone));
