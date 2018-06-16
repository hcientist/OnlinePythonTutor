# Docker-specific targets

# build a docker container
all:
	sh copy-v5-python-files.sh # run this *first*!!!
	docker build -t="pgbovine/cokapi-python-anaconda:v1" .

test:
	docker run -m 512M -t -i --rm --user=netuser --net=none --cap-drop all pgbovine/cokapi-js:v1 /tmp/javascript/node-v6.0.0-linux-x64/bin/node --expose-debug-as=Debug /tmp/javascript/jslogger.js --jsondump=true --code="var x=1; var y=2; var z=3;"

bash:
	docker run -m 512M -t -i --rm --user=netuser --net=none --cap-drop all pgbovine/cokapi-python-anaconda:v1 bash
