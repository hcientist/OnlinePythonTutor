# compile typescript into javascript
all: observer.js

%.js: %.ts usermon-class.ts
	tsc --sourceMap $< usermon-class.ts typescript-defs/*.ts

clean:
	rm -f observer.js* usermon-class.js*
