StepTest = TestCase("StepTest");

StepTest.prototype.setUp = function () {
	/*:DOC += 
		<div id="serzone">
			<section>
				<h1>Slide 0</h1>

				<div class="step" action="hoge">
					hogehoge
				</div>
			</section>

			<section>
				<h1>Slide 1</h1>

				<div class="step" action="hoge">
					hoge
					<div class="step" action="hoge">
						hogehoge
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

StepTest.prototype["test steps.length"] = function () {;
	assertEquals(2, Serzone.steps.length);
};

//StepTest.prototype[""];
