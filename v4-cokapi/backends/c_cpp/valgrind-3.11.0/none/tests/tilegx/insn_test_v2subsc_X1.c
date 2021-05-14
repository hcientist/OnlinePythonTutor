//file: _insn_test_v2subsc_X1.c
//op=320
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

unsigned long mem[2] = { 0xd8c6caab057cf371, 0x86109da9991e057a };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r19, 13645\n"
                      "shl16insli r19, r19, 12702\n"
                      "shl16insli r19, r19, -22722\n"
                      "shl16insli r19, r19, 25020\n"
                      "moveli r19, 10415\n"
                      "shl16insli r19, r19, -24373\n"
                      "shl16insli r19, r19, 23725\n"
                      "shl16insli r19, r19, -29919\n"
                      "moveli r37, 12018\n"
                      "shl16insli r37, r37, -2612\n"
                      "shl16insli r37, r37, 2644\n"
                      "shl16insli r37, r37, -1447\n"
                      "{ fnop  ; v2subsc r19, r19, r37  }\n"
                      "move %0, r19\n"
                      "move %1, r19\n"
                      "move %2, r37\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
