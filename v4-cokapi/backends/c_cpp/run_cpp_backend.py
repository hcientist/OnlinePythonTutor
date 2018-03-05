# Run the Valgrind-based C/C++ backend for OPT and produce JSON to
# stdout for piping to a web app, properly handling errors and stuff

# Created: 2016-05-09

import json
import os
from subprocess import Popen, PIPE
import re
import sys

VALGRIND_MSG_RE = re.compile('==\d+== (.*)$')
end_of_trace_error_msg = None

DN = os.path.dirname(sys.argv[0])
if not DN:
    DN = '.' # so that we always have an executable path like ./usercode.exe
USER_PROGRAM = sys.argv[1] # string containing the program to be run
LANG = sys.argv[2] # 'c' for C or 'cpp' for C++

prettydump = False
if len(sys.argv) > 3:
    if sys.argv[3] == '--prettydump':
        prettydump = True


if LANG == 'c':
    CC = 'gcc'
    DIALECT = '-std=c11'
    FN = 'usercode.c'
else:
    CC = 'g++'
    DIALECT = '-std=c++11'
    FN = 'usercode.cpp'

F_PATH = os.path.join(DN, FN)
VGTRACE_PATH = os.path.join(DN, 'usercode.vgtrace')
EXE_PATH = os.path.join(DN, 'usercode.exe')

# get rid of stray files so that we don't accidentally use a stray one
for f in (F_PATH, VGTRACE_PATH, EXE_PATH):
    if os.path.exists(f):
        os.remove(f)

# write USER_PROGRAM into F_PATH
with open(F_PATH, 'w') as f:
    f.write(USER_PROGRAM)

# compile it!
p = Popen([CC, DIALECT, '-ggdb', '-O0', '-fno-omit-frame-pointer', '-o', EXE_PATH, F_PATH],
          stdout=PIPE, stderr=PIPE)
(gcc_stdout, gcc_stderr) = p.communicate()
gcc_retcode = p.returncode

if gcc_retcode == 0:
    print >> sys.stderr, '=== gcc stderr ==='
    print >> sys.stderr, gcc_stderr
    print >> sys.stderr, '==='

    # run it with Valgrind
    VALGRIND_EXE = os.path.join(DN, 'valgrind-3.11.0/inst/bin/valgrind')
    # tricky! --source-filename takes a basename only, not a full pathname:
    valgrind_p = Popen(['stdbuf', '-o0', # VERY IMPORTANT to disable stdout buffering so that stdout is traced properly
                        VALGRIND_EXE,
                        '--tool=memcheck',
                        '--source-filename=' + FN,
                        '--trace-filename=' + VGTRACE_PATH,
                        EXE_PATH],
                       stdout=PIPE, stderr=PIPE)
    (valgrind_stdout, valgrind_stderr) = valgrind_p.communicate()
    valgrind_retcode = valgrind_p.returncode

    print >> sys.stderr, '=== Valgrind stdout ==='
    print >> sys.stderr, valgrind_stdout
    print >> sys.stderr, '=== Valgrind stderr ==='
    print >> sys.stderr, valgrind_stderr

    error_lines = []
    in_error_msg = False
    if valgrind_retcode != 0: # there's been an error with Valgrind
        for line in valgrind_stderr.splitlines():
            m = VALGRIND_MSG_RE.match(line)
            if m:
                msg = m.group(1).rstrip()
                #print >> sys.stderr, msg
                if 'Process terminating' in msg:
                    in_error_msg = True

                if in_error_msg:
                    if not msg:
                        in_error_msg = False

                if in_error_msg:
                    error_lines.append(msg)

        #print >> sys.stderr, error_lines
        if error_lines:
            end_of_trace_error_msg = '\n'.join(error_lines)


    # convert vgtrace into an OPT trace

    # TODO: integrate call into THIS SCRIPT since it's simply Python
    # code; no need to call it as an external script
    POSTPROCESS_EXE = os.path.join(DN, 'vg_to_opt_trace.py')
    args = ['python', POSTPROCESS_EXE]
    if prettydump:
        args.append('--prettydump')
    else:
        args.append('--jsondump')
    if end_of_trace_error_msg:
        args += ['--end-of-trace-error-msg', end_of_trace_error_msg]
    args.append(F_PATH)

    postprocess_p = Popen(args, stdout=PIPE, stderr=PIPE)
    (postprocess_stdout, postprocess_stderr) = postprocess_p.communicate()
    postprocess_retcode = postprocess_p.returncode
    print >> sys.stderr, '=== postprocess stderr ==='
    print >> sys.stderr, postprocess_stderr
    print >> sys.stderr, '==='

    print postprocess_stdout
else:
    print >> sys.stderr, '=== gcc stderr ==='
    print >> sys.stderr, gcc_stderr
    print >> sys.stderr, '==='
    # compiler error. parse and report gracefully!

    exception_msg = 'unknown compiler error'
    lineno = None
    column = None

    # just report the FIRST line where you can detect a line and column
    # number of the error.
    for line in gcc_stderr.splitlines():
        # can be 'fatal error:' or 'error:' or probably other stuff too.
        m = re.search(FN + ':(\d+):(\d+):.+?(error:.*$)', line)
        if m:
            lineno = int(m.group(1))
            column = int(m.group(2))
            exception_msg = m.group(3).strip()
            break

        # linker errors are usually 'undefined ' something
        # (this code is VERY brittle)
        if 'undefined ' in line:
            parts = line.split(':')
            exception_msg = parts[-1].strip()
            # match something like
            # /home/pgbovine/opt-cpp-backend/./usercode.c:2: undefined reference to `asdf'
            if FN in parts[0]:
                try:
                    lineno = int(parts[1])
                except:
                    pass
            break

    ret = {'code': USER_PROGRAM,
           'trace': [{'event': 'uncaught_exception',
                    'exception_msg': exception_msg,
                    'line': lineno}]}
    print json.dumps(ret)

