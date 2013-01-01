var Serzone = {};
Serzone.action = {};

Serzone.action = {
	section : {
		type : "changeSlide",
		next : {
			init : function (slide) {
				if (slide.order == 0) {
					$("#serzone").remove();
				}

				$(Serzone.canvas).append(slide.body);
			},
			fire : function (slide) {
				$(slide.body).remove();
			}
		},
		back : {
			init : function (slide) {
				$(slide.body).remove();
			},
			fire : function (slide) {
				$(Serzone.canvas).append(slide.previous.body);
			}
		}
	}
};
