//file: _insn_test_stnt_X1.c
//op=214
#include <stdio.h>
#include <stdlib.h>

void func_exit(void) {
     printf("%s\n", __func__);
     exit(0);
}

void func_call(void) {
     printf("%s\n", __func__);
     exit(0);
}

unsigned long mem[2] = { 0x6b3e9bf39bb2fee8, 0x4463a2383032e2f2 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r19, 10868\n"
                      "shl16insli r19, r19, 28978\n"
                      "shl16insli r19, r19, -7157\n"
                      "shl16insli r19, r19, 19796\n"
                      "moveli r24, -15907\n"
                      "shl16insli r24, r24, -20157\n"
                      "shl16insli r24, r24, 22361\n"
                      "shl16insli r24, r24, -24834\n"
                      "move r19, %2\n"
                      "{ fnop  ; stnt r19, r24  }\n"
                      "move %0, r19\n"
                      "move %1, r24\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
