//file: _insn_test_v2cmplts_X0.c
//op=287
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

unsigned long mem[2] = { 0xee16007d198e11f0, 0x1aa7041318ab41dd };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r36, 31237\n"
                      "shl16insli r36, r36, -13233\n"
                      "shl16insli r36, r36, -23176\n"
                      "shl16insli r36, r36, 582\n"
                      "moveli r45, 10053\n"
                      "shl16insli r45, r45, 8734\n"
                      "shl16insli r45, r45, 386\n"
                      "shl16insli r45, r45, -2790\n"
                      "moveli r20, 27000\n"
                      "shl16insli r20, r20, -5959\n"
                      "shl16insli r20, r20, 7411\n"
                      "shl16insli r20, r20, 17645\n"
                      "{ v2cmplts r36, r45, r20 ; fnop   }\n"
                      "move %0, r36\n"
                      "move %1, r45\n"
                      "move %2, r20\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
