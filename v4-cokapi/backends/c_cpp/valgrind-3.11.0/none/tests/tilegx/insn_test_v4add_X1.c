//file: _insn_test_v4add_X1.c
//op=321
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

unsigned long mem[2] = { 0xe8992341eac94df6, 0x65cc09dafded6d76 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r37, -15907\n"
                      "shl16insli r37, r37, -20157\n"
                      "shl16insli r37, r37, 22361\n"
                      "shl16insli r37, r37, -24834\n"
                      "moveli r23, 11074\n"
                      "shl16insli r23, r23, 24074\n"
                      "shl16insli r23, r23, 17669\n"
                      "shl16insli r23, r23, 8301\n"
                      "moveli r15, -19606\n"
                      "shl16insli r15, r15, 31855\n"
                      "shl16insli r15, r15, -1361\n"
                      "shl16insli r15, r15, -31541\n"
                      "{ fnop  ; v4add r37, r23, r15  }\n"
                      "move %0, r37\n"
                      "move %1, r23\n"
                      "move %2, r15\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
