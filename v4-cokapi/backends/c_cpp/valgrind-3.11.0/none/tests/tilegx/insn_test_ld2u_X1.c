//file: _insn_test_ld2u_X1.c
//op=126
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

unsigned long mem[2] = { 0xb50b19b244ac7eb4, 0x11b59d6276787136 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r12, -12252\n"
                      "shl16insli r12, r12, 5860\n"
                      "shl16insli r12, r12, 15129\n"
                      "shl16insli r12, r12, -15375\n"
                      "moveli r47, -11895\n"
                      "shl16insli r47, r47, 21718\n"
                      "shl16insli r47, r47, -14088\n"
                      "shl16insli r47, r47, -5322\n"
                      "move r47, %2\n"
                      "{ fnop  ; ld2u r12, r47  }\n"
                      "move %0, r12\n"
                      "move %1, r47\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
