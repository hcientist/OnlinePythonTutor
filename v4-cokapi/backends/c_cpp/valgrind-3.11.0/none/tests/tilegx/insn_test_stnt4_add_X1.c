//file: _insn_test_stnt4_add_X1.c
//op=220
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

unsigned long mem[2] = { 0x6f255d688978bfb5, 0x6b650d3d95fb5164 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r39, -25531\n"
                      "shl16insli r39, r39, -23858\n"
                      "shl16insli r39, r39, 24910\n"
                      "shl16insli r39, r39, -31706\n"
                      "moveli r1, 16489\n"
                      "shl16insli r1, r1, 1852\n"
                      "shl16insli r1, r1, -22328\n"
                      "shl16insli r1, r1, -20016\n"
                      "move r39, %2\n"
                      "{ fnop  ; stnt4_add r39, r1, 104  }\n"
                      "move %0, r39\n"
                      "move %1, r1\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
