//file: _insn_test_mz_Y0.c
//op=177
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

unsigned long mem[2] = { 0x9b70a44aad51d91c, 0x67d733d090a0e0ad };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r47, -6674\n"
                      "shl16insli r47, r47, -26653\n"
                      "shl16insli r47, r47, -16240\n"
                      "shl16insli r47, r47, 300\n"
                      "moveli r39, -14350\n"
                      "shl16insli r39, r39, -13718\n"
                      "shl16insli r39, r39, -10168\n"
                      "shl16insli r39, r39, -15190\n"
                      "moveli r40, 208\n"
                      "shl16insli r40, r40, 20913\n"
                      "shl16insli r40, r40, 19131\n"
                      "shl16insli r40, r40, -17081\n"
                      "{ mz r47, r39, r40 ; fnop  ; ld r63, r54  }\n"
                      "move %0, r47\n"
                      "move %1, r39\n"
                      "move %2, r40\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
