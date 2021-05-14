//file: _insn_test_ldna_X1.c
//op=133
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

unsigned long mem[2] = { 0xe99ff6bbb270ebf, 0xc708d15463e8c0ec };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r32, -30640\n"
                      "shl16insli r32, r32, 31848\n"
                      "shl16insli r32, r32, 11423\n"
                      "shl16insli r32, r32, -20012\n"
                      "moveli r16, -24423\n"
                      "shl16insli r16, r16, -14237\n"
                      "shl16insli r16, r16, 18232\n"
                      "shl16insli r16, r16, -32601\n"
                      "move r16, %2\n"
                      "{ fnop  ; ldna r32, r16  }\n"
                      "move %0, r32\n"
                      "move %1, r16\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
