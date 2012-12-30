var Serzone = {};
Serzone.action = {};

(function (Serzone) {
	// Utility
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

			if (slide.previous == null || slide.depth <= slide.previous.depth) {
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

		transformCanvas : function (x, y) {
			x -= translateMargin.x;
			y -= translateMargin.y;

			this.canvas.transition({
				x : "-=" + x,
				y : "-=" + y
			}, 1000);
		}
	};

	var always = (function () {
		var n = Number(document.location.hash.replace("#", "")) || 0;

		return function (i) {
			if (i >= n && $.fn.off) {
				$.fx.off = false;
			}
		};
	}());

	$.fx.off = true;

	Serzone.action = {
		always : (function () {
			var i = 0;

			return {
				init : function () {
					console.log("always init")
					always(i++);
				},
				fire : function () {
					console.log("always fire")
					always(i++);
				}
			};
		}()),

		section : {
			type : "changeSlide",
			init : function (slide, that) {
				if (slide.order == 0) {
					changeSlide.initialize();
				}

				var body = changeSlide.addTable(slide, 2).find("div:first");
				body.find("summary").hide();

				changeSlide.transformCanvas(body.position().left, body.position().top);

				console.log("section init");
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

				console.log("section fire");
			}
		},

		appear : {
			type : "inherit",
			init : function (body) {
				console.log("appear init");
				$(body).hide();
			},
			fire : function (body) {
				console.log("appear fire");
				$(body).show(1000);
			}
		},

		mark : {
			type : "inherit",
			init : function (body) {
				// none
				console.log("mark init");
			},
			fire : function (body) {
				var t = $(body).attr("t");

				console.log("mark fire");

				$(body).parent().find("m[t!=" + t + "]").css({
					background : '',
					color      : ''
				});

				$(body).parent().find("m[t=" + t + "]").css({
					background : "#DDD",
					color      : "#007"
				});
			}
		},

		src: {
			type : "inherit",
			init : function (o) {
				$(o).hide();
				console.log("src init");
			},
			fire : function (o) {
				arrayify( o.querySelectorAll("pre code") ).filter(
					function (e) {
					return e.nodeType != 3;
				}).forEach( function (e) {
					hljs.highlightBlock(e, '<span class="indent"></span>', false);
				})
				$(o).show(1000);

				console.log("src fire");
			}
		},
	};
}(Serzone));
