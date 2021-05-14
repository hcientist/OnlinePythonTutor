all:
	@casperjs test --concise test-micro.js
	@casperjs test --concise test-visualize-html.js
	@casperjs test --concise test-load-from-URL.js
	@casperjs test --concise test-embedding-demo.js
	@casperjs test --concise test-java.js
	@casperjs test --concise test-testcases.js
	@casperjs test --concise test-optlive.js

# a micro-test that can run super quickly during development
micro:
	@casperjs test --concise test-micro.js

java:
	@casperjs test test-java.js

verbose:
	@casperjs test test-micro.js
	@casperjs test test-visualize-html.js
	@casperjs test test-load-from-URL.js
	@casperjs test test-embedding-demo.js
	@casperjs test test-java.js
	@casperjs test test-testcases.js
	@casperjs test test-optlive.js

clean:
	find . -name '*.diff.png' | xargs rm -f
	find . -name '*.fail.png' | xargs rm -f
