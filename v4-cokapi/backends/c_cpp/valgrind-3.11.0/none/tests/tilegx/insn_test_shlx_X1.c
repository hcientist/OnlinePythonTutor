//file: _insn_test_shlx_X1.c
//op=197
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

unsigned long mem[2] = { 0xc50a1fac55b8148e, 0x7a42921bfe898fb };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r4, -11574\n"
                      "shl16insli r4, r4, 5546\n"
                      "shl16insli r4, r4, -19680\n"
                      "shl16insli r4, r4, -25733\n"
                      "moveli r4, -7090\n"
                      "shl16insli r4, r4, -11125\n"
                      "shl16insli r4, r4, -23773\n"
                      "shl16insli r4, r4, 7384\n"
                      "moveli r42, -25884\n"
                      "shl16insli r42, r42, -16117\n"
                      "shl16insli r42, r42, 21894\n"
                      "shl16insli r42, r42, -22287\n"
                      "{ fnop  ; shlx r4, r4, r42  }\n"
                      "move %0, r4\n"
                      "move %1, r4\n"
                      "move %2, r42\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
