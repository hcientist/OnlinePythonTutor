//file: _insn_test_ldnt4u_add_X1.c
//op=147
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

unsigned long mem[2] = { 0x5d9ea0967d2b4507, 0x65938abe343c4eed };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r19, -26655\n"
                      "shl16insli r19, r19, 14881\n"
                      "shl16insli r19, r19, 22810\n"
                      "shl16insli r19, r19, 12324\n"
                      "moveli r9, 10449\n"
                      "shl16insli r9, r9, -23499\n"
                      "shl16insli r9, r9, -25395\n"
                      "shl16insli r9, r9, 17474\n"
                      "move r9, %2\n"
                      "{ fnop  ; ldnt4u_add r19, r9, -95  }\n"
                      "move %0, r19\n"
                      "move %1, r9\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
