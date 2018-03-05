//file: _insn_test_fsingle_addsub2_X0.c
//op=103
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

unsigned long mem[2] = { 0x2c24dd020e9fa33f, 0xc279be840ee86dea };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r16, -8392\n"
                      "shl16insli r16, r16, -23005\n"
                      "shl16insli r16, r16, -28857\n"
                      "shl16insli r16, r16, -4517\n"
                      "moveli r18, -23753\n"
                      "shl16insli r18, r18, -24851\n"
                      "shl16insli r18, r18, 4221\n"
                      "shl16insli r18, r18, 16539\n"
                      "moveli r13, -2884\n"
                      "shl16insli r13, r13, 28785\n"
                      "shl16insli r13, r13, 7136\n"
                      "shl16insli r13, r13, 32281\n"
                      "{ fsingle_addsub2 r16, r18, r13 ; fnop   }\n"
                      "move %0, r16\n"
                      "move %1, r18\n"
                      "move %2, r13\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
