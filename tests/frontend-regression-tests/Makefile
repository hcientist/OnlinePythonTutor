all:
	@casperjs test --concise test-micro.js
	@casperjs test --concise test-visualize-html.js
	@casperjs test --concise test-load-from-URL.js
	@casperjs test --concise test-embedding-demo.js

# a micro-test that can run super quickly during development
micro:
	@casperjs test --concise test-micro.js

verbose:
	@casperjs test test-micro.js
	@casperjs test test-visualize-html.js
	@casperjs test test-load-from-URL.js
	@casperjs test test-embedding-demo.js
