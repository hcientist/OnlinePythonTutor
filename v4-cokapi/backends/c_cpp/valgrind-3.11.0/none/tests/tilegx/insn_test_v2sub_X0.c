//file: _insn_test_v2sub_X0.c
//op=319
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

unsigned long mem[2] = { 0x61c13e55406befc0, 0xe69a8a5b32e86179 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r39, -19019\n"
                      "shl16insli r39, r39, 19818\n"
                      "shl16insli r39, r39, 30879\n"
                      "shl16insli r39, r39, -27712\n"
                      "moveli r20, 15911\n"
                      "shl16insli r20, r20, 26398\n"
                      "shl16insli r20, r20, -12667\n"
                      "shl16insli r20, r20, 29760\n"
                      "moveli r38, -21567\n"
                      "shl16insli r38, r38, -21338\n"
                      "shl16insli r38, r38, -1807\n"
                      "shl16insli r38, r38, -13303\n"
                      "{ v2sub r39, r20, r38 ; fnop   }\n"
                      "move %0, r39\n"
                      "move %1, r20\n"
                      "move %2, r38\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
