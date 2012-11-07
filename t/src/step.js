StepTest = TestCase("StepTest");

StepTest.prototype.setUp = function () {
	/*:DOC += 
		<script>
			Serzone.action = {
				changeSlide : {
					//type : "next",
					init : function () { return "changeSlide init"; },
					fire : function () { return "changeSlide fire"; }
				},

				hoge : {
					//type : "hoge",
					init : function () { return "hoge init"; },
					fire : function () { return "hoge fire"; }
				}
			};
		</script>
		<div id="serzone">

			// Slide 0
			<section>
				<h1>Step 0 (Change Slide)</h1>

				<div class="step" action="hoge">
					Step 0-0
				</div>

				<div class="step" action="hoge">
					Step 0-1
				</div>
			</section>

		   // Slide 1
			<section>
				<h1>Step 1 (Change Slide)</h1>

				<div class="step" action="hoge">
					Step 1-0
					<div class="step" action="hoge">
						Step 1-0-0
					</div>

					<div class="step" action="hoge">
						Step 1-0-1
					</div>

					<div class="step" action="hoge">
						Step 1-0-1
					</div>
				</div>
			</section>
		</div>
	*/

	Serzone.start();
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
	assertEquals(0, Serzone.steps[0].children[0].order);
	assertEquals(1, Serzone.steps[0].children[1].order);

	assertEquals(1, Serzone.steps[1].order);
	assertEquals(0, Serzone.steps[1].children[0].order);
	assertEquals(0, Serzone.steps[1].children[0].children[0].order);
	assertEquals(1, Serzone.steps[1].children[0].children[1].order);
	assertEquals(2, Serzone.steps[1].children[0].children[2].order);
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

	assertEquals(1, step0.siblings.length);
	assertEquals(1, step1.siblings.length);
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

	assertEquals(step1, step0.nextSibling);
	assertNull(step1.nextSibling);

	var step0_0 = step0.children[0];
	var step0_1 = step0.children[1];

	assertEquals(step0_1, step0_0.nextSibling);
	assertNull(step0_1.nextSibling);
};

StepTest.prototype["test next property"] = function () {
	var step0 = Serzone.steps[0];
	var step1 = Serzone.steps[1];
	var step0_0 = step0.children[0];
	var step0_1 = step0.children[1];

	assertEquals(step0_0, step0.next);
	assertEquals(step0_1, step0_0.next);
	assertEquals(step1, step0_1.next);
	
	var step1_0 = step1.children[0];
	var step1_0_0 = step1.children[0].children[0];

	assertEquals(step1_0_0, step1_0.next);

	assertNull(step1_0_0.next.next.next);
};

StepTest.prototype["test init and fire method is instance of Fuction"] = function () {
	for (var i = Serzone.steps[0]; i !== null; i = i.next) {
		assertFunction(i.init);
		assertFunction(i.fire);
	}
};

StepTest.prototype["test init and fire method"] = function () {
	var step = Serzone.steps[0];

	assertEquals("changeSlide init", step.init());
	assertEquals("changeSlide fire", step.fire());
	assertEquals("hoge init", step.next.init());
	assertEquals("hoge fire", step.next.fire());
};

StepTest.prototype["test state property of Serzone Object"] = function () {
	var state = Serzone.state;

	assertEquals(0, state.currentSlide);
	assertEquals(0, state.currentStep);
	assertUndefined(state.history);
};

StepTest.prototype["test state.currentSlide property increment"] = function () {
	var state = Serzone.state;
	var steps = Serzone.steps;

	assertEquals("changeSlide", steps[0].name);
	steps[0].fire();
	assertEquals(1, state.currentSlide);

	assertNotEquals("changeSlide", steps[0].next.name);
	steps[0].next.fire();
	assertEquals(1, state.currentSlide);
};

StepTest.prototype["test state.currentStep property increment"] = function () {
	var state = Serzone.state;
	var steps = Serzone.steps;

	assertEquals("changeSlide", steps[0].name);
	steps[0].fire();
	assertEquals(1, state.currentStep);

	assertNotEquals("changeSlide", steps[0].next.name);
	steps[0].next.fire();
	assertEquals(2, state.currentStep);
};

StepTest.prototype["test history prototype"] = function () {
	var state = Serzone.state;
	var steps = Serzone.steps;

	steps[0].fire();

	var pre = state.history;
	assertTrue(pre instanceof Slide);

	assertUndefined(state.history);

	steps[0].next.fire();
	pre = state.history;
	assertTrue(pre instanceof HTMLElement);
};

