# Docker-specific targets

# build a docker container
all:
	sh copy-v5-python-files.sh # run this *first*!!!
	docker build -t="pgbovine/cokapi-python-anaconda:v1" .

test:
	/usr/bin/docker run -m 1024m --rm --user=netuser --net=none --cap-drop all pgbovine/cokapi-python-anaconda:v1 python /tmp/python/generate_json_trace.py --allmodules --code="import pandas as pd; print(pd)"

testfunc:
	/usr/bin/docker run -m 1024m --rm --user=netuser --net=none --cap-drop all pgbovine/cokapi-python-anaconda:v1 python /tmp/python/generate_json_trace.py --allmodules --code="def foo(x,y): pass"

bash:
	docker run -m 512M -t -i --rm --user=netuser --net=none --cap-drop all pgbovine/cokapi-python-anaconda:v1 bash
