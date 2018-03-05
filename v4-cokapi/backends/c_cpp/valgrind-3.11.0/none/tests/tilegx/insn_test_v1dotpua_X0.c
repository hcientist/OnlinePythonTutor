//file: _insn_test_v1dotpua_X0.c
//op=254
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

unsigned long mem[2] = { 0xba522198b7685638, 0x5038bdaa45b53cd3 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r20, -30432\n"
                      "shl16insli r20, r20, -21685\n"
                      "shl16insli r20, r20, -14635\n"
                      "shl16insli r20, r20, 15094\n"
                      "moveli r49, 3435\n"
                      "shl16insli r49, r49, 5337\n"
                      "shl16insli r49, r49, 12729\n"
                      "shl16insli r49, r49, -31162\n"
                      "moveli r38, -23611\n"
                      "shl16insli r38, r38, 9907\n"
                      "shl16insli r38, r38, 19129\n"
                      "shl16insli r38, r38, 30763\n"
                      "{ v1dotpua r20, r49, r38 ; fnop   }\n"
                      "move %0, r20\n"
                      "move %1, r49\n"
                      "move %2, r38\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
