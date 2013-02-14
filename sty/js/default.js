var Serzone = {};
Serzone.action = {};

function arrayify (e) {
	return Array.prototype.slice.call(e);
}

function makeIndex (slide, now, scale) {
	if (slide.body.getElementsByClassName("indexTable")[0] != undefined) {
		slide.body.removeChild( slide.body.getElementsByClassName("indexTable")[0] );
	}

	var table = document.createElement("table");
	
	table.appendChild(
		slide.children.map( function (s) {
			var td = document.createElement("td");

			if (s.order <= now) {
				td.appendChild(s.body);
			} else {
				td.appendChild( s.body.getElementsByTagName("h1")[0].cloneNode(true) );
			}

			return td;
		}).reduce( (function(x, y) {
			if (x[x.length - 1].length == 1) {
				x[x.length - 1].push(y);
			} else {
				x.push([y]);
			}

			return x;
		}), [[]]).reduce( (function (tbody, tds) {
			var tr = tds.reduce( (function (x, y) {
				x.appendChild(y);
				return x;
			}), document.createElement("tr") );

			tbody.appendChild(tr);
			return tbody;
		}),	document.createElement("tbody")) );

	table.classList.add("indexTable");

	table.style.marginTop = "30px";
	table.style.marginBottom = "10px";

	table.style.webkitTransformOrigin = "left top";
	table.style.webkitTransform = "scale(" + scale + ", " + scale + ")";
	table.style.webkitTransition = "all 1s ease-in-out 0ms";

	return table;
}

var left =  40;

function getOffset (e) {
	var x = 0,
		y = 0;

	while (e != null) {
		x += e.offsetLeft;
		y += e.offsetTop;

		e = e.offsetParent;
	}

	return { x : x, y : y };
}

Serzone.action = {
	section : {
		type : "next",
		init : function (slide) {
			if (slide.order == 0) {
				document.body.removeChild( document.getElementById("serzone") );
				Serzone.canvas.style.webkitTransition = "-webkit-transform 1s ease-in-out 0ms";
			}

			if (slide.children.length == 0) {
				if (slide.depth > 0) {
					var parent = slide.parent.body.parentNode;
					var table = makeIndex(slide.parent, slide.order, 0.5);

					parent.removeChild(slide.parent.body);

					slide.parent.body.appendChild(table);
					parent.appendChild(slide.parent.body);
					var offset = getOffset(slide.body.parentNode);

					Serzone.canvas.style.webkitTransform = "translate(" + (left - offset.x) + 
						"px, " + (20 - offset.y) + "px)";

					table.style.webkitTransform = "scale(1, 1)";
					table.style.webkitTransformOrigin = "left top";
				} else {	
					Serzone.canvas.appendChild(slide.body);
					Serzone.canvas.style.webkitTransform = "translate(" + (left - slide.body.offsetLeft) + 
						"px, " + (20 - slide.body.offsetTop) + "px)";
				}
			} else {
				if (slide.depth > 0) {
					var parent = slide.parent.body.parentNode;
					parent.removeChild(slide.parent.body);

					var table = makeIndex(slide, slide.order, 1);
					slide.body.appendChild(table);

					var table2 = makeIndex(slide.parent, slide.order, 0.5);
					slide.parent.body.appendChild(table2);
					parent.appendChild(slide.parent.body);

					var offset = getOffset(slide.body.parentNode);

					Serzone.canvas.style.webkitTransform = "translate(" + (left - offset.x) + 
						"px, " + (20 - offset.y) + "px)";

					table2.style.webkitTransform = "scale(1, 1)";
					table2.style.webkitTransformOrigin = "left top";
				} else {
					var table = makeIndex(slide, slide.order, 1);
					
					slide.body.appendChild(table);
					Serzone.canvas.appendChild(slide.body);

					var offset = getOffset(slide.body);	

					Serzone.canvas.style.webkitTransform = "translate(" + (left - offset.x) + 
						"px, " + (20 - offset.y) + "px)";
				}

				table.style.webkitTransform = "scale(0.5, 0.5)";
				table.style.webkitTransformOrigin = "left top";
			}
			//console.log("Slide init");
		},
		fire : function (slide) {
			if (slide.depth > 0) {
				var parent = slide.parent.body.parentNode;
				parent.removeChild(slide.parent.body);

				var table = makeIndex(slide.parent, slide.order, 1);
				
				slide.parent.body.appendChild(table);
				parent.appendChild(slide.parent.body);
				
				var offset = getOffset(slide.parent.body);
				Serzone.canvas.style.webkitTransform = "translate(" + (left - offset.x) + 
					"px, " + (20 - offset.y) + "px)";

				table.style.webkitTransform  = "scale(0.5, 0.5)";
				table.style.webkitTransformOrigin = "left top";

			}
			//console.log("Slide fire");
		}
	},

	appear : {
		type : "inherit",
		init : function (o) {
			o.style.webkitTransition = "color 0s ease-in-out 0ms"
			o.style.webkitTransition = "color 1s ease-in-out 0ms"

			console.log("appear init");
		},
		fire : function (o) {
			o.style.color = "#000";
			o.style.textShadow = "0 2px 2px rgba(0, 0, 0, .1)";
			
			console.log("appear fire");		
		}
	},

	src: {
		type : "inherit",
		init : function (o) {
			o.style.webkitTransition = "opacity .5s linear";

			arrayify( o.querySelectorAll("pre code") ).filter(
				function (e) {
					return e.nodeType != 3;
				}).forEach( function (e) {
					console.log(e);
					hljs.highlightBlock(e, '<span class="indent"></span>', false);
				});

			//console.log("src init");
		},
		fire : function (o) {
			o.style.opacity = "0.5";
			//console.log("src fire");
		}
	},

	dvi : {
		type : "inherit",
		init :  function (o) {
			// var dvi = document.createElement("div");
			// dvi.id = "div";
			// o.obj.appendChild(dvi);
		},
		fire : function (o) {
			var file = o.innerText.replace("/\s/g", "");
			var dvi  = arrayify(o.childNodes).filter( function (e) {
				return e.id == "dvi";
			}).push();

			dvi_load("#dvi", file);

			arrayify(o.childNodes).filter( function(e) {
				return e.nodeType == 3;
			}).forEach( function (e) {
				o.removeChild(e);
			});
			//dvi.id = undefined;
		}
	}
};

