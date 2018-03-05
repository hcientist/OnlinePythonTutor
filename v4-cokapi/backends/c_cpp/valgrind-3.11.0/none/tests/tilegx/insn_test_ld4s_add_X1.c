//file: _insn_test_ld4s_add_X1.c
//op=129
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

unsigned long mem[2] = { 0x3ab13aa81a1f8e6, 0xa0f4db3555dcd53 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r7, 9504\n"
                      "shl16insli r7, r7, 15930\n"
                      "shl16insli r7, r7, -27963\n"
                      "shl16insli r7, r7, -6534\n"
                      "moveli r33, 7720\n"
                      "shl16insli r33, r33, -13533\n"
                      "shl16insli r33, r33, 10333\n"
                      "shl16insli r33, r33, -5169\n"
                      "move r33, %2\n"
                      "{ fnop  ; ld4s_add r7, r33, 106  }\n"
                      "move %0, r7\n"
                      "move %1, r33\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
