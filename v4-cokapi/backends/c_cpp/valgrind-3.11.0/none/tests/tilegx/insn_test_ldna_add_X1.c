//file: _insn_test_ldna_add_X1.c
//op=134
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

unsigned long mem[2] = { 0x2f3ac3e001892397, 0x20a35a283e09bcf3 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r23, 30081\n"
                      "shl16insli r23, r23, 2888\n"
                      "shl16insli r23, r23, 17535\n"
                      "shl16insli r23, r23, -29480\n"
                      "moveli r20, -32745\n"
                      "shl16insli r20, r20, -15929\n"
                      "shl16insli r20, r20, -787\n"
                      "shl16insli r20, r20, 26982\n"
                      "move r20, %2\n"
                      "{ fnop  ; ldna_add r23, r20, 11  }\n"
                      "move %0, r23\n"
                      "move %1, r20\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
