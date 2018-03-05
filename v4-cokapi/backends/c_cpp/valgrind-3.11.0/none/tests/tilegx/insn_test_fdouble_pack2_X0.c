//file: _insn_test_fdouble_pack2_X0.c
//op=86
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

unsigned long mem[2] = { 0x38646a3eaf613478, 0xc2c31988eb4ca702 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r9, 18459\n"
                      "shl16insli r9, r9, -11831\n"
                      "shl16insli r9, r9, -23522\n"
                      "shl16insli r9, r9, -17142\n"
                      "moveli r9, 9504\n"
                      "shl16insli r9, r9, 15930\n"
                      "shl16insli r9, r9, -27963\n"
                      "shl16insli r9, r9, -6534\n"
                      "moveli r12, -19781\n"
                      "shl16insli r12, r12, 4441\n"
                      "shl16insli r12, r12, -25151\n"
                      "shl16insli r12, r12, -1099\n"
                      "{ fdouble_pack2 r9, r9, r12 ; fnop   }\n"
                      "move %0, r9\n"
                      "move %1, r9\n"
                      "move %2, r12\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
