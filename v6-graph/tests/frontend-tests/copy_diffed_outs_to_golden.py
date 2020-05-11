# copy all *out* files with a *diff* file into golden
import os
import shutil
import sys

for dn, subdirs, files in os.walk('.'):
    diff_files = [e for e in files if '.diff.' in e]
    if diff_files:
        out_files = [os.path.join(dn, e.replace('.diff.', '.out.')) for e in diff_files]
        golden_files = [os.path.join(dn, e.replace('.diff.', '.golden.')) for e in diff_files]
        assert len(diff_files) == len(out_files) == len(golden_files)
        for outf, goldenf in zip(out_files, golden_files):
            assert os.path.isfile(outf)
            assert os.path.isfile(goldenf)
            print >> sys.stderr, outf, '->', goldenf
            shutil.copyfile(outf, goldenf)
