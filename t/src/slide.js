SlideTest = TestCase("SlideTest");

SlideTest.prototype.setUp = function () {
	/*:DOC += 
		<div id="serzone">
			<section>
				<h1>Slide 0</h1>
			</section>

			<section>
				<h1>Slide 1</h1>

				<section>
					<h1>Slide 1-0</h1>
				</section>

				<section>
					<h1>Slide 1-1</h1>
				</section>
			</section>
		</div>
	*/
    
	Serzone.start();
};

SlideTest.prototype["test Serzone has slides and it is Array"] = function () {
	assertArray(Serzone.slides);
};

SlideTest.prototype["test slide element has children"] = function () {
	assertEquals([], Serzone.slides[0].children);
	assertArray(Serzone.slides[1].children);
}

SlideTest.prototype["test order of slides"] = function () {
	assertEquals(0, Serzone.slides[0].order);
	assertEquals(1, Serzone.slides[1].order);
	assertEquals(2, Serzone.slides[1].children[0].order);
	assertEquals(3, Serzone.slides[1].children[1].order);
};

SlideTest.prototype["test work children and parent property"] = function () {
	var slide0 = Serzone.slides[0];
	var slide1 = Serzone.slides[1];

	assertNull(slide0.parent);
	assertNull(slide1.parent);
	assertEquals(slide1, slide1.children[0].parent);
	assertEquals(slide1, slide1.children[1].parent);
};

SlideTest.prototype["test descendants property"] = function () {
	assertEquals([], Serzone.slides[0].descendants);
	assertEquals(2, Serzone.slides[1].descendants.length);

	Serzone.slides[1].children.forEach( function (c, i) {
		assertEquals(c, Serzone.slides[1].descendants[i]);
	});
};

SlideTest.prototype["test depth property"] = function () {
	var slide0 = Serzone.slides[0];
	var slide1 = Serzone.slides[1];

	assertEquals(0, slide0.depth);
	assertEquals(0, slide1.depth);
	slide1.children.forEach( function (c) {
		assertEquals(1, c.depth);
	});
};

SlideTest.prototype["test work siblings property"] = function () {
	var slide0 = Serzone.slides[0];
	var slide1 = Serzone.slides[1];

	assertArray(slide0.siblings);
	assertArray(slide1.siblings);

	assertEquals(slide1, slide0.siblings[0]);
	assertEquals(slide0, slide1.siblings[0]);

	assertEquals(slide1.children[0], slide1.children[1].siblings[0]);
	assertEquals(slide1.children[1], slide1.children[0].siblings[0]);
};

SlideTest.prototype["test nextSibling property"] = function () {
	var slide0 = Serzone.slides[0];
	var slide1 = Serzone.slides[1];

	assertEquals(slide1, slide0.nextSibling);
	assertNull(slide1.nextSibling);

	var slide1_0 = slide1.children[0];
	var slide1_1 = slide1.children[1];

	assertEquals(slide1_1, slide1_0.nextSibling);
	assertNull(slide1_1.nextSibling);
};

SlideTest.prototype["test nextNode property"] = function () {
	var slide0 = Serzone.slides[0];
	var slide1 = Serzone.slides[1];
	var slide1_0 = slide1.children[0];
	var slide1_1 = slide1.children[1];

	assertEquals(slide1, slide0.nextNode);
	assertEquals(slide1_0, slide1.nextNode);
	assertEquals(slide1_1, slide1_0.nextNode);
	assertNull(slide1_1.nextNode);
};

SlideTest.prototype["test previousNode property"] = function () {
	var slide0 = Serzone.slides[0];
	var slide1 = Serzone.slides[1];
	var slide1_0 = slide1.children[0];
	var slide1_1 = slide1.children[1];

	assertEquals(slide1_1.previousNode, slide1_0);
	assertEquals(slide1_0.previousNode, slide1);
	assertEquals(slide1.previousNode, slide0);
	assertNull(slide0.previousNode);
};

SlideTest.prototype["test Slide has steps, which is instanceof Array"] = function () {
	Serzone.slides.forEach( function (s) {
		assertArray(s.steps);
	});
};

SlideTest.prototype["test Slide has id based on $order"] = function () {
	var slide0 = Serzone.slides[0];
	var slide1 = Serzone.slides[1];
	var slide1_0 = slide1.children[0];
	var slide1_1 = slide1.children[1];

	var e;
	function resetElement (s) {
		e = document.createElement("div");
		e.appendChild(s.body);
	}

	resetElement(slide0);
	assertNotNull(e.querySelector("#slide-0"));

	resetElement(slide1);
	assertNotNull(e.querySelector("#slide-1"));

	resetElement(slide1_0)
	assertNotNull(e.querySelector("#slide-2"));

	resetElement(slide1_1)
	assertNotNull(e.querySelector("#slide-3"));
};
