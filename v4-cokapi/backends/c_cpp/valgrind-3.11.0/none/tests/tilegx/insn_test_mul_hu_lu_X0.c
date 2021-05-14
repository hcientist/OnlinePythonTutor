//file: _insn_test_mul_hu_lu_X0.c
//op=161
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

unsigned long mem[2] = { 0x4639d63ca03e5e4e, 0x5e51bd49489c060d };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r10, -11099\n"
                      "shl16insli r10, r10, 22725\n"
                      "shl16insli r10, r10, -18659\n"
                      "shl16insli r10, r10, 28990\n"
                      "moveli r19, -7114\n"
                      "shl16insli r19, r19, -4623\n"
                      "shl16insli r19, r19, 4807\n"
                      "shl16insli r19, r19, -17110\n"
                      "moveli r31, 5393\n"
                      "shl16insli r31, r31, -22253\n"
                      "shl16insli r31, r31, 25749\n"
                      "shl16insli r31, r31, -7203\n"
                      "{ mul_hu_lu r10, r19, r31 ; fnop   }\n"
                      "move %0, r10\n"
                      "move %1, r19\n"
                      "move %2, r31\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
