//file: _insn_test_cmulhr_X0.c
//op=70
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

unsigned long mem[2] = { 0x3f45dbe8d3bddf1e, 0x6873aadf3e763127 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r49, 17759\n"
                      "shl16insli r49, r49, -31178\n"
                      "shl16insli r49, r49, -28954\n"
                      "shl16insli r49, r49, -24129\n"
                      "moveli r30, 15980\n"
                      "shl16insli r30, r30, 6185\n"
                      "shl16insli r30, r30, -3610\n"
                      "shl16insli r30, r30, -10263\n"
                      "moveli r31, 26063\n"
                      "shl16insli r31, r31, 27563\n"
                      "shl16insli r31, r31, 24059\n"
                      "shl16insli r31, r31, -1753\n"
                      "{ cmulhr r49, r30, r31 ; fnop   }\n"
                      "move %0, r49\n"
                      "move %1, r30\n"
                      "move %2, r31\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
