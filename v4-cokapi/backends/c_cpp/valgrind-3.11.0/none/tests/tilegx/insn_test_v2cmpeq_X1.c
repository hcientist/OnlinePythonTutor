//file: _insn_test_v2cmpeq_X1.c
//op=283
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

unsigned long mem[2] = { 0x81ebfd4038066c1, 0x27d94b818c24b012 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r28, 18704\n"
                      "shl16insli r28, r28, -13143\n"
                      "shl16insli r28, r28, 20980\n"
                      "shl16insli r28, r28, -16967\n"
                      "moveli r38, 2058\n"
                      "shl16insli r38, r38, -13098\n"
                      "shl16insli r38, r38, 23303\n"
                      "shl16insli r38, r38, -31712\n"
                      "moveli r16, 6420\n"
                      "shl16insli r16, r16, 31924\n"
                      "shl16insli r16, r16, -30519\n"
                      "shl16insli r16, r16, 32754\n"
                      "{ fnop  ; v2cmpeq r28, r38, r16  }\n"
                      "move %0, r28\n"
                      "move %1, r38\n"
                      "move %2, r16\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
