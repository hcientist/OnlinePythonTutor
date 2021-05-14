//file: _insn_test_clz_X0.c
//op=50
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

unsigned long mem[2] = { 0x4035b9e3ec473fc4, 0xa866c1efe28f7aab };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r3, -10150\n"
                      "shl16insli r3, r3, -32553\n"
                      "shl16insli r3, r3, -18908\n"
                      "shl16insli r3, r3, 23364\n"
                      "moveli r33, -27243\n"
                      "shl16insli r33, r33, 13585\n"
                      "shl16insli r33, r33, -1554\n"
                      "shl16insli r33, r33, 17682\n"
                      "{ clz r3, r33 ; fnop   }\n"
                      "move %0, r3\n"
                      "move %1, r33\n"
                      :"=r"(a[0]),"=r"(a[1]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
