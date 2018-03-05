//file: _insn_test_shl_Y0.c
//op=188
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

unsigned long mem[2] = { 0x53094f44a07b725d, 0xe61730d0d9026b62 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r23, -28145\n"
                      "shl16insli r23, r23, -7915\n"
                      "shl16insli r23, r23, 2786\n"
                      "shl16insli r23, r23, 4140\n"
                      "moveli r19, -17474\n"
                      "shl16insli r19, r19, 5541\n"
                      "shl16insli r19, r19, 25238\n"
                      "shl16insli r19, r19, 6803\n"
                      "moveli r48, -9071\n"
                      "shl16insli r48, r48, -18527\n"
                      "shl16insli r48, r48, -17369\n"
                      "shl16insli r48, r48, 13142\n"
                      "{ shl r23, r19, r48 ; fnop  ; ld r63, r54  }\n"
                      "move %0, r23\n"
                      "move %1, r19\n"
                      "move %2, r48\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
