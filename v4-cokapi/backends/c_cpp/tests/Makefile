all-traces: basic.trace \
						meng-thesis-example.trace \
						array-overflow.trace \
						array-param.trace \
						struct-basic.trace \
						globals.trace \
						string-array.trace \
						structs-and-arrays.trace \
						pointer-chain.trace \
						typedef-test.trace \
						type-qualifiers.trace \
						shadowing.trace \
						pointers-gone-wild.trace \
						number-types.trace \
						quicksort.trace \
						string-reverse-inplace.trace \
						fjalar-ArraysInStructTest.trace \
						fjalar-ArrayTest.trace \
						fjalar-CoercePointerTest.trace \
						fjalar-crazy-test-1.trace \
						fjalar-FloatTest.trace \
						fjalar-function-pointer.trace \
						fjalar-functions.trace \
						fjalar-GlobalTest.trace \
						fjalar-inline-func.trace \
						fjalar-IntTest.trace \
						fjalar-local-ptr.trace \
						fjalar-MultiDimArrayTest.trace \
						fjalar-NestedStructTest.trace \
						fjalar-NestedStructVarList.trace \
						fjalar-pointer-levels.trace \
						fjalar-PointerTest.trace \
						fjalar-small-test.trace \
						fjalar-StaticArraysTest.trace \
						fjalar-string-arrays.trace \
						fjalar-StructPtrTest.trace \
						fjalar-TrivialTest.trace \
						fjalar-TypedefTest.trace \
						cpp-array-struct-test.trace \
						cpp-class-pointers.trace \
						cpp-first.trace \
						cpp-object-array.trace \
						cpp-virtual-method.trace \
						cpp-class-basic.trace \
						cpp-consts.trace \
						cpp-function-types.trace \
						cpp-pass-by-ref.trace \
						cpp-class-date.trace \
						cpp-exception.trace \
						cpp-inheritance.trace \
						cpp-stack-inline.trace \
						cpp-stackarraymini.trace


%.trace: %.c ../valgrind-3.11.0/inst/bin/valgrind
	@python ../run_cpp_backend.py "`cat $<`" c --prettydump > $(basename $<).trace

%.trace: %.cpp ../valgrind-3.11.0/inst/bin/valgrind
	@python ../run_cpp_backend.py "`cat $<`" cpp --prettydump > $(basename $<).trace


# old crufty code ...
#%.trace: %.c ../valgrind-3.11.0/inst/bin/valgrind
#	@gcc -ggdb -O0 -fno-omit-frame-pointer $< -o $(basename $@).exe
#	@stdbuf -o0 ../valgrind-3.11.0/inst/bin/valgrind --tool=memcheck --source-filename=$< --trace-filename=$(basename $<).vgtrace ./$(basename $<).exe || true
#	@python ../vg_to_opt_trace.py --prettydump $< > $(basename $<).trace || true
#
#%.trace: %.cpp ../valgrind-3.11.0/inst/bin/valgrind
#	@g++ -ggdb -O0 -fno-omit-frame-pointer $< -o $(basename $@).exe
#	@stdbuf -o0 ../valgrind-3.11.0/inst/bin/valgrind --tool=memcheck --source-filename=$< --trace-filename=$(basename $<).vgtrace ./$(basename $<).exe || true
#	@python ../vg_to_opt_trace.py --prettydump $< > $(basename $<).trace || true

clean:
	rm -f *.trace *.vgtrace *.out
