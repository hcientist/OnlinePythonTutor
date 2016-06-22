# build a docker container
all:
	docker build -t="pgbovine/cokapi-ruby:v1" .

test:
	docker run -m 512M --rm --user=netuser --net=none --cap-drop all pgbovine/cokapi-ruby:v1 /tmp/ruby/ruby /tmp/ruby/pg_logger.rb -c "x = 1; y = 2; z = 3;"

bash:
	docker run -m 512M -t -i --rm --user=netuser --net=none --cap-drop all pgbovine/cokapi-ruby:v1 bash
