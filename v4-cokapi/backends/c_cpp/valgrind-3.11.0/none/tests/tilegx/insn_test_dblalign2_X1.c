//file: _insn_test_dblalign2_X1.c
//op=75
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

unsigned long mem[2] = { 0x52148e33ddfabfa8, 0xc6860cbdb069dbcf };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r39, -27243\n"
                      "shl16insli r39, r39, 13585\n"
                      "shl16insli r39, r39, -1554\n"
                      "shl16insli r39, r39, 17682\n"
                      "moveli r19, -3548\n"
                      "shl16insli r19, r19, -18819\n"
                      "shl16insli r19, r19, -5126\n"
                      "shl16insli r19, r19, -7819\n"
                      "moveli r48, 10648\n"
                      "shl16insli r48, r48, -21072\n"
                      "shl16insli r48, r48, -30644\n"
                      "shl16insli r48, r48, -24292\n"
                      "{ fnop  ; dblalign2 r39, r19, r48  }\n"
                      "move %0, r39\n"
                      "move %1, r19\n"
                      "move %2, r48\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
