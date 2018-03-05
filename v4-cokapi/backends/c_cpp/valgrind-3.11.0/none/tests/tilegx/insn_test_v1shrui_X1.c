//file: _insn_test_v1shrui_X1.c
//op=275
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

unsigned long mem[2] = { 0x420e29019dd4c946, 0x562bb4e51ed838f4 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r11, -14185\n"
                      "shl16insli r11, r11, 11751\n"
                      "shl16insli r11, r11, 25109\n"
                      "shl16insli r11, r11, 30569\n"
                      "moveli r18, 3022\n"
                      "shl16insli r18, r18, -17758\n"
                      "shl16insli r18, r18, 25795\n"
                      "shl16insli r18, r18, 7417\n"
                      "{ fnop  ; v1shrui r11, r18, 41  }\n"
                      "move %0, r11\n"
                      "move %1, r18\n"
                      :"=r"(a[0]),"=r"(a[1]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
