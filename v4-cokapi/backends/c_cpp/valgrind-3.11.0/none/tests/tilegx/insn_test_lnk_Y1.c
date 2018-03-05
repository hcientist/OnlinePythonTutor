//file: _insn_test_lnk_Y1.c
//op=149
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

unsigned long mem[2] = { 0x74d04934d1d15274, 0xd270fbfbde298322 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r26, -23588\n"
                      "shl16insli r26, r26, 9244\n"
                      "shl16insli r26, r26, 32109\n"
                      "shl16insli r26, r26, -30144\n"
                      "{ fnop  ; lnk r26 ; ld r63, r54  }\n"
                      "move %0, r26\n"
                      :"=r"(a[0]));
    printf("%016lx\n", a[0]);
    return 0;
}
