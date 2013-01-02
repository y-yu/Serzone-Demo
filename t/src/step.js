StepTest = TestCase("StepTest");

StepTest.prototype.setUp = function () {
	/*:DOC += 
		<div id="serzone">

			// Slide 0
			<section>
				<h1>Step 0 (Change Slide)</h1>

				<hoge>
					Step 0-0
				</hoge>

				<hoge>
					Step 0-1
				</hoge>
			</section>

		   // Slide 1
			<section>
				<h1>Step 1 (Change Slide)</h1>

				<hoge>
					Step 1-0
					<hoge>
						Step 1-0-0
					</hoge>

					<hoge>
						Step 1-0-1
					</hoge>

					<hoge>
						Step 1-0-2
					</hoge>
				</hoge>
			</section>

			<section>
				<h1>Step 2 (Change Slide)</h1>

				<hoge>
					Step 2-0
				</hoge>

				<section>
					<h1>Step 2-1 (Change Slide)</h1>

					<hoge>
						Step 2-1-0
					</hoge>
				</section>

				<hoge>
					Step 2-0
				</hoge>
			</section>

		</div>
	*/

	Serzone.start();
};

StepTest.prototype["test Serzone has steps prototype, which is instanceof Array"] = function () {
	assertArray(Serzone.steps);
};

StepTest.prototype["test length of steps equal slide length"] = function () {
	assertEquals(3, Serzone.steps.length);
};

StepTest.prototype["test name of steps which slide has are changeSlide"] = function () {
	Serzone.steps.forEach( function (s) {
		assertEquals("section", s.$name);
	});
};

StepTest.prototype["test steps has children property, which is instanceof Array"] = function () {
	Serzone.steps.forEach( function (s) {
		assertArray(s.children);
	});
};

StepTest.prototype["test length of children property"] = function () {
	assertEquals(2, Serzone.steps[0].children.length);
	assertEquals(1, Serzone.steps[1].children.length);
	assertEquals(3, Serzone.steps[1].children[0].children.length);
};

StepTest.prototype["test descendants property"] = function () {
	assertArray(Serzone.steps[0].descendants);
	assertArray(Serzone.steps[1].descendants);

	assertEquals(2, Serzone.steps[0].descendants.length);
	assertEquals(4, Serzone.steps[1].descendants.length);

	assertEquals(Serzone.steps[0].children.sort(), Serzone.steps[0].descendants.sort());

	var step1Child = Serzone.steps[1].children;
	assertEquals(step1Child[0], Serzone.steps[1].descendants[0]);
	assertEquals(step1Child[0].children[0], Serzone.steps[1].descendants[1]);
	assertEquals(step1Child[0].children[1], Serzone.steps[1].descendants[2]);
};

StepTest.prototype["test order property"] = function () {
	assertEquals(0, Serzone.steps[0].order);
	assertEquals(1, Serzone.steps[0].children[0].order);
	assertEquals(2, Serzone.steps[0].children[1].order);

	assertEquals(3, Serzone.steps[1].order);
	assertEquals(4, Serzone.steps[1].children[0].order);
	assertEquals(5, Serzone.steps[1].children[0].children[0].order);
	assertEquals(6, Serzone.steps[1].children[0].children[1].order);
	assertEquals(7, Serzone.steps[1].children[0].children[2].order);

};

StepTest.prototype["test steps has parent property, and it compare children"] = function () {
	Serzone.steps.forEach( function (step, i, steps) {
		step.children.forEach( function (c) {
			assertEquals(steps[i], c.parent);
		});
	});

	assertEquals(Serzone.steps[1].children[0], Serzone.steps[1].children[0].children[0].parent);

	assertEquals(Serzone.steps[1].children[0], Serzone.steps[1].children[0].children[1].parent);
	assertEquals(Serzone.steps[1].children[0], Serzone.steps[1].children[0].children[2].parent);
};

StepTest.prototype["test depth property"] = function () {
	Serzone.steps.forEach( function (s) {
		assertEquals(0, s.depth);
	});

	Serzone.steps[0].children.forEach( function (s) {
		assertEquals(1, s.depth);
	});

	var step1Child = Serzone.steps[1].children;
	assertEquals(1, step1Child[0].depth);
	assertEquals(2, step1Child[0].children[0].depth);
	assertEquals(2, step1Child[0].children[1].depth);
	assertEquals(2, step1Child[0].children[2].depth);
};

StepTest.prototype["test siblings property"] = function () {
	var step0 = Serzone.steps[0];
	var step1 = Serzone.steps[1];

	assertEquals(2, step0.siblings.length);
	assertEquals(2, step1.siblings.length);
	assertEquals(step1, step0.siblings[0]);
	assertEquals(step0, step1.siblings[0]);

	step0.children.forEach( function (s, i, steps) {
		assertEquals(1, s.siblings.length);
		assertEquals(steps[1 - i], s.siblings[0]);
	});

	var step1_0 = step1.children[0].children;
	var f = function (e) {
		return function (s) {
			return e != s;
		}
	};

	assertEquals(step1_0.filter( f(step1_0[0]) ).sort(), step1_0[0].siblings.sort());
	assertEquals(step1_0.filter( f(step1_0[1]) ).sort(), step1_0[1].siblings.sort());
	assertEquals(step1_0.filter( f(step1_0[2]) ).sort(), step1_0[2].siblings.sort());
};

StepTest.prototype["test nextSibling property"] = function () {
	var step0 = Serzone.steps[0];
	var step1 = Serzone.steps[1];
	var step2 = Serzone.steps[2];

	assertEquals(step1, step0.nextSibling);
	assertEquals(step2, step1.nextSibling);
	assertNull(step2.nextSibling);

	var step0_0 = step0.children[0];
	var step0_1 = step0.children[1];

	assertEquals(step0_1, step0_0.nextSibling);
	assertNull(step0_1.nextSibling);
};

StepTest.prototype["test next property"] = function () {
	var step0 = Serzone.steps[0];
	var step1 = Serzone.steps[1];
	var step2 = Serzone.steps[2];
	var step0_0 = step0.children[0];
	var step0_1 = step0.children[1];

	assertEquals(step0_0, step0.nextNode);
	assertEquals(step0_1, step0_0.nextNode);
	assertEquals(step1, step0_1.nextNode);
	
	var step1_0 = step1.children[0];
	var step1_0_0 = step1.children[0].children[0];

	assertEquals(step1_0_0, step1_0.nextNode);
	assertEquals(step2, step1_0_0.nextNode.nextNode.nextNode);
};

StepTest.prototype["test init and next & back of init & fire method is instance of Fuction"] = function () {
	for (var i = Serzone.steps[0]; i !== null; i = i.nextNode) {
		assertFunction(i.next.init);
		assertFunction(i.next.fire);
		assertFunction(i.back.init);
		assertFunction(i.back.fire);
	}
};

StepTest.prototype["test init and fire method"] = function () {
	var step = Serzone.steps[0];

	assertEquals("section next init", step.next.init());
	assertEquals("section next fire", step.next.fire());
	assertEquals("section back init", step.back.init());
	assertEquals("section back fire", step.back.fire());

	assertEquals("hoge next init", step.nextNode.next.init());
	assertEquals("hoge next fire", step.nextNode.next.fire());
	assertEquals("hoge back init", step.nextNode.back.init());
	assertEquals("hoge back fire", step.nextNode.back.fire());
};

