//file: _insn_test_ldnt4s_add_X1.c
//op=145
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

unsigned long mem[2] = { 0xd6233f383d6fcac4, 0xa3f745ffc94270b2 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r17, 20154\n"
                      "shl16insli r17, r17, -1171\n"
                      "shl16insli r17, r17, 18338\n"
                      "shl16insli r17, r17, -23205\n"
                      "moveli r32, -21605\n"
                      "shl16insli r32, r32, -21137\n"
                      "shl16insli r32, r32, 22949\n"
                      "shl16insli r32, r32, -13067\n"
                      "move r32, %2\n"
                      "{ fnop  ; ldnt4s_add r17, r32, 77  }\n"
                      "move %0, r17\n"
                      "move %1, r32\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
