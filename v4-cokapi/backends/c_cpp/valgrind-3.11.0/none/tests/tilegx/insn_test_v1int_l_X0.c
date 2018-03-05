//file: _insn_test_v1int_l_X0.c
//op=258
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

unsigned long mem[2] = { 0x25203e3a92c5e67a, 0x3ab13aa81a1f8e6 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r16, 16040\n"
                      "shl16insli r16, r16, 13539\n"
                      "shl16insli r16, r16, -10611\n"
                      "shl16insli r16, r16, 18456\n"
                      "moveli r1, -8860\n"
                      "shl16insli r1, r1, 10696\n"
                      "shl16insli r1, r1, -32518\n"
                      "shl16insli r1, r1, 20582\n"
                      "moveli r32, 25660\n"
                      "shl16insli r32, r32, -31058\n"
                      "shl16insli r32, r32, 3321\n"
                      "shl16insli r32, r32, 742\n"
                      "{ v1int_l r16, r1, r32 ; fnop   }\n"
                      "move %0, r16\n"
                      "move %1, r1\n"
                      "move %2, r32\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
