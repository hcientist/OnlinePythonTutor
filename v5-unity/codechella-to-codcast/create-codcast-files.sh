#!/bin/sh
python convert.py test-codechella-log.jsonl > test-codechella-log.codcast.json
python convert.py test-codechella-log-2.jsonl > test-codechella-log-2.codcast.json
python convert.py test-codechella-log-3-JS.jsonl > test-codechella-log-3-JS.codcast.json
