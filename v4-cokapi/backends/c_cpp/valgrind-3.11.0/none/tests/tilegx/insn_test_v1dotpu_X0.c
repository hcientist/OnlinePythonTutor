//file: _insn_test_v1dotpu_X0.c
//op=253
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

unsigned long mem[2] = { 0xb9d12319fbf02182, 0x42d3871d0b55e0e5 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r20, 7058\n"
                      "shl16insli r20, r20, -10273\n"
                      "shl16insli r20, r20, -27400\n"
                      "shl16insli r20, r20, 410\n"
                      "moveli r27, -1572\n"
                      "shl16insli r27, r27, 7162\n"
                      "shl16insli r27, r27, -2477\n"
                      "shl16insli r27, r27, -2756\n"
                      "moveli r46, -23264\n"
                      "shl16insli r46, r46, 16614\n"
                      "shl16insli r46, r46, 28637\n"
                      "shl16insli r46, r46, 17411\n"
                      "{ v1dotpu r20, r27, r46 ; fnop   }\n"
                      "move %0, r20\n"
                      "move %1, r27\n"
                      "move %2, r46\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
