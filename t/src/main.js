SerzoneTest = TestCase("SerzoneTest");

//SerzoneTest.prototype.setUp = function () { };

SerzoneTest.prototype["test check Serzone and Serzone.action"] = function () {
	assertNotUndefined(Serzone);
	assertNotUndefined(Serzone.action);
};

SerzoneTest.prototype["test check Serzone has start method and works"] = function () {
	assertFunction(Serzone.start);
	
	assertException(function () {
		Serzone.start();
	}, "Error");
};

SerzoneTest.prototype["test check Serzone start method"] = function () {
	/*:DOC += 
		<div id="serzone">
		<section>
			<p>This is Test</p>
		</section>
		</div>
	*/
	Serzone.start();
	assertNotUndefined(Serzone.slides);
	assertNotUndefined(Serzone.steps);
};
