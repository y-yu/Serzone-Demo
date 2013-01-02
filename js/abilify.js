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

		get currentTable (b)  { return this.$table[0]; },
		set currentTable (t) { this.$table.unshift(t); },

		shiftTable : function () { 
			if (this.$table.length > 1) {
				return this.$table.shift(); 
			} else {
				return this.$table[0];
			}
		},

		initialize : function () {
			this.canvas = $(Serzone.canvas).append(this.currentTable);
			$("#serzone", this.canvas.parent()).remove();
		},

		addTable : function (slide, n) {
			var body = $("<td></td>").append(slide.body).hide(1000);

			if (slide.previousNode == null || slide.depth <= slide.previousNode.depth) {
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

			body.show(1000);

			return body;
		},

		rootSlide : function rootSlide(slide) {
			if (slide.parent != null) {
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

	var always = (function () {
		var n = Number(document.location.hash.replace("#", "")) || 0;

		return function (i) {
			if (i >= n && $.fx.off) {
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
						console.log("always next init")
						always(i++);
					},
					fire : function () {
						console.log("always next fire")
						always(i++);
					}
				},
				back : {
					init : function () {
						console.log("always back fire");
					},
					fire : function () {
						console.log("always back fire");
					}
				}
			};
		}()),

		section : {
			type : "changeSlide",

			next : {
				init : function (slide, that) {
					if (slide.order == 0) {
						changeSlide.initialize();
					}

					var body = changeSlide.addTable(slide, 2).find("div:first");
					body.find("summary").hide();

					changeSlide.transformCanvas(body.position().left, body.position().top);

					console.log("section next init");
				},

				fire : function (slide, step) {
					if (slide.children.length > 0) {
						changeSlide.shiftTable();

						var pos = $(slide.body).position();
						slide.children.forEach( function (e) {
							$(e.body).hide(1000);
						});

						changeSlide.transformCanvas(pos.left, pos.top);
					}
					
					$(slide.body).find("summary").show(1000);

					console.log("section next fire");
				}
			},

			back : {
				init : function (slide) {
					var body  = $(slide.body),
						tr    = body.parent().parent();

					body.parent().remove();
					
					if (tr.find("td").length == 0) {
						tr.remove();
					}

					if (slide.depth < slide.previousNode.depth) {
						var pos = $( changeSlide.rootSlide(slide.previousNode).body ).position();
					} else {
						var pos = $(slide.previousNode.body).position();
					}

					changeSlide.transformCanvas(pos.left, pos.top);

					console.log("section back init");
				},

				fire : function (slide) {
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
				fire : function (body) {
					console.log("appear next fire");
					$(body).show(1000);
				}
			},
			back : {
				init : function () {
					// none
					console.log("appear fire init");
				},
				fire : function (body) {
					$(body).hide(1000);
					console.log("appear fire fire");
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
				fire : function (body) {
					var t = $(body).attr("t");

					$(body).parent().find("m[t=" + t + "]").css({
						background : "#DDD",
						color      : "#007"
					});
					console.log("mark next fire");
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
				}
			}
		},

		src: {
			type : "inherit",
			next : {
				init : function (o) {
					$(o).hide();
					arrayify( o.querySelectorAll("pre code") ).filter(
						function (e) {
						return e.nodeType != 3;
					}).forEach( function (e) {
						hljs.highlightBlock(e, '<span class="indent"></span>', false);
					})
	
					console.log("src next init");
				},
				fire : function (o) {
					$(o).show(1000);
					console.log("src next fire");
				}
			},
			back : {
				init : function () {
					console.log("src back init");
				},
				fire : function (o) {
					$(o).hide(1000);
					console.log("src back fire");
				}
			}
		},
	};
}(Serzone));
