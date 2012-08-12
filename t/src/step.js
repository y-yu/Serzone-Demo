StepTest = TestCase("StepTest");

StepTest.prototype.setUp = function () {
	/*:DOC += 
		<div id="serzone">
			<section>
				<h1>Step 0</h1>

				<div class="step" action="hoge">
					Step 0-0
				</div>

				<div class="step" action="hoge">
					Step 0-1
				</div>
			</section>

			<section>
				<h1>Step 1</h1>

				<div class="step" action="hoge">
					Step 1-0
					<div class="step" action="hoge">
						Step 1-0-0
					</div>
				</div>
			</section>
		</div>
	*/

	Serzone.init();
};

StepTest.prototype["test Serzone has steps prototype, which is instanceof Array"] = function () {
	assertArray(Serzone.steps);
};

StepTest.prototype["test length of steps equal slide length"] = function () {
	assertEquals(2, Serzone.steps.length);
};

StepTest.prototype["test name of steps which slide has are changeSlide"] = function () {
	Serzone.steps.forEach( function (s) {
		assertEquals("changeSlide", s.name);
	});
};

StepTest.prototype["test order property"] = function () {
	Serzone.steps.forEach( function (s, i) {
		assertEquals(i, s.order);
	});
};

StepTest.prototype["test steps has children property, which is instanceof Array"] = function () {
	Serzone.steps.forEach( function (s) {
		assertArray(s.children);
	});
};

StepTest.prototype["test children length"] = function () {
	assertEquals(2, Serzone.steps[0].children.length);
	assertEquals(1, Serzone.steps[1].children.length);
	assertEquals(1, Serzone.steps[1].children[0].children.length);
};

StepTest.prototype["test steps has parent property, and it compare children"] = function () {
	Serzone.steps.forEach( function (step, i, steps) {
		step.children.forEach( function (c) {
			assertEquals(steps[i], c.parent);
		});
	});

	assertEquals(Serzone.steps[1].children[0], Serzone.steps[1].children[0].children[0].parent);
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
};

StepTest.prototype["test siblings property"] = function () {
	var step0 = Serzone.steps[0];
	var step1 = Serzone.steps[1];

	assertEquals(1, step0.siblings.length);
	assertEquals(1, step1.siblings.length);
	assertEquals(step1, step0.siblings[0]);
	assertEquals(step0, step1.siblings[0]);

	step0.children.forEach( function (s, i, steps) {
		assertEquals(1, s.siblings.length);
		assertEquals(steps[1 - i], s.siblings[0]);
	});
};

StepTest.prototype["test nextSibling property"] = function () {
	var step0 = Serzone.steps[0];
	var step1 = Serzone.steps[1];

	assertEquals(step1, step0.nextSibling);
};
