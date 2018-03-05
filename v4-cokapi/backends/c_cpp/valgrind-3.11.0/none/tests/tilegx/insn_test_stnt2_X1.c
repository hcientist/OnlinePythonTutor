//file: _insn_test_stnt2_X1.c
//op=217
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

unsigned long mem[2] = { 0x4264771eb976f72, 0x85fc92ac292ed02e };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r8, 5764\n"
                      "shl16insli r8, r8, 30540\n"
                      "shl16insli r8, r8, 17158\n"
                      "shl16insli r8, r8, -20975\n"
                      "moveli r18, 25827\n"
                      "shl16insli r18, r18, 7973\n"
                      "shl16insli r18, r18, 5233\n"
                      "shl16insli r18, r18, 29962\n"
                      "move r8, %2\n"
                      "{ fnop  ; stnt2 r8, r18  }\n"
                      "move %0, r8\n"
                      "move %1, r18\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
