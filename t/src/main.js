SerzoneTest = TestCase("SerzoneTest");

//SerzoneTest.prototype.setUp = function () { };

SerzoneTest.prototype["test check Serzone and Serzone.action"] = function () {
	assertNotUndefined(Serzone);
	assertNotUndefined(Serzone.action);
};

SerzoneTest.prototype["test check Serzone has init() and works"] = function () {
	assertFunction(Serzone.init);
	
	assertException(function () {
		Serzone.init();
	}, "Error");
};

SerzoneTest.prototype["test check Serzone init()"] = function () {
	/*:DOC += 
		<div id="serzone">
		<section>
			<p>This is Test</p>
		</section>
		</div>
	*/
	Serzone.init();
	assertNotUndefined(Serzone.slides);
	assertNotUndefined(Serzone.steps);
	assertNotUndefined(Serzone.spike);
};
