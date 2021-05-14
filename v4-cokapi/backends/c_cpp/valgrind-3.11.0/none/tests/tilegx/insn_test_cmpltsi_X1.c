//file: _insn_test_cmpltsi_X1.c
//op=60
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

unsigned long mem[2] = { 0xa702a184ea8a31f7, 0xd5c03dafaeab4e7e };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r4, -686\n"
                      "shl16insli r4, r4, -26042\n"
                      "shl16insli r4, r4, 8081\n"
                      "shl16insli r4, r4, -25541\n"
                      "moveli r24, -12028\n"
                      "shl16insli r24, r24, -6402\n"
                      "shl16insli r24, r24, -9261\n"
                      "shl16insli r24, r24, 9978\n"
                      "{ fnop  ; cmpltsi r4, r24, -23  }\n"
                      "move %0, r4\n"
                      "move %1, r24\n"
                      :"=r"(a[0]),"=r"(a[1]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
