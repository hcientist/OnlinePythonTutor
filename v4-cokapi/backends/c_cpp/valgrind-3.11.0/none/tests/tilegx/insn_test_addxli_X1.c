//file: _insn_test_addxli_X1.c
//op=27
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

unsigned long mem[2] = { 0xd5875ac284be5010, 0xfeec3c7ab59e554 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r45, -16303\n"
                      "shl16insli r45, r45, -6468\n"
                      "shl16insli r45, r45, -24288\n"
                      "shl16insli r45, r45, 22752\n"
                      "moveli r45, 5983\n"
                      "shl16insli r45, r45, 27427\n"
                      "shl16insli r45, r45, 451\n"
                      "shl16insli r45, r45, -26979\n"
                      "{ fnop  ; addxli r45, r45, -23808  }\n"
                      "move %0, r45\n"
                      "move %1, r45\n"
                      :"=r"(a[0]),"=r"(a[1]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
