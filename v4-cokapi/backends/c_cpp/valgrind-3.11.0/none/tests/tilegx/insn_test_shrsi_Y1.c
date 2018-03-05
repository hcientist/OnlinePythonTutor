//file: _insn_test_shrsi_Y1.c
//op=200
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

unsigned long mem[2] = { 0xf248472b636bec53, 0xd85a80d7b6245b44 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r25, -26255\n"
                      "shl16insli r25, r25, -13898\n"
                      "shl16insli r25, r25, 12833\n"
                      "shl16insli r25, r25, 32008\n"
                      "moveli r35, -25986\n"
                      "shl16insli r35, r35, -11739\n"
                      "shl16insli r35, r35, 13313\n"
                      "shl16insli r35, r35, -12374\n"
                      "{ fnop  ; shrsi r25, r35, 46 ; ld r63, r54  }\n"
                      "move %0, r25\n"
                      "move %1, r35\n"
                      :"=r"(a[0]),"=r"(a[1]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
