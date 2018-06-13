#!/bin/sh
echo 'Python 2.7 test'
echo '==============='
python golden_test.py --all
echo
echo 'Python 3.2 test'
echo '==============='
python golden_test.py --all --py32
echo
echo 'Python 3.6 test'
echo '==============='
python golden_test.py --all --py36
