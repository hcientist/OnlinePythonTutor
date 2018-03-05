//file: _insn_test_v2mulfsc_X0.c
//op=301
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

unsigned long mem[2] = { 0xfc4c1139fffb1c60, 0xb25a859df5ae736 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r42, -31119\n"
                      "shl16insli r42, r42, -1080\n"
                      "shl16insli r42, r42, 6437\n"
                      "shl16insli r42, r42, 1017\n"
                      "moveli r19, 18489\n"
                      "shl16insli r19, r19, -6115\n"
                      "shl16insli r19, r19, -11917\n"
                      "shl16insli r19, r19, -887\n"
                      "moveli r6, -7581\n"
                      "shl16insli r6, r6, -24479\n"
                      "shl16insli r6, r6, 27035\n"
                      "shl16insli r6, r6, -19583\n"
                      "{ v2mulfsc r42, r19, r6 ; fnop   }\n"
                      "move %0, r42\n"
                      "move %1, r19\n"
                      "move %2, r6\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
