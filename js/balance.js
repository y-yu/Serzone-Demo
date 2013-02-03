var Serzone = {};
Serzone.action = {};

(function (Serzone) {
	function arrayify (e) {
		return Array.prototype.slice.call(e);
	}


	var changeSilde = {
		posBox : $("<div id='posbox'></div>"),

		setTransform : function (slide, pos) {
			var body = $(slide.body);

			body.css("position", "absolute");
			body.css("transformOrigin", "top left");
			body.css("z-index", -slide.depth);

			body.transition({
				x : pos.x * 1500,
				y : pos.y * 1500,
				scale : 1/++slide.depth
			});
		},

		initialize : function(slide) {
			$("#serzone").remove();
			$(Serzone.canvas).css("transformOrigin", "top left");
			$(Serzone.canvas).append(changeSilde.posBox);

			var depth = slide.depth;
			var pos   = {
				x : 0,
				y : 0
			};

			this.setTransform(slide, pos);
			this.posBox.append(slide.body);
			$(slide.body).addClass("step");
			slide.pos = { 
				x : 0,
				y : 0
			}

			for (var i = slide.nextNode; i != null; i = i.nextNode) {
				if (depth == i.depth) {
					pos.x++;
				} else if (depth > i.depth) {
					pos.y++;
				}

				i.pos = {};
				i.pos.x = pos.x;
				i.pos.y = pos.y;

				depth = i.depth;

				$(i.body).find("summary").hide();

				this.setTransform(i, pos);
				$(i.body).addClass("step");

				this.posBox.append(i.body);
			}
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
				init : function (slide) {
					if (slide.order == 0) {
						changeSilde.initialize(slide);
					}

					$(Serzone.canvas).removeClass("step-overview");


					if (slide.previousNode != null) {
						$(slide.previousNode.body).removeClass("active");
					}

					$(slide.body).addClass("active");

					changeSilde.posBox.transition({
						x : -slide.pos.x * 1500 + (150 / ++slide.depth),
						y : -slide.pos.y * 1500 + (20  / ++slide.depth)
					});
					$(Serzone.canvas).transition({
						scale : ++slide.depth
					});

					console.log("section next init")
				},
				fire : function (slide) {
					if (slide.parent != null) {
						var parent = slide.parent;

						if (slide.children.length > 0) {
							changeSilde.posBox.transition({
								x : -parent.pos.x * 1500 + (120 / ++parent.depth),
								y : -parent.pos.y * 1500 + (20  / ++parent.depth)
							});
							$(Serzone.canvas).transition({
								scale : ++parent.depth
							});

							$(parent.body).addClass("active")

							if (slide.nextSibling == null) {
								$(parent.body).find("summary").show(1500);
							}
						} else {
							$(slide.body).find("summary").show(1500);
						}
					} else {
						$(slide.body).find("summary").show(1500);

						$(Serzone.canvas).transition({
							scale : 1 / 3
						});
						$(Serzone.canvas).addClass("step-overview");
					}

					console.log("section next fire")
				}
			},

			back : {
				init : function (slide) {
					$(slide.body).removeClass("active");

					var slide = slide.previousNode;

					$(slide.body).addClass("active");

					changeSilde.posBox.transition({
						x : -slide.pos.x * 1500 + (150 / ++slide.depth),
						y : -slide.pos.y * 1500 + (20  / ++slide.depth)
					});
					$(Serzone.canvas).transition({
						scale : ++slide.depth
					});

					console.log("section back init")
				},
				fire : function (slide) {
					$(slide.body).addClass("active");
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
					$(body).show(1500);
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
