//file: _insn_test_fsingle_pack2_X0.c
//op=107
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

unsigned long mem[2] = { 0x4463a2383032e2f2, 0x4a32a55c75498ba7 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r25, 27454\n"
                      "shl16insli r25, r25, -25613\n"
                      "shl16insli r25, r25, -25678\n"
                      "shl16insli r25, r25, -280\n"
                      "moveli r33, -5991\n"
                      "shl16insli r33, r33, 9025\n"
                      "shl16insli r33, r33, -5431\n"
                      "shl16insli r33, r33, 19958\n"
                      "moveli r28, 10868\n"
                      "shl16insli r28, r28, 28978\n"
                      "shl16insli r28, r28, -7157\n"
                      "shl16insli r28, r28, 19796\n"
                      "{ fsingle_pack2 r25, r33, r28 ; fnop   }\n"
                      "move %0, r25\n"
                      "move %1, r33\n"
                      "move %2, r28\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
