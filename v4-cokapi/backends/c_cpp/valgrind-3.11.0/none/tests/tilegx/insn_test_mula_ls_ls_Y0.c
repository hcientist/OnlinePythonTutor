//file: _insn_test_mula_ls_ls_Y0.c
//op=172
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

unsigned long mem[2] = { 0x481bd1c9a41ebd0a, 0x38646a3eaf613478 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r17, -19781\n"
                      "shl16insli r17, r17, 4441\n"
                      "shl16insli r17, r17, -25151\n"
                      "shl16insli r17, r17, -1099\n"
                      "moveli r30, 16040\n"
                      "shl16insli r30, r30, 13539\n"
                      "shl16insli r30, r30, -10611\n"
                      "shl16insli r30, r30, 18456\n"
                      "moveli r43, 9010\n"
                      "shl16insli r43, r43, -28846\n"
                      "shl16insli r43, r43, 3819\n"
                      "shl16insli r43, r43, -25218\n"
                      "{ mula_ls_ls r17, r30, r43 ; fnop  ; ld r63, r54  }\n"
                      "move %0, r17\n"
                      "move %1, r30\n"
                      "move %2, r43\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
